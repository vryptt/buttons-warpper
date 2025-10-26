import { NativeFlowButton, ButtonInput, NativeFlowMessageParams } from './button.types';

export interface InteractiveMessageContent {
  contextInfo?: ContextInfo;
  header?: InteractiveHeader;
  body?: {
    text: string | null;
  };
  footer?: {
    text?: string;
  };
  nativeFlowMessage?: {
    buttons: NativeFlowButton[];
    messageParamsJson?: string;
  };
  interactiveMessage?: Record<string, unknown>;
}

export interface AuthoringPayload {
  text: string | null;
  footer?: string;
  title?: string;
  subtitle?: string;
  interactiveButtons?: NativeFlowButton[];
  messageParams?: NativeFlowMessageParams;
  header?: InteractiveHeader;
  contextInfo?: ContextInfo;
}

export interface SendButtonsPayload {
  text: string | null;
  footer?: string;
  title?: string;
  subtitle?: string;
  buttons: ButtonInput[];
  messageParams?: NativeFlowMessageParams;
  header?: InteractiveHeader;
  contextInfo?: ContextInfo;
}

export interface SendOptions {
  useCachedGroupMetadata?: boolean;
  additionalAttributes?: Record<string, any>;
  statusJidList?: string[];
  additionalNodes?: BinaryNode[];
  userJid?: string;
  [key: string]: any;
}

export interface BinaryNode {
  tag: string;
  attrs: Record<string, any>;
  content?: BinaryNode[];
}

export type ButtonType = 'list' | 'buttons' | 'native_flow' | null;

export interface WAMessage {
  key: {
    id: string;
    remoteJid?: string;
    fromMe?: boolean;
    participant?: string;
  };
  message: any;
  messageTimestamp?: number | Long;
  pushName?: string;
  broadcast?: boolean;
  [key: string]: any;
}

export interface Long {
  low: number;
  high: number;
  unsigned: boolean;
}

export interface DocumentMessage {
  url?: string;
  mimetype?: string;
  fileSha256?: string;
  fileLength?: string | number;
  pageCount?: number;
  mediaKey?: string;
  fileName?: string;
  fileEncSha256?: string;
  directPath?: string;
  mediaKeyTimestamp?: string | number;
  jpegThumbnail?: Buffer | string;
}

export interface ImageMessage {
  url?: string;
  mimetype?: string;
  caption?: string;
  fileSha256?: string;
  fileLength?: string | number;
  height?: number;
  width?: number;
  mediaKey?: string;
  fileEncSha256?: string;
  directPath?: string;
  mediaKeyTimestamp?: string | number;
  jpegThumbnail?: Buffer | string;
}

export interface VideoMessage {
  url?: string;
  mimetype?: string;
  caption?: string;
  fileSha256?: string;
  fileLength?: string | number;
  seconds?: number;
  mediaKey?: string;
  height?: number;
  width?: number;
  fileEncSha256?: string;
  directPath?: string;
  mediaKeyTimestamp?: string | number;
  jpegThumbnail?: Buffer | string;
}

export interface ExternalAdReply {
  title?: string;
  body?: string;
  mediaType?: number;
  thumbnailUrl?: string;
  thumbnail?: Buffer | string;
  sourceUrl?: string;
  sourceType?: string;
  sourceId?: string;
  renderLargerThumbnail?: boolean;
  showAdAttribution?: boolean;
  containsAutoReply?: boolean;
  previewType?: string;
}

export interface ContextInfo {
  mentionedJid?: string[];
  groupMentions?: any[];
  forwardingScore?: number;
  isForwarded?: boolean;
  forwardedNewsletterMessageInfo?: any;
  quotedMessage?: any;
  participant?: string;
  stanzaId?: string;
  remoteJid?: string;
  externalAdReply?: ExternalAdReply;
  entryPointConversionSource?: string;
  entryPointConversionApp?: string;
  entryPointConversionDelaySeconds?: number;
  disappearingMode?: any;
  actionLink?: any;
  groupSubject?: string;
  parentGroupJid?: string;
  trustBannerType?: string;
  trustBannerAction?: number;
  isSampled?: boolean;
  utm?: any;
  forwardedNewsletterInfo?: any;
  businessMessageForwardInfo?: any;
  smbClientCampaignId?: string;
  smbServerCampaignId?: string;
  dataSharingContext?: any;
}

export interface InteractiveHeader {
  title?: string;
  subtitle?: string;
  hasMediaAttachment?: boolean;
  documentMessage?: DocumentMessage;
  imageMessage?: ImageMessage;
  videoMessage?: VideoMessage;
}