import { AuthoringPayload, InteractiveMessageContent } from '../types';

export function convertToInteractiveMessage(
  content: AuthoringPayload
): InteractiveMessageContent | AuthoringPayload {
  if (!content.interactiveButtons || content.interactiveButtons.length === 0) {
    return content;
  }

  const interactiveMessage: any = {
    nativeFlowMessage: {
      buttons: content.interactiveButtons.map(btn => ({
        name: btn.name || 'quick_reply',
        buttonParamsJson: btn.buttonParamsJson
      }))
    }
  };

  if (content.title || content.subtitle) {
    interactiveMessage.header = {
      title: content.title || content.subtitle || ''
    };
  }

  if (content.text) {
    interactiveMessage.body = { text: content.text };
  }

  if (content.footer) {
    interactiveMessage.footer = { text: content.footer };
  }

  const { interactiveButtons, title, subtitle, text, footer, ...rest } = content;
  return { ...rest, interactiveMessage };
}