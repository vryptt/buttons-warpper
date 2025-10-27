import { InteractiveHeader } from '../types';

export interface MediaOptions {
  fileName?: string;
  caption?: string;
  mimetype?: string;
  fileLength?: string | number;
  pageCount?: number;
  jpegThumbnail?: Buffer | string;
}

export function createDocumentHeader(
  url: string,
  options: MediaOptions = {}
): InteractiveHeader {
  return {
    hasMediaAttachment: true,
    documentMessage: {
      url,
      mimetype: options.mimetype || 'application/pdf',
      fileName: options.fileName || 'document.pdf',
      fileLength: options.fileLength || '999999999999'
    }
  };
}

export function createImageHeader(
  url: string,
  options: MediaOptions = {}
): InteractiveHeader {
  return {
    hasMediaAttachment: true,
    imageMessage: {
      url,
      mimetype: options.mimetype || 'image/jpeg',
      caption: options.caption,
      fileLength: options.fileLength || '999999',
      jpegThumbnail: options.jpegThumbnail
    }
  };
}

export function createVideoHeader(
  url: string,
  options: MediaOptions = {}
): InteractiveHeader {
  return {
    hasMediaAttachment: true,
    videoMessage: {
      url,
      mimetype: options.mimetype || 'video/mp4',
      caption: options.caption,
      fileLength: options.fileLength || '999999',
      jpegThumbnail: options.jpegThumbnail
    }
  };
}