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
      fileLength: options.fileLength || '999999999999',
      pageCount: options.pageCount || 0,
      fileSha256: '+gmvvCB6ckJSuuG3ZOzHsTBgRAukejv1nnfwGSSSS/4=',
      mediaKey: 'MWO6fI223TY8T0i9onNcwNBBPldWfwp1j1FPKCiJFzw=',
      fileEncSha256: 'ZS8v9tio2un1yWVOOG3lwBxiP+mNgaKPY9+wl5pEoi8=',
      directPath: '/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc',
      mediaKeyTimestamp: Date.now().toString(),
      ...(options.jpegThumbnail && { jpegThumbnail: options.jpegThumbnail })
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
      fileSha256: 'imageHash',
      fileLength: options.fileLength || '999999',
      mediaKey: 'imageMediaKey',
      fileEncSha256: 'imageEncHash',
      directPath: '/v/t62.7118-24/image.enc',
      mediaKeyTimestamp: Date.now().toString(),
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
      fileSha256: 'videoHash',
      fileLength: options.fileLength || '999999',
      seconds: 0,
      mediaKey: 'videoMediaKey',
      height: 720,
      width: 1280,
      fileEncSha256: 'videoEncHash',
      directPath: '/v/t62.7119-24/video.enc',
      mediaKeyTimestamp: Date.now().toString(),
      jpegThumbnail: options.jpegThumbnail
    }
  };
}