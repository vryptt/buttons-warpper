import { ButtonInput, NativeFlowButton } from '../types';

export function isLegacyButton(btn: any): boolean {
  return Boolean(btn?.id || btn?.text);
}

export function isOldBaileysButton(btn: any): boolean {
  return Boolean(btn?.buttonId && btn?.buttonText?.displayText);
}

export function isNativeFlowButton(btn: any): boolean {
  return Boolean(btn?.name && btn?.buttonParamsJson);
}

export function buildInteractiveButtons(buttons: ButtonInput[] = []): NativeFlowButton[] {
  return buttons.map((b, i) => {
    if (isNativeFlowButton(b)) {
      return b as NativeFlowButton;
    }

    if (isLegacyButton(b)) {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: (b as any).text || (b as any).displayText || `Button ${i + 1}`,
          id: (b as any).id || `quick_${i + 1}`
        })
      };
    }

    if (isOldBaileysButton(b)) {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: (b as any).buttonText.displayText,
          id: (b as any).buttonId
        })
      };
    }

    return b as NativeFlowButton;
  });
}