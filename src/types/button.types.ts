export interface LegacyButton {
  id: string;
  text: string;
}

export interface OldBaileysButton {
  buttonId: string;
  buttonText: {
    displayText: string;
  };
}

export interface NativeFlowButton {
  name: string;
  buttonParamsJson: string;
}

export type ButtonInput = LegacyButton | OldBaileysButton | NativeFlowButton | Record<string, any>;

export interface QuickReplyParams {
  display_text: string;
  id: string;
}

export interface CtaUrlParams {
  display_text: string;
  url: string;
}

export interface CtaCopyParams {
  display_text: string;
  copy_code: string;
}

export interface CtaCallParams {
  display_text: string;
  phone_number: string;
}

export type ButtonParamsJson = QuickReplyParams | CtaUrlParams | CtaCopyParams | CtaCallParams | Record<string, any>;