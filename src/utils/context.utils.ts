import { ContextInfo, ExternalAdReply } from '../types';

export interface ExternalAdReplyOptions {
  title?: string;
  body?: string;
  thumbnailUrl?: string;
  thumbnail?: Buffer | string;
  sourceUrl?: string;
  mediaType?: number;
  renderLargerThumbnail?: boolean;
  showAdAttribution?: boolean;
}

export function createExternalAdReply(
  options: ExternalAdReplyOptions
): ExternalAdReply {
  return {
    title: options.title || '',
    body: options.body || '',
    thumbnailUrl: options.thumbnailUrl,
    thumbnail: options.thumbnail,
    sourceUrl: options.sourceUrl,
    mediaType: options.mediaType || 1,
    renderLargerThumbnail: options.renderLargerThumbnail || false,
    showAdAttribution: options.showAdAttribution || false
  };
}

export function createContextInfo(
  mentionedJid: string[] = [],
  externalAdReply?: ExternalAdReplyOptions
): ContextInfo {
  const contextInfo: ContextInfo = {};

  if (mentionedJid.length > 0) {
    contextInfo.mentionedJid = mentionedJid;
  }

  if (externalAdReply) {
    contextInfo.externalAdReply = createExternalAdReply(externalAdReply);
  }

  return contextInfo;
}