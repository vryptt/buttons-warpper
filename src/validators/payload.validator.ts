import { ValidationResult } from '../types';
import {
  SEND_BUTTONS_ALLOWED_COMPLEX,
  INTERACTIVE_ALLOWED_NAMES
} from '../constants';
import { parseButtonParams } from './button.validator';

export function validateSendButtonsPayload(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload must be an object'], warnings };
  }

  if (!data.text || typeof data.text !== 'string') {
    errors.push('text is mandatory and must be a string');
  }

  if (!Array.isArray(data.buttons) || data.buttons.length === 0) {
    errors.push('buttons is mandatory and must be a non-empty array');
  } else {
    data.buttons.forEach((btn: any, i: number) => {
      if (!btn || typeof btn !== 'object') {
        errors.push(`button[${i}] must be an object`);
        return;
      }

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

      errors.push(
        `button[${i}] invalid shape (must be legacy quick reply or named ${[...SEND_BUTTONS_ALLOWED_COMPLEX].join(', ')})`
      );
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateSendInteractiveMessagePayload(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload must be an object'], warnings };
  }

  if (!data.text || typeof data.text !== 'string') {
    errors.push('text is mandatory and must be a string');
  }

  if (!Array.isArray(data.interactiveButtons) || data.interactiveButtons.length === 0) {
    errors.push('interactiveButtons is mandatory and must be a non-empty array');
  } else {
    data.interactiveButtons.forEach((btn: any, i: number) => {
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
