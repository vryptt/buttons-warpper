export interface LegacyButton {
  id: string;
  text?: string;
  displayText?: string;
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

export type ButtonInput = 
  | LegacyButton 
  | OldBaileysButton 
  | NativeFlowButton 
  | Record<string, any>;

export interface QuickReplyParams {
  display_text: string;
  id: string;
}

export interface CtaUrlParams {
  display_text: string;
  url: string;
  merchant_url?: string;
}

export interface CtaCopyParams {
  display_text: string;
  copy_code: string;
}

export interface CtaCallParams {
  display_text: string;
  phone_number: string;
}

export interface CtaCatalogParams {
  business_phone_number: string;
}

export interface CtaReminderParams {
  display_text: string;
  reminder_timestamp?: number;
}

export interface OpenWebviewParams {
  title: string;
  link: {
    url: string;
  };
}

export interface SingleSelectParams {
  title: string;
  sections: Array<{
    title?: string;
    rows: Array<{
      header?: string;
      title: string;
      description?: string;
      id: string;
    }>;
  }>;
}

export interface MpmParams {
  product_id: string;
}

export interface GalaxyMessageParams {
  flow_token: string;
  flow_id: string;
}

export type ButtonParamsJson = 
  | QuickReplyParams 
  | CtaUrlParams 
  | CtaCopyParams 
  | CtaCallParams 
  | CtaCatalogParams
  | CtaReminderParams
  | OpenWebviewParams
  | SingleSelectParams
  | MpmParams
  | GalaxyMessageParams
  | Record<string, any>;