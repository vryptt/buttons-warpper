export const SEND_BUTTONS_ALLOWED_COMPLEX = new Set([
  'cta_url',
  'cta_copy',
  'cta_call'
]);

export const INTERACTIVE_ALLOWED_NAMES = new Set([
  'quick_reply',
  'cta_url',
  'cta_copy',
  'cta_call',
  'cta_catalog',
  'cta_reminder',
  'cta_cancel_reminder',
  'address_message',
  'send_location',
  'open_webview',
  'mpm',
  'wa_payment_transaction_details',
  'automated_greeting_message_view_catalog',
  'galaxy_message',
  'single_select'
]);

export const NATIVE_FLOW_SPECIALS = [
  'mpm',
  'cta_catalog',
  'send_location',
  'call_permission_request',
  'wa_payment_transaction_details',
  'automated_greeting_message_view_catalog'
];

export const REQUIRED_FIELDS_MAP: Record<string, string[]> = {
  cta_url: ['display_text', 'url'],
  cta_copy: ['display_text', 'copy_code'],
  cta_call: ['display_text', 'phone_number'],
  cta_catalog: ['business_phone_number'],
  cta_reminder: ['display_text'],
  cta_cancel_reminder: ['display_text'],
  address_message: ['display_text'],
  send_location: ['display_text'],
  open_webview: ['title', 'link'],
  mpm: ['product_id'],
  wa_payment_transaction_details: ['transaction_id'],
  automated_greeting_message_view_catalog: ['business_phone_number', 'catalog_product_id'],
  galaxy_message: ['flow_token', 'flow_id'],
  single_select: ['title', 'sections'],
  quick_reply: ['display_text', 'id']
};