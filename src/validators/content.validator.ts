import { ValidationResult, InteractiveMessageContent } from '../types';

export function validateInteractiveMessageContent(content: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || typeof content !== 'object') {
    return { errors: ['content must be an object'], warnings, valid: false };
  }

  const interactive = content.interactiveMessage;
  if (!interactive) {
    return { errors, warnings, valid: true };
  }

  const nativeFlow = interactive.nativeFlowMessage;
  if (!nativeFlow) {
    return {
      errors: ['interactiveMessage.nativeFlowMessage missing'],
      warnings,
      valid: false
    };
  }

  if (!Array.isArray(nativeFlow.buttons)) {
    return {
      errors: ['nativeFlowMessage.buttons must be an array'],
      warnings,
      valid: false
    };
  }

  if (nativeFlow.buttons.length === 0) {
    warnings.push('nativeFlowMessage.buttons is empty');
  }

  nativeFlow.buttons.forEach((btn: any, i: number) => {
    if (!btn || typeof btn !== 'object') {
      errors.push(`buttons[${i}] is not an object`);
      return;
    }

    if (!btn.buttonParamsJson) {
      warnings.push(`buttons[${i}] missing buttonParamsJson (may fail to render)`);
    } else if (typeof btn.buttonParamsJson !== 'string') {
      errors.push(`buttons[${i}] buttonParamsJson must be string`);
    } else {
      try {
        JSON.parse(btn.buttonParamsJson);
      } catch (e) {
        warnings.push(`buttons[${i}] buttonParamsJson invalid JSON (${(e as Error).message})`);
      }
    }

    if (!btn.name) {
      warnings.push(`buttons[${i}] missing name; defaulting to quick_reply`);
      btn.name = 'quick_reply';
    }
  });

  return { errors, warnings, valid: errors.length === 0 };
}