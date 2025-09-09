/**
 * Enhanced wrapper utilities to enable WhiskeySockets (Baileys fork) to send
 * WhatsApp interactive buttons / native flow messages reliably.
 *
 * Context / Rationale:
 *  - Upstream WhiskeySockets currently lacks high‑level helpers for the new
 *    interactive / native flow button format ("interactiveMessage.nativeFlowMessage").
 *  - The regular sendMessage path performs media/content validation that does
 *    not yet recognize interactiveMessage which causes button payloads to fail.
 *  - We bypass that by constructing the message with generateWAMessageFromContent
 *    and calling relayMessage directly while injecting the correct binary nodes
 *    ("biz", "interactive", optional "bot") that the official client emits.
 *
 * What this file offers:
 *  1. Normalization helpers to accept multiple legacy button shapes and map
 *     them into the current native_flow button structure.
 *  2. Logic to detect which button / list type is being sent.
 *  3. Functions to derive the binary node tree WhatsApp expects (getButtonArgs).
 *  4. A safe public helper (sendInteractiveButtonsBasic) for common quick‑reply usage.
 *  5. A lower level power function (sendInteractiveMessage) for full control.
 *
 * Usage (minimal):
 *  const { sendInteractiveButtonsBasic } = require('./buttons-wrapper');
 *  await sendInteractiveButtonsBasic(sock, jid, {
 *    text: 'Choose an option',
 *    footer: 'Footer text',
 *    buttons: [ { id: 'opt1', text: 'Option 1' }, { id: 'opt2', text: 'Option 2' } ]
 *  });
 *
 * All functions are pure / side‑effect free except sendInteractiveMessage which
 * performs network I/O via relayMessage.
 */

/**
 * Normalize various historical / upstream button shapes into the
 * native_flow "buttons" entry (array of { name, buttonParamsJson }).
 *
 * Accepted input shapes (examples):
 *  1. Already native_flow: { name: 'quick_reply', buttonParamsJson: '{...}' }
 *  2. Simple legacy:       { id: 'id1', text: 'My Button' }
 *  3. Old Baileys shape:   { buttonId: 'id1', buttonText: { displayText: 'My Button' } }
 *  4. Any other object is passed through verbatim (caller responsibility).
 *
 * @param {Array<object>} [buttons=[]] Input raw buttons.
 * @returns {Array<object>} Array where each item has at minimum { name, buttonParamsJson }.
 */
function buildInteractiveButtons(buttons = []) {
  return buttons.map((b, i) => {
    // 1. Already full shape (trust caller)
    if (b && b.name && b.buttonParamsJson) return b;

    // 2. Legacy quick reply style -> wrap
    if (b && (b.id || b.text)) {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.text || b.displayText || 'Button ' + (i + 1),
          id: b.id || ('quick_' + (i + 1))
        })
      };
    }

    // 3. Old Baileys style (buttonId + nested buttonText.displayText)
    if (b && b.buttonId && b.buttonText?.displayText) {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.buttonText.displayText,
          id: b.buttonId
        })
      };
    }

    // 4. Unknown shape: do not transform (keeps openness for future kinds)
    return b;
  });
}

/**
 * Validate authoring-time button objects prior to conversion.
 * Accepts the liberal set of historical shapes supported by buildInteractiveButtons.
 * Returns an object with arrays of errors & warnings plus a possibly auto-fixed list.
 * Validation is intentionally permissive: it only blocks clearly malformed input.
 *
 * Allowed shapes per item:
 *  1. Native: { name: string, buttonParamsJson: string(JSON) }
 *  2. Legacy: { id: string, text?: string } OR { text: string }
 *  3. Old Baileys: { buttonId: string, buttonText: { displayText: string } }
 *  4. Any object containing buttonParamsJson that is valid JSON (passes through)
 *
 * @param {Array<object>} buttons Raw user supplied buttons value.
 * @returns {{errors: string[], warnings: string[], valid: boolean, cleaned: Array<object>}}
 */
function validateAuthoringButtons(buttons) {
  const errors = [];
  const warnings = [];
  if (buttons == null) {
    return { errors: [], warnings: [], valid: true, cleaned: [] };
  }
  if (!Array.isArray(buttons)) {
    errors.push('buttons must be an array');
    return { errors, warnings, valid: false, cleaned: [] };
  }
  // WhatsApp quick replies historically limited (e.g. 3) but native flow may allow more; set generous soft cap.
  const SOFT_BUTTON_CAP = 25;
  if (buttons.length === 0) {
    warnings.push('buttons array is empty');
  } else if (buttons.length > SOFT_BUTTON_CAP) {
    warnings.push(`buttons count (${buttons.length}) exceeds soft cap of ${SOFT_BUTTON_CAP}; may be rejected by client`);
  }

  const cleaned = buttons.map((b, idx) => {
    if (b == null || typeof b !== 'object') {
      errors.push(`button[${idx}] is not an object`);
      return b;
    }
    // Native shape
    if (b.name && b.buttonParamsJson) {
      if (typeof b.buttonParamsJson !== 'string') {
        errors.push(`button[${idx}] buttonParamsJson must be string`);
      } else {
        try {
          JSON.parse(b.buttonParamsJson);
        } catch (e) {
          errors.push(`button[${idx}] buttonParamsJson is not valid JSON: ${e.message}`);
        }
      }
      return b;
    }
    // Legacy minimal quick reply
    if (b.id || b.text || b.displayText) {
      if (!(b.id || b.text || b.displayText)) {
        errors.push(`button[${idx}] legacy shape missing id or text/displayText`);
      }
      return b; // buildInteractiveButtons will wrap.
    }
    // Old Baileys shape
    if (b.buttonId && b.buttonText && typeof b.buttonText === 'object' && b.buttonText.displayText) {
      return b;
    }
    // Unknown but attempt to accept if it has buttonParamsJson JSON like value
    if (b.buttonParamsJson) {
      if (typeof b.buttonParamsJson !== 'string') {
        warnings.push(`button[${idx}] has non-string buttonParamsJson; will attempt to stringify`);
        try {
          b.buttonParamsJson = JSON.stringify(b.buttonParamsJson);
        } catch {
          errors.push(`button[${idx}] buttonParamsJson could not be serialized`);
        }
      } else {
        try { JSON.parse(b.buttonParamsJson); } catch (e) { warnings.push(`button[${idx}] buttonParamsJson not valid JSON (${e.message})`); }
      }
      if (!b.name) {
        warnings.push(`button[${idx}] missing name; defaulting to quick_reply`);
        b.name = 'quick_reply';
      }
      return b;
    }
    // If truly unknown and lacks minimal markers, keep but warn.
    warnings.push(`button[${idx}] unrecognized shape; passing through unchanged`);
    return b;
  });

  return { errors, warnings, valid: errors.length === 0, cleaned };
}

// -------------------- ERROR UTILITIES / USER-FRIENDLY FEEDBACK --------------------
/**
 * Custom validation error for interactive messaging helpers.
 * Provides rich structured detail (errors, warnings, example) so callers can
 * surface actionable feedback to end users / logs. The message property remains
 * concise while detailed arrays are attached to the instance and serializable via toJSON.
 */
class InteractiveValidationError extends Error {
  /**
   * @param {string} message High level summary.
   * @param {{context?: string, errors?: string[], warnings?: string[], example?: any}} meta
   */
  constructor(message, { context, errors = [], warnings = [], example } = {}) {
    super(message);
    this.name = 'InteractiveValidationError';
    this.context = context;
    this.errors = errors;
    this.warnings = warnings;
    this.example = example;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      errors: this.errors,
      warnings: this.warnings,
      example: this.example
    };
  }
  /**
   * Produce a verbose multiline string (for console) describing the problem.
   * @returns {string}
   */
  formatDetailed() {
    const lines = [
      `[${this.name}] ${this.message}${this.context ? ' (' + this.context + ')' : ''}`
    ];
    if (this.errors?.length) {
      lines.push('Errors:');
      this.errors.forEach(e => lines.push('  - ' + e));
    }
    if (this.warnings?.length) {
      lines.push('Warnings:');
      this.warnings.forEach(w => lines.push('  - ' + w));
    }
    if (this.example) {
      lines.push('Example payload:', JSON.stringify(this.example, null, 2));
    }
    return lines.join('\n');
  }
}

// Canonical minimal examples to include inside thrown InteractiveValidationError objects.
const EXAMPLE_PAYLOADS = {
  sendButtons: {
    text: 'Choose an option',
    buttons: [
      { id: 'opt1', text: 'Option 1' },
      { id: 'opt2', text: 'Option 2' },
      { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Visit Site', url: 'https://example.com' }) }
    ],
    footer: 'Footer text'
  },
  sendInteractiveMessage: {
    text: 'Pick an action',
    interactiveButtons: [
      { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Hello', id: 'hello' }) },
      { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Code', copy_code: 'ABC123' }) }
    ],
    footer: 'Footer'
  }
};

// -------------------- STRICT FORMAT VALIDATORS (User Spec) --------------------
// Allowed complex button names for sendButtons (legacy quick reply + these cta_* types)
const SEND_BUTTONS_ALLOWED_COMPLEX = new Set(['cta_url', 'cta_copy', 'cta_call']);
// Allowed button names for sendInteractiveMessage (expanded set)
const INTERACTIVE_ALLOWED_NAMES = new Set([
  'quick_reply', 'cta_url', 'cta_copy', 'cta_call', 'cta_catalog', 'cta_reminder', 'cta_cancel_reminder',
  'address_message', 'send_location', 'open_webview', 'mpm', 'wa_payment_transaction_details',
  'automated_greeting_message_view_catalog', 'galaxy_message', 'single_select'
]);

// Required JSON fields per button name (minimal mandatory keys)
const REQUIRED_FIELDS_MAP = {
  cta_url: ['display_text', 'url'],
  cta_copy: ['display_text', 'copy_code'],
  cta_call: ['display_text', 'phone_number'],
  cta_catalog: ['business_phone_number'],
  cta_reminder: ['display_text'],
  cta_cancel_reminder: ['display_text'],
  address_message: ['display_text'],
  send_location: ['display_text'],
  open_webview: ['title', 'link'], // link further validated
  mpm: ['product_id'],
  wa_payment_transaction_details: ['transaction_id'],
  automated_greeting_message_view_catalog: ['business_phone_number', 'catalog_product_id'],
  galaxy_message: ['flow_token', 'flow_id'],
  single_select: ['title', 'sections'],
  quick_reply: ['display_text', 'id']
};

function parseButtonParams(name, buttonParamsJson, errors, warnings, index) {
  let parsed;
  try {
    parsed = JSON.parse(buttonParamsJson);
  } catch (e) {
    errors.push(`button[${index}] (${name}) invalid JSON: ${e.message}`);
    return null;
  }
  const req = REQUIRED_FIELDS_MAP[name] || [];
  for (const f of req) {
    if (!(f in parsed)) {
      errors.push(`button[${index}] (${name}) missing required field '${f}'`);
    }
  }
  // Additional nested validation
  if (name === 'open_webview' && parsed.link) {
    if (typeof parsed.link !== 'object' || !parsed.link.url) {
      errors.push(`button[${index}] (open_webview) link.url required`);
    }
  }
  if (name === 'single_select') {
    if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      errors.push(`button[${index}] (single_select) sections must be non-empty array`);
    }
  }
  return parsed;
}

/**
 * Strict validator for sendButtons input per user specification.
 * Format: { text: string, buttons: [...] , optional title/subtitle/footer }
 * Allowed button shapes:
 *   1. Legacy quick reply: { id, text }
 *   2. Named buttons: name in SEND_BUTTONS_ALLOWED_COMPLEX with valid buttonParamsJson & required fields
 */
function validateSendButtonsPayload(data) {
  const errors = [];
  const warnings = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload must be an object'], warnings };
  }
  if (!data.text || typeof data.text !== 'string') {
    errors.push('text is mandatory and must be a string');
  }
  if (!Array.isArray(data.buttons) || data.buttons.length === 0) {
    errors.push('buttons is mandatory and must be a non-empty array');
  } else {
    data.buttons.forEach((btn, i) => {
      if (!btn || typeof btn !== 'object') {
        errors.push(`button[${i}] must be an object`);
        return;
      }
      // Legacy quick reply
      if (btn.id && btn.text) {
        if (typeof btn.id !== 'string' || typeof btn.text !== 'string') {
          errors.push(`button[${i}] legacy quick reply id/text must be strings`);
        }
        return;
      }
      if (btn.name && btn.buttonParamsJson) {
        if (!SEND_BUTTONS_ALLOWED_COMPLEX.has(btn.name)) {
          errors.push(`button[${i}] name '${btn.name}' not allowed in sendButtons`);
          return;
        }
        if (typeof btn.buttonParamsJson !== 'string') {
          errors.push(`button[${i}] buttonParamsJson must be string`);
          return;
        }
        parseButtonParams(btn.name, btn.buttonParamsJson, errors, warnings, i);
        return;
      }
      errors.push(`button[${i}] invalid shape (must be legacy quick reply or named ${Array.from(SEND_BUTTONS_ALLOWED_COMPLEX).join(', ')})`);
    });
  }
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Strict validator for sendInteractiveMessage authoring payload (before conversion).
 * Expected: { text: string, interactiveButtons: [ { name, buttonParamsJson } ... ], optional title/subtitle/footer }
 */
function validateSendInteractiveMessagePayload(data) {
  const errors = [];
  const warnings = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload must be an object'], warnings };
  }
  if (!data.text || typeof data.text !== 'string') {
    errors.push('text is mandatory and must be a string');
  }
  if (!Array.isArray(data.interactiveButtons) || data.interactiveButtons.length === 0) {
    errors.push('interactiveButtons is mandatory and must be a non-empty array');
  } else {
    data.interactiveButtons.forEach((btn, i) => {
      if (!btn || typeof btn !== 'object') {
        errors.push(`interactiveButtons[${i}] must be an object`);
        return;
      }
      if (!btn.name || typeof btn.name !== 'string') {
        errors.push(`interactiveButtons[${i}] missing name`);
        return;
      }
      if (!INTERACTIVE_ALLOWED_NAMES.has(btn.name)) {
        errors.push(`interactiveButtons[${i}] name '${btn.name}' not allowed`);
        return;
      }
      if (!btn.buttonParamsJson || typeof btn.buttonParamsJson !== 'string') {
        errors.push(`interactiveButtons[${i}] buttonParamsJson must be string`);
        return;
      }
      parseButtonParams(btn.name, btn.buttonParamsJson, errors, warnings, i);
    });
  }
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate top-level interactive content just before WAMessage creation.
 * Ensures that if interactiveButtons OR interactiveMessage.nativeFlowMessage is present,
 * the internal button array meets minimal structural requirements.
 *
 * @param {object} content Converted content (after optional convertToInteractiveMessage call).
 * @returns {{errors: string[], warnings: string[], valid: boolean}}
 */
function validateInteractiveMessageContent(content) {
  const errors = [];
  const warnings = [];
  if (!content || typeof content !== 'object') {
    return { errors: ['content must be an object'], warnings, valid: false };
  }
  const interactive = content.interactiveMessage;
  if (!interactive) {
    // Non-interactive messages are acceptable; nothing to validate.
    return { errors, warnings, valid: true };
  }
  const nativeFlow = interactive.nativeFlowMessage;
  if (!nativeFlow) {
    errors.push('interactiveMessage.nativeFlowMessage missing');
    return { errors, warnings, valid: false };
  }
  if (!Array.isArray(nativeFlow.buttons)) {
    errors.push('nativeFlowMessage.buttons must be an array');
    return { errors, warnings, valid: false };
  }
  if (nativeFlow.buttons.length === 0) {
    warnings.push('nativeFlowMessage.buttons is empty');
  }
  nativeFlow.buttons.forEach((btn, i) => {
    if (!btn || typeof btn !== 'object') {
      errors.push(`buttons[${i}] is not an object`);
      return;
    }
    if (!btn.buttonParamsJson) {
      warnings.push(`buttons[${i}] missing buttonParamsJson (may fail to render)`);
    } else if (typeof btn.buttonParamsJson !== 'string') {
      errors.push(`buttons[${i}] buttonParamsJson must be string`);
    } else {
      try { JSON.parse(btn.buttonParamsJson); } catch (e) { warnings.push(`buttons[${i}] buttonParamsJson invalid JSON (${e.message})`); }
    }
    if (!btn.name) {
      warnings.push(`buttons[${i}] missing name; defaulting to quick_reply`);
      btn.name = 'quick_reply';
    }
  });
  return { errors, warnings, valid: errors.length === 0 };
}

/**
 * Detects button type from normalized message content
 * Mirrors itsukichan's getButtonType function
 */
/**
 * Determine which interactive category a normalized message belongs to.
 * (Normalization is performed by Baileys' normalizeMessageContent beforehand.)
 *
 * @param {object} message A message content object (part of WAMessage.message).
 * @returns {'list'|'buttons'|'native_flow'|null} Type identifier or null if not interactive.
 */
function getButtonType(message) {
  if (message.listMessage) {
    return 'list';
  } else if (message.buttonsMessage) {
    return 'buttons';
  } else if (message.interactiveMessage?.nativeFlowMessage) {
    return 'native_flow';
  }
  return null;
}

/**
 * Creates the proper binary node structure for buttons
 * Mirrors itsukichan's getButtonArgs function
 */
/**
 * Produce the binary node (WABinary-like JSON shape) required for the specific
 * interactive button / list type. Mirrors itsukichan's implementation to stay
 * compatible with observed official client traffic.
 *
 * NOTE: Returning different "v" (version) and "name" values influences how
 * WhatsApp renders & validates flows. The constants here are empirically derived.
 *
 * @param {object} message Normalized message content (after Baileys normalization).
 * @returns {object} A node with shape { tag, attrs, [content] } to inject into additionalNodes.
 */
function getButtonArgs(message) {
  const nativeFlow = message.interactiveMessage?.nativeFlowMessage;
  const firstButtonName = nativeFlow?.buttons?.[0]?.name;
  // Button names having dedicated specialized flow nodes.
  const nativeFlowSpecials = [
    'mpm', 'cta_catalog', 'send_location',
    'call_permission_request', 'wa_payment_transaction_details',
    'automated_greeting_message_view_catalog'
  ];

  // Payment / order flows: attach native_flow_name directly.
  if (nativeFlow && (firstButtonName === 'review_and_pay' || firstButtonName === 'payment_info')) {
    return {
      tag: 'biz',
      attrs: {
        native_flow_name: firstButtonName === 'review_and_pay' ? 'order_details' : firstButtonName
      }
    };
  } else if (nativeFlow && nativeFlowSpecials.includes(firstButtonName)) {
    // Specialized native flows (only working for WA original client).
    return {
      tag: 'biz',
      attrs: {},
      content: [{
        tag: 'interactive',
        attrs: {
          type: 'native_flow',
          v: '1'
        },
        content: [{
          tag: 'native_flow',
          attrs: {
            v: '2',
            name: firstButtonName
          }
        }]
      }]
    };
  } else if (nativeFlow || message.buttonsMessage) {
    // Generic / mixed interactive buttons case (works in original + business clients).
    return {
      tag: 'biz',
      attrs: {},
      content: [{
        tag: 'interactive',
        attrs: {
          type: 'native_flow',
          v: '1'
        },
        content: [{
          tag: 'native_flow',
          attrs: {
            v: '9',
            name: 'mixed'
          }
        }]
      }]
    };
  } else if (message.listMessage) {
    // Product list style (listMessage) mapping.
    return {
      tag: 'biz',
      attrs: {},
      content: [{
        tag: 'list',
        attrs: {
          v: '2',
          type: 'product_list'
        }
      }]
    };
  } else {
    // Non-interactive: still need a basic biz node for consistency.
    return {
      tag: 'biz',
      attrs: {}
    };
  }
}

/**
 * Converts interactiveButtons format to proper protobuf message structure
 * WhiskeySockets needs interactiveMessage.nativeFlowMessage structure for buttons to work
 */
/**
 * Transform a temporary high-level shape:
 *  { text, footer, title?, subtitle?, interactiveButtons: [{ name?, buttonParamsJson? | legacy }...] }
 * into the exact structure WhiskeySockets expects in the WAMessage:
 *  { interactiveMessage: { nativeFlowMessage: { buttons: [...] }, header?, body?, footer? } }
 *
 * The original convenience fields are stripped so we do not leak custom keys
 * into generateWAMessageFromContent.
 *
 * @param {object} content High level authoring content.
 * @returns {object} New content object ready for generateWAMessageFromContent.
 */
function convertToInteractiveMessage(content) {
  if (content.interactiveButtons && content.interactiveButtons.length > 0) {
    // Build nativeFlowMessage.buttons array (already normalized earlier).
    const interactiveMessage = {
      nativeFlowMessage: {
        buttons: content.interactiveButtons.map(btn => ({
          name: btn.name || 'quick_reply',
          buttonParamsJson: btn.buttonParamsJson
        }))
      }
    };

    // Optional header.
    if (content.title || content.subtitle) {
      interactiveMessage.header = {
        title: content.title || content.subtitle || ''
      };
    }
    // Body text.
    if (content.text) {
      interactiveMessage.body = { text: content.text };
    }
    // Footer.
    if (content.footer) {
      interactiveMessage.footer = { text: content.footer };
    }

    // Strip authoring-only fields to avoid duplications / unexpected serialization.
    const newContent = { ...content };
    delete newContent.interactiveButtons;
    delete newContent.title;
    delete newContent.subtitle;
    delete newContent.text;
    delete newContent.footer;

    return { ...newContent, interactiveMessage };
  }
  return content;
}

/**
 * Enhanced sendMessage function for WhiskeySockets that bypasses the internal sendMessage
 * and creates interactiveMessage manually + relayMessage directly like itsukichan does
 * This provides full control over additionalNodes for button functionality
 */
/**
 * Low‑level power helper that sends any interactive message by:
 *  1. Converting authoring content into interactiveMessage/nativeFlowMessage.
 *  2. Building a WAMessage via generateWAMessageFromContent (skips unsupported validation).
 *  3. Deriving & injecting required binary nodes (biz / interactive / bot) into relayMessage.
 *
 * Responsibility for retries / ack handling remains with the caller, identical to
 * normal Baileys usage.
 *
 * @param {import('./WhiskeySockets')} sock Active Baileys-like socket instance.
 * @param {string} jid Chat JID (individual or group) to send to.
 * @param {object} content High-level message content (may include interactiveButtons).
 * @param {object} [options] Additional Baileys send options (forwarding, status, etc.).
 * @returns {Promise<object>} The constructed full WAMessage object (same shape as sendMessage would resolve to).
 * @throws {Error} If required WhiskeySockets internals are unavailable.
 */
async function sendInteractiveMessage(sock, jid, content, options = {}) {
  if (!sock) {
  throw new InteractiveValidationError('Socket is required', { context: 'sendInteractiveMessage' });
  }

  // Strict authoring validation if raw interactiveButtons provided (pre-conversion form).
  if (content && Array.isArray(content.interactiveButtons)) {
    const strict = validateSendInteractiveMessagePayload(content);
    if (!strict.valid) {
      throw new InteractiveValidationError('Interactive authoring payload invalid', {
        context: 'sendInteractiveMessage.validateSendInteractiveMessagePayload',
        errors: strict.errors,
        warnings: strict.warnings,
        example: EXAMPLE_PAYLOADS.sendInteractiveMessage
      });
    }
    if (strict.warnings.length) console.warn('sendInteractiveMessage warnings:', strict.warnings);
  }

  // Step 1: Convert authoring-time interactiveButtons to native_flow structure.
  const convertedContent = convertToInteractiveMessage(content);

  // Step 1a: Validate converted content (interactive portion only).
  const { errors: contentErrors, warnings: contentWarnings, valid: contentValid } = validateInteractiveMessageContent(convertedContent);
  if (!contentValid) {
    throw new InteractiveValidationError('Converted interactive content invalid', {
      context: 'sendInteractiveMessage.validateInteractiveMessageContent',
      errors: contentErrors,
      warnings: contentWarnings,
      example: convertToInteractiveMessage(EXAMPLE_PAYLOADS.sendInteractiveMessage)
    });
  }
  if (contentWarnings.length) {
    // Non-fatal; surface in log for developer insight.
    console.warn('Interactive content warnings:', contentWarnings);
  }

  // Step 2: Obtain needed internal helper functions.
  let generateWAMessageFromContent, relayMessage, normalizeMessageContent, isJidGroup, generateMessageIDV2;
  // Attempt to load from installed baileys package (modern WhiskeySockets fork published as 'baileys').
  const candidatePkgs = ['baileys', '@whiskeysockets/baileys', '@adiwajshing/baileys'];
  let loaded = false;
  for (const pkg of candidatePkgs) {
    if (loaded) break;
    try {
      const mod = require(pkg);
      // Newer versions export these helpers at top-level or nested.
      generateWAMessageFromContent = mod.generateWAMessageFromContent || mod.Utils?.generateWAMessageFromContent;
      normalizeMessageContent = mod.normalizeMessageContent || mod.Utils?.normalizeMessageContent;
      isJidGroup = mod.isJidGroup || mod.WABinary?.isJidGroup;
      generateMessageIDV2 = mod.generateMessageIDV2 || mod.Utils?.generateMessageIDV2 || mod.generateMessageID || mod.Utils?.generateMessageID;
      relayMessage = sock.relayMessage; // provided by socket instance
      if (generateWAMessageFromContent && normalizeMessageContent && isJidGroup && relayMessage) {
        loaded = true;
      }
    } catch (_) { /* try next */ }
  }
  if (!loaded) {
    throw new InteractiveValidationError('Missing baileys internals', {
      context: 'sendInteractiveMessage.dynamicImport',
      errors: ['generateWAMessageFromContent or normalizeMessageContent not found in installed packages: baileys / @whiskeysockets/baileys / @adiwajshing/baileys'],
      example: { install: 'npm i baileys', requireUsage: "const { generateWAMessageFromContent } = require('baileys')" }
    });
  }

  // Step 3: Build the WAMessage manually.
  const userJid = sock.authState?.creds?.me?.id || sock.user?.id;
  const fullMsg = generateWAMessageFromContent(jid, convertedContent, {
    logger: sock.logger,
    userJid,
    messageId: generateMessageIDV2(userJid),
    timestamp: new Date(),
    ...options
  });

  // Step 4: Inspect content to decide which additionalNodes to attach.
  const normalizedContent = normalizeMessageContent(fullMsg.message);
  const buttonType = getButtonType(normalizedContent);
  let additionalNodes = [...(options.additionalNodes || [])];
  if (buttonType) {
    const buttonsNode = getButtonArgs(normalizedContent);
    const isPrivate = !isJidGroup(jid);
    additionalNodes.push(buttonsNode);
    // Private chats require a bot node for interactive functionality.
    if (isPrivate) {
      additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
    }
    // Useful diagnostic log (keep concise to avoid leaking full content).
    console.log('Interactive send: ', {
      type: buttonType,
      nodes: additionalNodes.map(n => ({ tag: n.tag, attrs: n.attrs })),
      private: !isJidGroup(jid)
    });
  }

  // Step 5: Relay with injected nodes.
  await relayMessage(jid, fullMsg.message, {
    messageId: fullMsg.key.id,
    useCachedGroupMetadata: options.useCachedGroupMetadata,
    additionalAttributes: options.additionalAttributes || {},
    statusJidList: options.statusJidList,
    additionalNodes
  });

  // Step 6 (optional): Emit to local event stream so client consumers receive it immediately.
  // Disable for group messages to prevent duplicate message processing
  const isPrivateChat = !isJidGroup(jid);
  if (sock.config?.emitOwnEvents && isPrivateChat) {
    process.nextTick(() => {
      if (sock.processingMutex?.mutex && sock.upsertMessage) {
        sock.processingMutex.mutex(() => sock.upsertMessage(fullMsg, 'append'));
      }
    });
  }

  return fullMsg;
}

/**
 * Simplified button sending function (template functionality removed as requested)
 * Uses the enhanced sendInteractiveMessage function that bypasses WhiskeySockets' sendMessage
 */
/**
 * Public convenience wrapper for the most common quick‑reply use case.
 * Accepts a simplified data object and dispatches a properly formatted
 * interactive native flow message. Templates / advanced flows intentionally
 * omitted for clarity.
 *
 * @param {object} sock Active socket instance (from WhiskeySockets connect).
 * @param {string} jid Destination chat JID.
 * @param {object} [data] High level authoring fields.
 * @param {string} [data.text] Primary body text.
 * @param {string} [data.footer] Footer text.
 * @param {string} [data.title] Header title (if provided becomes header title).
 * @param {string} [data.subtitle] Alternate header source if title absent.
 * @param {Array<object>} [data.buttons] Array of button descriptors (see buildInteractiveButtons docs).
 * @param {object} [options] Pass-through relay/send options.
 * @returns {Promise<object>} Resulting WAMessage.
 */
async function sendInteractiveButtonsBasic(sock, jid, data = {}, options = {}) {
  if (!sock) {
  throw new InteractiveValidationError('Socket is required', { context: 'sendButtons' });
  }

  const { text = '', footer = '', title, subtitle, buttons = [] } = data;
  // Strict payload validation for sendButtons format.
  const strict = validateSendButtonsPayload({ text, buttons, title, subtitle, footer });
  if (!strict.valid) {
    throw new InteractiveValidationError('Buttons payload invalid', {
      context: 'sendButtons.validateSendButtonsPayload',
      errors: strict.errors,
      warnings: strict.warnings,
      example: EXAMPLE_PAYLOADS.sendButtons
    });
  }
  if (strict.warnings.length) console.warn('sendButtons warnings:', strict.warnings);
  // Validate authoring buttons early to provide clearer feedback.
  const { errors, warnings, cleaned } = validateAuthoringButtons(buttons);
  if (errors.length) {
    throw new InteractiveValidationError('Authoring button objects invalid', {
      context: 'sendButtons.validateAuthoringButtons',
      errors,
      warnings,
      example: EXAMPLE_PAYLOADS.sendButtons.buttons
    });
  }
  if (warnings.length) {
    console.warn('Button validation warnings:', warnings);
  }
  const interactiveButtons = buildInteractiveButtons(cleaned);

  // Authoring payload (transformed later by convertToInteractiveMessage).
  const payload = { text, footer, interactiveButtons };
  if (title) payload.title = title;
  if (subtitle) payload.subtitle = subtitle;

  return sendInteractiveMessage(sock, jid, payload, options);
}

module.exports = { 
  sendButtons: sendInteractiveButtonsBasic,
  sendInteractiveMessage,
  getButtonType,
  getButtonArgs,
  InteractiveValidationError,
  // Export validators for external pre-flight usage / testing.
  validateAuthoringButtons,
  validateInteractiveMessageContent,
  validateSendButtonsPayload,
  validateSendInteractiveMessagePayload
};
