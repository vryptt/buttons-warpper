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
          url: 'https://example.com',
          has_multiple_buttons: true
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
  },
  advancedMessage: {
    text: null,
    footer: "Advanced footer",
    header: {
      hasMediaAttachment: true,
      documentMessage: {
        url: "https://example.com/doc.pdf",
        mimetype: "application/pdf",
        fileName: "document.pdf",
        fileLength: "999999999999"
      }
    },
    contextInfo: {
      mentionedJid: ['62xxx@s.whatsapp.net'],
      externalAdReply: {
        title: "External Link",
        body: "Click to visit",
        thumbnailUrl: "https://example.com/thumb.jpg",
        sourceUrl: "https://example.com",
        mediaType: 1,
        renderLargerThumbnail: true
      }
    },
    messageParams: {
      bottom_sheet: {
        in_thread_buttons_limit: 2,
        list_title: "Select option",
        button_title: "Choose"
      }
    },
    buttons: [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Select',
          sections: [{
            title: 'Section 1',
            highlight_label: '⭐',
            rows: [
              { title: 'Option 1', id: 'opt1' }
            ]
          }],
          has_multiple_buttons: true
        })
      }
    ]
  }
};