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
    throw new Error('Socket is required');
  }

  // Step 1: Convert authoring-time interactiveButtons to native_flow structure.
  const convertedContent = convertToInteractiveMessage(content);

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
    throw new Error('Unable to load required baileys internals (generateWAMessageFromContent, normalizeMessageContent). Ensure the "baileys" package is installed.');
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
    throw new Error('Socket is required');
  }

  const { text = '', footer = '', title, subtitle, buttons = [] } = data;
  const interactiveButtons = buildInteractiveButtons(buttons);

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
  getButtonArgs
};
