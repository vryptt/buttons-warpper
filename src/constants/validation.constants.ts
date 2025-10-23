export const SOFT_BUTTON_CAP = 25;

export const EXAMPLE_PAYLOADS = {
  sendButtons: {
    text: 'Choose an option',
    buttons: [
      { id: 'opt1', text: 'Option 1' },
      { id: 'opt2', text: 'Option 2' },
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: 'Visit Site',
          url: 'https://example.com'
        })
      }
    ],
    footer: 'Footer text'
  },
  sendInteractiveMessage: {
    text: 'Pick an action',
    interactiveButtons: [
      {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: 'Hello',
          id: 'hello'
        })
      },
      {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: 'Copy Code',
          copy_code: 'ABC123'
        })
      }
    ],
    footer: 'Footer'
  }
};