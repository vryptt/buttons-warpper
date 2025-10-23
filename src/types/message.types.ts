import { NativeFlowButton } from './button.types';

export interface InteractiveMessageContent {
  interactiveMessage: {
    nativeFlowMessage: {
      buttons: NativeFlowButton[];
    };
    header?: {
      title: string;
    };
    body?: {
      text: string;
    };
    footer?: {
      text: string;
    };
  };
}

export interface AuthoringPayload {
  text: string;
  footer?: string;
  title?: string;
  subtitle?: string;
  interactiveButtons?: NativeFlowButton[];
}

export interface SendButtonsPayload {
  text: string;
  footer?: string;
  title?: string;
  subtitle?: string;
  buttons: ButtonInput[];
}

export interface SendOptions {
  useCachedGroupMetadata?: boolean;
  additionalAttributes?: Record<string, any>;
  statusJidList?: string[];
  additionalNodes?: BinaryNode[];
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
    remoteJid: string;
    fromMe: boolean;
  };
  message: any;
  messageTimestamp?: number;
}