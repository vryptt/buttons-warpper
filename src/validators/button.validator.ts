import { ButtonInput, ButtonValidationResult } from '../types';
import { SOFT_BUTTON_CAP, REQUIRED_FIELDS_MAP } from '../constants';
import { safeJSONParse } from '../utils';

export function parseButtonParams(
  name: string,
  buttonParamsJson: string,
  errors: string[],
  warnings: string[],
  index: number
): any {
  const parsed = safeJSONParse(buttonParamsJson, errors, warnings, index, name);
  if (!parsed) return null;

  const required = REQUIRED_FIELDS_MAP[name] || [];
  required.forEach(field => {
    if (!(field in parsed)) {
      errors.push(`button[${index}] (${name}) missing required field '${field}'`);
    }
  });

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

export function validateAuthoringButtons(
  buttons: ButtonInput[] | null | undefined
): ButtonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (buttons == null) {
    return { errors, warnings, valid: true, cleaned: [] };
  }

  if (!Array.isArray(buttons)) {
    return {
      errors: ['buttons must be an array'],
      warnings,
      valid: false,
      cleaned: []
    };
  }

  if (buttons.length === 0) {
    warnings.push('buttons array is empty');
  } else if (buttons.length > SOFT_BUTTON_CAP) {
    warnings.push(
      `buttons count (${buttons.length}) exceeds soft cap of ${SOFT_BUTTON_CAP}; may be rejected by client`
    );
  }

  const cleaned = buttons.map((b, idx) => {
    if (!b || typeof b !== 'object') {
      errors.push(`button[${idx}] is not an object`);
      return b;
    }

    const btn = b as any;

    // Native flow button
    if (btn.name && btn.buttonParamsJson) {
      if (typeof btn.buttonParamsJson !== 'string') {
        errors.push(`button[${idx}] buttonParamsJson must be string`);
      } else {
        try {
          JSON.parse(btn.buttonParamsJson);
        } catch (e) {
          errors.push(
            `button[${idx}] buttonParamsJson is not valid JSON: ${(e as Error).message}`
          );
        }
      }
      return b;
    }

    // Legacy button
    if (btn.id || btn.text || btn.displayText) {
      if (!(btn.id || btn.text || btn.displayText)) {
        errors.push(`button[${idx}] legacy shape missing id or text/displayText`);
      }
      return b;
    }

    // Old Baileys button
    if (btn.buttonId && btn.buttonText?.displayText) {
      return b;
    }

    // Try to fix buttonParamsJson
    if (btn.buttonParamsJson) {
      if (typeof btn.buttonParamsJson !== 'string') {
        warnings.push(
          `button[${idx}] has non-string buttonParamsJson; will attempt to stringify`
        );
        try {
          btn.buttonParamsJson = JSON.stringify(btn.buttonParamsJson);
        } catch {
          errors.push(`button[${idx}] buttonParamsJson could not be serialized`);
        }
      } else {
        try {
          JSON.parse(btn.buttonParamsJson);
        } catch (e) {
          warnings.push(
            `button[${idx}] buttonParamsJson not valid JSON (${(e as Error).message})`
          );
        }
      }

      if (!btn.name) {
        warnings.push(`button[${idx}] missing name; defaulting to quick_reply`);
        btn.name = 'quick_reply';
      }
      return b;
    }

    warnings.push(`button[${idx}] unrecognized shape; passing through unchanged`);
    return b;
  });

  return { errors, warnings, valid: errors.length === 0, cleaned };
}