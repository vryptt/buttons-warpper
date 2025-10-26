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
  has_multiple_buttons?: boolean;
}

export interface CtaUrlParams {
  display_text: string;
  url: string;
  merchant_url?: string;
  has_multiple_buttons?: boolean;
}

export interface CtaCopyParams {
  display_text: string;
  copy_code: string;
  has_multiple_buttons?: boolean;
}

export interface CtaCallParams {
  display_text: string;
  phone_number: string;
  has_multiple_buttons?: boolean;
}

export interface CtaCatalogParams {
  business_phone_number: string;
  has_multiple_buttons?: boolean;
}

export interface CtaReminderParams {
  display_text: string;
  reminder_timestamp?: number;
  has_multiple_buttons?: boolean;
}

export interface OpenWebviewParams {
  title: string;
  link: {
    url: string;
  };
  has_multiple_buttons?: boolean;
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
  has_multiple_buttons?: boolean;
}

export interface MpmParams {
  product_id: string;
}

export interface GalaxyMessageParams {
  flow_token: string;
  flow_id: string;
}

export interface LimitedTimeOfferParams {
  text?: string;
  url?: string;
  copy_code?: string;
  expiration_time?: number;
}

export interface BottomSheetParams {
  in_thread_buttons_limit?: number;
  divider_indices?: number[];
  list_title?: string;
  button_title?: string;
}

export interface TapTargetConfiguration {
  title?: string;
  description?: string;
  canonical_url?: string;
  domain?: string;
  button_index?: number;
}

export interface NativeFlowMessageParams {
  limited_time_offer?: LimitedTimeOfferParams;
  bottom_sheet?: BottomSheetParams;
  tap_target_configuration?: TapTargetConfiguration;
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
  
  