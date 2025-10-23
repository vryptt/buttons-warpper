import {
  AuthoringPayload,
  SendButtonsPayload,
  SendOptions,
  WAMessage
} from '../types';
import { InteractiveValidationError } from '../errors/InteractiveValidationError';
import { EXAMPLE_PAYLOADS } from '../constants';
import {
  validateSendInteractiveMessagePayload,
  validateInteractiveMessageContent,
  validateSendButtonsPayload,
  validateAuthoringButtons
} from '../validators';
import { convertToInteractiveMessage } from '../converters';
import { getButtonType, getButtonArgs } from '../builders';
import { loadBaileysInternals, buildInteractiveButtons } from '../utils';

export async function sendInteractiveMessage(
  sock: any,
  jid: string,
  content: AuthoringPayload,
  options: SendOptions = {}
): Promise<WAMessage> {
  if (!sock) {
    throw new InteractiveValidationError('Socket is required', {
      context: 'sendInteractiveMessage'
    });
  }

  if (content?.interactiveButtons) {
    const validation = validateSendInteractiveMessagePayload(content);
    if (!validation.valid) {
      throw new InteractiveValidationError('Interactive authoring payload invalid', {
        context: 'sendInteractiveMessage.validate',
        errors: validation.errors,
        warnings: validation.warnings,
        example: EXAMPLE_PAYLOADS.sendInteractiveMessage
      });
    }
    if (validation.warnings.length > 0) {
      console.warn('sendInteractiveMessage warnings:', validation.warnings);
    }
  }

  const convertedContent = convertToInteractiveMessage(content);
  const contentValidation = validateInteractiveMessageContent(convertedContent);

  if (!contentValidation.valid) {
    throw new InteractiveValidationError('Converted interactive content invalid', {
      context: 'sendInteractiveMessage.validateContent',
      errors: contentValidation.errors,
      warnings: contentValidation.warnings,
      example: convertToInteractiveMessage(EXAMPLE_PAYLOADS.sendInteractiveMessage)
    });
  }

  if (contentValidation.warnings.length > 0) {
    console.warn('Interactive content warnings:', contentValidation.warnings);
  }

  const {
    generateWAMessageFromContent,
    normalizeMessageContent,
    isJidGroup,
    generateMessageIDV2,
    relayMessage
  } = loadBaileysInternals(sock);

  const userJid = sock.authState?.creds?.me?.id || sock.user?.id;
  const fullMsg = generateWAMessageFromContent(jid, convertedContent, {
    logger: sock.logger,
    userJid,
    messageId: generateMessageIDV2(userJid),
    timestamp: new Date(),
    ...options
  });

  const normalizedContent = normalizeMessageContent(fullMsg.message);
  const buttonType = getButtonType(normalizedContent);
  const additionalNodes = [...(options.additionalNodes || [])];

  if (buttonType) {
    const buttonsNode = getButtonArgs(normalizedContent);
    const isPrivate = !isJidGroup(jid);

    additionalNodes.push(buttonsNode);
    if (isPrivate) {
      additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
    }

    console.log('Interactive send:', {
      type: buttonType,
      nodes: additionalNodes.map(n => ({ tag: n.tag, attrs: n.attrs })),
      private: isPrivate
    });
  }
  
  await relayMessage(jid, fullMsg.message, {
    messageId: fullMsg.key.id,
    useCachedGroupMetadata: options.useCachedGroupMetadata,
    additionalAttributes: options.additionalAttributes || {},
    statusJidList: options.statusJidList,
    additionalNodes
  });

  if (sock.config?.emitOwnEvents && !isJidGroup(jid)) {
    process.nextTick(() => {
      if (sock.processingMutex?.mutex && sock.upsertMessage) {
        sock.processingMutex.mutex(() => sock.upsertMessage(fullMsg, 'append'));
      }
    });
  }

  return fullMsg;
}

export async function sendButtons(
  sock: any,
  jid: string,
  data: SendButtonsPayload,
  options: SendOptions = {}
): Promise<WAMessage> {
  if (!sock) {
    throw new InteractiveValidationError('Socket is required', {
      context: 'sendButtons'
    });
  }

  const { text = '', footer = '', title, subtitle, buttons = [] } = data;
  const validation = validateSendButtonsPayload({
    text,
    buttons,
    title,
    subtitle,
    footer
  });

  if (!validation.valid) {
    throw new InteractiveValidationError('Buttons payload invalid', {
      context: 'sendButtons.validate',
      errors: validation.errors,
      warnings: validation.warnings,
      example: EXAMPLE_PAYLOADS.sendButtons
    });
  }

  if (validation.warnings.length > 0) {
    console.warn('sendButtons warnings:', validation.warnings);
  }

  const buttonValidation = validateAuthoringButtons(buttons);
  if (buttonValidation.errors.length > 0) {
    throw new InteractiveValidationError('Authoring button objects invalid', {
      context: 'sendButtons.validateButtons',
      errors: buttonValidation.errors,
      warnings: buttonValidation.warnings,
      example: EXAMPLE_PAYLOADS.sendButtons.buttons
    });
  }

  if (buttonValidation.warnings.length > 0) {
    console.warn('Button validation warnings:', buttonValidation.warnings);
  }

  const payload: AuthoringPayload = {
    text,
    footer,
    interactiveButtons: buildInteractiveButtons(buttonValidation.cleaned),
    ...(title && { title }),
    ...(subtitle && { subtitle })
  };

  return sendInteractiveMessage(sock, jid, payload, options);
}