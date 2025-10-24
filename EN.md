# Enhanced WhiskeySockets Interactive Buttons

[![npm version](https://img.shields.io/npm/v/buttons-warpper.svg?style=flat-square)](https://www.npmjs.com/package/buttons-warpper)
[![License](https://img.shields.io/npm/l/buttons-warpper.svg?style=flat-square)](https://github.com/vryptt/buttons-warpper/blob/main/LICENSE)
[![Node Version](https://img.shields.io/node/v/buttons-warpper.svg?style=flat-square)](https://nodejs.org)
[![Downloads](https://img.shields.io/npm/dm/buttons-warpper.svg?style=flat-square)](https://www.npmjs.com/package/buttons-warpper)

> A comprehensive solution for sending WhatsApp interactive and native flow buttons using WhiskeySockets (Baileys fork) without modifying core source code.

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Supported Button Types](#supported-button-types)
- [API Reference](#api-reference)
- [Technical Details](#technical-details)
- [Compatibility](#compatibility)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This package provides functionality to send every currently known WhatsApp interactive and native flow button type using WhiskeySockets. The functionality is packaged as the npm package `buttons-warpper`, which reproduces the binary node structure that the official WhatsApp client emits, ensuring buttons render correctly in both private and group chats.

## ❓ Problem Statement

By default, WhiskeySockets cannot send interactive buttons, while itsukichan can. The root cause is that WhiskeySockets lacks the required binary node wrappers (`biz`, `interactive`, `native_flow`) that WhatsApp expects for interactive messages.

## ✨ Solution

The enhanced functionality provided by the `buttons-warpper` package addresses this by:

1. **Detecting button messages** using the same logic as itsukichan
2. **Converting** WhiskeySockets' `interactiveButtons` format to the proper protobuf structure
3. **Adding missing binary nodes** (`biz`, `interactive`, `native_flow`, `bot`) via `additionalNodes`
4. **Automatically handling** private vs group chat requirements

## 🚀 Key Features

- ✅ **No modifications** to WhiskeySockets or itsukichan folders
- ✅ **Template functionality removed** as requested
- ✅ **Automatic binary node injection** for button messages
- ✅ **Private chat support** (adds `bot` node with `biz_bot: '1'`)
- ✅ **Group chat support** (adds only `biz` node)
- ✅ **Backward compatibility** (regular messages pass through unchanged)
- ✅ **TypeScript support** (full type definitions included)

## 📦 Installation

```bash
npm install buttons-warpper
```

or

```bash
yarn add buttons-warpper
```

## 🔧 Quick Start

### Basic Usage (Most Common Case)

```javascript
const { sendButtons } = require('buttons-warpper');

await sendButtons(sock, jid, {
  title: 'Header Title',            // optional header
  text: 'Pick one option below',    // body
  footer: 'Footer text',            // optional footer
  buttons: [
    { id: 'quick_1', text: 'Quick Reply' },       // legacy simple shape auto-converted
    {
      name: 'cta_url',
      buttonParamsJson: JSON.stringify({
        display_text: 'Open Site',
        url: 'https://example.com'
      })
    }
  ]
});
```

### Advanced Usage (Multiple Button Types)

For full control with multiple advanced button kinds in one message, use `sendInteractiveMessage` with `interactiveButtons` directly:

```javascript
const { sendInteractiveMessage } = require('buttons-warpper');

await sendInteractiveMessage(sock, jid, {
  text: 'Advanced native flow demo',
  footer: 'All the things',
  interactiveButtons: [
    // Quick reply (explicit form)
    {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: 'Reply A', id: 'reply_a' })
    },
    // Single select picker (list inside a button)
    {
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: 'Pick One',
        sections: [{
          title: 'Choices',
          rows: [
            { header: 'H', title: 'Hello', description: 'Says hi', id: 'opt_hello' },
            { header: 'B', title: 'Bye', description: 'Says bye', id: 'opt_bye' }
          ]
        }]
      })
    }
  ]
});
```

## 📱 Supported Button Types

Below are the most common and observed `name` values for `nativeFlowMessage.buttons[]` along with their required JSON keys. You can mix several in one `interactiveButtons` array.

| Name | Purpose | Required Keys |
|------|---------|--------------|
| `quick_reply` | Simple reply that sends its `id` back | `display_text`, `id` |
| `single_select` | In-button picker list | `title`, `sections` |
| `cta_url` | Open URL | `display_text`, `url` |
| `cta_copy` | Copy text to clipboard | `display_text`, `copy_code` |
| `cta_call` | Tap to dial | `display_text`, `phone_number` |
| `cta_catalog` | Open business catalog | `display_text` (optional) |
| `send_location` | Request user location | `display_text` (optional) |
| `review_and_pay` | Order/payment summary | Payment structured payload |
| `payment_info` | Payment info flow | Payment structured payload |
| `mpm` | Multi product message | Vendor internal structure |
| `wa_payment_transaction_details` | Show transaction | Transaction reference keys |

> **Note:** Core stable button types for bots are: `quick_reply`, `single_select`, `cta_url`, `cta_copy`, and `cta_call`.

### Example: URL, Copy & Call Together

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Contact actions',
  interactiveButtons: [
    { 
      name: 'cta_url', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Docs', 
        url: 'https://example.com' 
      }) 
    },
    { 
      name: 'cta_copy', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Copy Code', 
        copy_code: 'ABC-123' 
      }) 
    },
    { 
      name: 'cta_call', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Call Support', 
        phone_number: '+1234567890' 
      }) 
    }
  ]
});
```

### Example: Mixed Quick Replies + Catalog

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Explore products or reply',
  interactiveButtons: [
    { 
      name: 'quick_reply', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Hello', 
        id: 'hi' 
      }) 
    },
    { 
      name: 'quick_reply', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Pricing', 
        id: 'pricing' 
      }) 
    },
    { 
      name: 'cta_catalog', 
      buttonParamsJson: JSON.stringify({}) 
    }
  ]
});
```

### Example: Location Request

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Please share your location',
  interactiveButtons: [
    { 
      name: 'send_location', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Share Location' 
      }) 
    }
  ]
});
```

### Example: Single Select Menu

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Choose one item',
  interactiveButtons: [
    { 
      name: 'single_select', 
      buttonParamsJson: JSON.stringify({
        title: 'Menu',
        sections: [{
          title: 'Main',
          rows: [
            { id: 'it_1', title: 'First', description: 'First choice' },
            { id: 'it_2', title: 'Second', description: 'Second choice' }
          ]
        }]
      }) 
    }
  ]
});
```

## 📚 API Reference

### `sendInteractiveMessage(sock, jid, content, options)`

Low-level helper for sending interactive messages with full control.

#### Parameters

- **`sock`** (Object): Active WhiskeySockets/Baileys socket
- **`jid`** (String): Destination WhatsApp JID (user or group)
- **`content`** (Object): Message content with the following properties:
  - `text` (String): Body text
  - `footer` (String): Footer text (optional)
  - `title` (String): Header title (optional)
  - `subtitle` (String): Header subtitle (optional)
  - `interactiveButtons` (Array): Array of button descriptors
- **`options`** (Object): Extra options (optional):
  - `additionalNodes` (Array): Custom binary nodes
  - `additionalAttributes` (Object): Extra relay attributes
  - `statusJidList` (Array): Status JID list
  - `useCachedGroupMetadata` (Boolean): Use cached group metadata

#### Returns

Promise that resolves with the full constructed `WAMessage` object.

#### Example

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Pick or explore',
  footer: 'Advanced demo',
  interactiveButtons: [
    { 
      name: 'quick_reply', 
      buttonParamsJson: JSON.stringify({ display_text: 'Hi', id: 'hi' }) 
    },
    { 
      name: 'cta_url', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Docs', 
        url: 'https://example.com' 
      }) 
    }
  ]
});
```

### `sendButtons(sock, jid, content, options)`

Simplified helper for common button scenarios.

#### Parameters

Same as `sendInteractiveMessage`, but with simplified button syntax support.

## 🔍 Technical Details

### Binary Node Structure

The wrapper automatically injects the required binary node structure:

**Private Chat:**
```
biz → interactive → native_flow → buttons + bot (biz_bot=1)
```

**Group Chat:**
```
biz → interactive → native_flow → buttons
```

### Button Type Detection

The wrapper detects button types using the same logic as itsukichan:

- `listMessage` → 'list'
- `buttonsMessage` → 'buttons'
- `interactiveMessage.nativeFlowMessage` → 'native_flow'

### Content Conversion Flow

**Authoring (input):**
```javascript
{ 
  text, 
  footer, 
  interactiveButtons: [{ name, buttonParamsJson }, ...] 
}
```

**Wrapper output (sent to WhatsApp):**
```javascript
{ 
  interactiveMessage: { 
    nativeFlowMessage: { buttons: [...] }, 
    body: { text }, 
    footer: { text } 
  } 
}
```

## ✅ Compatibility

| Component | Version |
|-----------|---------|
| WhiskeySockets | 7.0.0-rc.2+ |
| Node.js | 20+ |
| Button Types | All types supported by itsukichan |
| Chat Types | Private and group chats |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WhiskeySockets team for the excellent Baileys fork
- itsukichan for button implementation insights
- All contributors who help improve this package

---

**Made with ❤️ by the community**