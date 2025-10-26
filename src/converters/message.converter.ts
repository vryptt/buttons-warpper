import { AuthoringPayload, InteractiveMessageContent } from '../types';

export function convertToInteractiveMessage(
  content: AuthoringPayload
): InteractiveMessageContent | AuthoringPayload {
  if (!content.interactiveButtons || content.interactiveButtons.length === 0) {
    return content;
  }

  const interactiveMessage: InteractiveMessageContent = {
    nativeFlowMessage: {
      buttons: content.interactiveButtons.map(btn => ({
        name: btn.name || 'quick_reply',
        buttonParamsJson: btn.buttonParamsJson
      }))
    }
  };

  if (content.messageParams) {
    interactiveMessage.nativeFlowMessage.messageParamsJson = JSON.stringify(content.messageParams);
  }

  if (content.contextInfo) {
    interactiveMessage.contextInfo = content.contextInfo;
  }

  if (content.header) {
    interactiveMessage.header = content.header;
  } else if (content.title || content.subtitle) {
    interactiveMessage.header = {
      title: content.title || content.subtitle || ''
    };
  }

  if (content.text !== undefined) {
    interactiveMessage.body = { text: content.text };
  }

  if (content.footer) {
    interactiveMessage.footer = { text: content.footer };
  }

  const { interactiveButtons, title, subtitle, text, footer, messageParams, header, contextInfo, ...rest } = content;

  return { ...rest, interactiveMessage };
}