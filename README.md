# Enhanced WhiskeySockets Interactive Buttons

This repository shows how to send every currently known WhatsApp interactive / native flow button type using WhiskeySockets (Baileys fork) without modifying core source. The functionality is packaged and published as the npm package `baileys_helper` which reproduces the binary node structure the official client emits so buttons render correctly for both private & group chats.

## Problem Statement

By default, WhiskeySockets cannot send interactive buttons while itsukichan can. The root cause is that WhiskeySockets lacks the required binary node wrappers (`biz`, `interactive`, `native_flow`) that WhatsApp expects for interactive messages.

## Solution

The enhanced functionality provided by the `baileys_helper` package provides the missing functionality by:

1. **Detecting button messages** using the same logic as itsukichan
2. **Converting** WhiskeySockets' `interactiveButtons` format to the proper protobuf structure
3. **Adding missing binary nodes** (`biz`, `interactive`, `native_flow`, `bot`) via `additionalNodes`
4. **Automatically handling** private vs group chat requirements

## Key Features

- ✅ **No modifications** to WhiskeySockets or itsukichan folders
- ✅ **Template functionality removed** as requested
- ✅ **Automatic binary node injection** for button messages
- ✅ **Private chat support** (adds `bot` node with `biz_bot: '1'`)
- ✅ **Group chat support** (adds only `biz` node)
- ✅ **Backward compatibility** (regular messages pass through unchanged)

## Quick Start (Most Common Case)

```javascript
const { sendButtons } = require('baileys_helper');

await sendButtons(sock, jid, {
  title: 'Header Title',            // optional header
  text: 'Pick one option below',    // body
  footer: 'Footer text',            // optional footer
  buttons: [
    { id: 'quick_1', text: 'Quick Reply' },       // legacy simple shape auto‑converted
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

For full control (multiple advanced button kinds in one message) use `sendInteractiveMessage` with `interactiveButtons` directly.

```javascript
const { sendInteractiveMessage } = require('baileys_helper');

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

---
## Supported Button Types (Native Flow Names)

Below are the most common & observed `name` values for `nativeFlowMessage.buttons[]` along with their required JSON keys. You can mix several in one `interactiveButtons` array (WhatsApp will decide layout).

| Name | Purpose | buttonParamsJson (required keys) |
|------|---------|----------------------------------|
| `quick_reply` | Simple reply that sends its `id` back | `{ display_text, id }` |
| `single_select` | In‑button picker list | `{ title, sections:[{ title?, rows:[{ id, title, description?, header? }] }] }` |
| `cta_url` | Open URL | `{ display_text, url, merchant_url? }` |
| `cta_copy` | Copy text to clipboard | `{ display_text, copy_code }` |
| `cta_call` | Tap to dial | `{ display_text, phone_number }` |
| `cta_catalog` | Open business catalog | `{ display_text? }` (WA may ignore extra keys) |
| `send_location` | Request user location (special flow) | `{ display_text? }` |
| `review_and_pay` | Order / payment summary (special) | Payment structured payload (server‑validated) |
| `payment_info` | Payment info flow | Payment structured payload |
| `mpm` | Multi product message (catalog) | Vendor internal structure |
| `wa_payment_transaction_details` | Show transaction | Transaction reference keys |
| `automated_greeting_message_view_catalog` | Greeting -> catalog | (Minimal / internal) |

Not all special names are guaranteed to render outside official / business clients; unsupported ones are simply ignored by WhatsApp. Core stable ones for bots are: `quick_reply`, `single_select`, `cta_url`, `cta_copy`, `cta_call`.

### Example: URL, Copy & Call Together
```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Contact actions',
  interactiveButtons: [
    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Docs', url: 'https://example.com' }) },
    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Code', copy_code: 'ABC-123' }) },
    { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: 'Call Support', phone_number: '+1234567890' }) }
  ]
});
```

### Example: Mixed Quick Replies + Catalog
```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Explore products or reply',
  interactiveButtons: [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Hello', id: 'hi' }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Pricing', id: 'pricing' }) },
    { name: 'cta_catalog', buttonParamsJson: JSON.stringify({}) }
  ]
});
```

### Example: Location Request (Experimental)
```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Please share your location',
  interactiveButtons: [
    { name: 'send_location', buttonParamsJson: JSON.stringify({ display_text: 'Share Location' }) }
  ]
});
```

### Example: Single Select Menu
```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Choose one item',
  interactiveButtons: [
    { name: 'single_select', buttonParamsJson: JSON.stringify({
        title: 'Menu',
        sections: [{
          title: 'Main',
          rows: [
            { id: 'it_1', title: 'First', description: 'First choice' },
            { id: 'it_2', title: 'Second', description: 'Second choice' }
          ]
        }]
    }) }
  ]
});
```

> Tip: Legacy simple objects like `{ id: 'x', text: 'Label' }` passed to `sendButtons` auto‑convert to `quick_reply`.

## Test Bot Commands

Run `node app-wks.js` then in WhatsApp chat send:

| Command | What It Does |
|---------|--------------|
| `!ping` | Plain text reply |
| `!buttons` | Demonstrates quick reply + URL + copy + call buttons |
| `!advanced` | Shows quick reply + single select list together |
| `!help` | Lists all commands |

## Technical Details

### Binary Node Structure (What The Wrapper Injects)

Private chat: adds `biz` + `interactive/native_flow` + `bot (biz_bot=1)`.

Group chat: adds only `biz` + `interactive/native_flow`.

When special first button names (`review_and_pay`, `payment_info`, `mpm`, etc.) are detected, version/name attributes change to match official client traffic so WhatsApp enables those flows.

### Button Type Detection

The wrapper detects button types using the same logic as itsukichan:

- `listMessage` → 'list'
- `buttonsMessage` → 'buttons'  
- `interactiveMessage.nativeFlowMessage` → 'native_flow'

### Content Conversion Flow

Authoring (you write):
```javascript
{ text, footer, interactiveButtons: [{ name, buttonParamsJson }, ...] }
```
Wrapper builds (sent to WA):
```javascript
{ interactiveMessage: { nativeFlowMessage: { buttons: [...] }, body:{ text }, footer:{ text } } }
```

## Files Modified

### Detailed API Reference: `sendInteractiveMessage`

Low‑level power helper used by all higher level wrappers. Use this when you need to:
- Mix several advanced button kinds in one message (e.g. `quick_reply` + `single_select` + `cta_url`).
- Provide pre‑built `interactiveMessage` content (after internal transformation) while still benefiting from automatic binary node injection.
- Attach custom relay options (`statusJidList`, `additionalAttributes`, experimental fields) or manually append extra `additionalNodes`.

#### Signature
```js
async function sendInteractiveMessage(sock, jid, content, options = {})
```

#### Parameters
- `sock`: Active WhiskeySockets/Baileys socket (must expose `relayMessage`, `logger`, `authState` or `user`).
- `jid`: Destination WhatsApp JID (user or group). Auto‑detects group via `WABinary.isJidGroup`.
- `content`: High‑level authoring object. Accepts either a regular Baileys message shape or the enhanced authoring shape:
  - `text` (string) Body text (mapped to `interactiveMessage.body.text`).
  - `footer` (string) Footer (mapped to `interactiveMessage.footer.text`).
  - `title` / `subtitle` (string) Optional header title (mapped to `interactiveMessage.header.title`).
  - `interactiveButtons` (Array) Array of button descriptors. Each item should be either:
    - `{ name: '<native_flow_name>', buttonParamsJson: JSON.stringify({...}) }` (already normalized), or
    - A legacy quick reply shape `{ id, text }` / `{ buttonId, buttonText: { displayText } }` which is auto‑normalized to a `quick_reply`.
  - Any other Baileys message keys (e.g. `contextInfo`) pass through unchanged.
- `options`: (Optional) Extra relay + generation options:
  - All fields accepted by `generateWAMessageFromContent` (e.g. custom `timestamp`).
  - `additionalNodes` (Array) Prepend your own binary nodes (the function appends required interactive nodes after detection).
  - `additionalAttributes` (Object) Extra attributes for the root relay stanza.
  - `statusJidList`, `useCachedGroupMetadata` (advanced Baileys relay options).

#### What It Does Internally
1. Calls `convertToInteractiveMessage(content)` if `interactiveButtons` exist, producing:
   ```js
   { interactiveMessage: { nativeFlowMessage: { buttons: [...] }, header?, body?, footer? } }
   ```
2. Imports WhiskeySockets internal helpers (`generateWAMessageFromContent`, `normalizeMessageContent`, `isJidGroup`, `generateMessageIDV2`). Throws if unavailable.
3. Builds a raw `WAMessage` bypassing normal send validation (lets unsupported interactive types through).
4. Normalizes and determines button type via `getButtonType` then derives binary node tree with `getButtonArgs`.
5. Injects required binary nodes:
   - Always a `biz` node (with nested `interactive/native_flow/...` for buttons and lists) when interactive.
   - Adds `{ tag: 'bot', attrs: { biz_bot: '1' } }` automatically for private (1:1) chats enabling rendering of interactive flows.
6. Relays the message using `relayMessage` with `additionalNodes`.
7. Optionally emits the message locally (`sock.upsertMessage`) for private chats if `sock.config.emitOwnEvents` is set (groups are skipped to avoid duplicates).

#### Return Value
Resolves with the full constructed `WAMessage` object (`{ key, message, messageTimestamp, ... }`) so you can log/store/await acks exactly like a standard `sock.sendMessage` call.

#### Error Handling
- Throws `Socket is required` if `sock` is null/undefined.
- Throws `WhiskeySockets functions not available` if internal modules cannot be loaded (e.g. path changes). In such a case you may fall back to plain `sock.sendMessage` for non‑interactive messages.

#### Choosing Between Helpers
- Use `sendButtons` / `sendInteractiveButtonsBasic` for simple quick replies + common CTA cases.
- Use `sendInteractiveMessage` for any combination including `single_select`, special native flow names, or when you need to attach custom nodes.

#### Advanced Example: Mixed Buttons + List + Custom Node
```js
const { sendInteractiveMessage } = require('baileys_helper');

await sendInteractiveMessage(sock, jid, {
  text: 'Pick or explore',
  footer: 'Advanced demo',
  interactiveButtons: [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Hi', id: 'hi' }) },
    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Docs', url: 'https://example.com' }) },
    { name: 'single_select', buttonParamsJson: JSON.stringify({
        title: 'Menu',
        sections: [{
          title: 'Options',
          rows: [
            { id: 'a', title: 'Alpha', description: 'First item' },
            { id: 'b', title: 'Beta', description: 'Second item' }
          ]
        }]
    }) }
  ]
}, {
  additionalNodes: [ { tag: 'biz', attrs: { experimental_flag: '1' } } ] // will be merged before auto interactive nodes
});
```

#### Special Native Flow Names & Effects
| First Button Name | Injected Node Variant | Notes |
|-------------------|-----------------------|-------|
| `review_and_pay`  | `biz` with `native_flow_name=order_details` | Payment/order style flow |
| `payment_info`    | `biz` with `native_flow_name=payment_info`  | Payment info flow |
| `mpm`, `cta_catalog`, `send_location`, `call_permission_request`, `wa_payment_transaction_details`, `automated_greeting_message_view_catalog` | `biz > interactive(native_flow v=1) > native_flow(v=2,name=<name>)` | Specialized (may require official client) |
| Anything else / mixed | `biz > interactive(native_flow v=1) > native_flow(v=9,name=mixed)` | Generic path covering standard quick replies, lists, CTAs |

#### Performance / Throughput
Cost is roughly equivalent to a standard `sendMessage` call; extra overhead is a small synchronous transformation + node injection. Suitable for high‑volume bots. Consider standard Baileys concurrency limits for large broadcast scenarios.

#### Debugging Tips
- Temporary console log emitted: `Interactive send: { type, nodes, private }` – remove or redirect if noisy.
- If buttons do not render: ensure first binary node injected is `biz` and private chats include the `bot` node.
- Confirm each button's `buttonParamsJson` is valid JSON string (catch JSON.stringify mistakes early).

#### Common Mistakes
- Forgetting to JSON.stringify `buttonParamsJson` payloads.
- Using `sendInteractiveMessage` without a socket that includes `relayMessage` (e.g., passing a partially constructed object).
- Adding your own `bot` node for private chats (not needed; auto added).
- Expecting unsupported special flows (payments/catalog) to render in a non‑business account—WhatsApp may silently ignore them.

#### Minimal Raw Usage
If you already built a correct `interactiveMessage` object you can call:
```js
await sendInteractiveMessage(sock, jid, {
  interactiveMessage: {
    nativeFlowMessage: {
      buttons: [ { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Hi', id: 'hi' }) } ]
    },
    body: { text: 'Direct native flow' }
  }
});
```
The helper will still inject binary nodes & bot node as required.


- `helpers/buttons.js` - Enhanced with binary node support (template functionality removed)
- `export.js` - Central export surface for the package and metadata helper

## Compatibility

- ✅ WhiskeySockets 7.0.0-rc.2+
- ✅ Node.js 20+
- ✅ All button types supported by itsukichan
- ✅ Private and group chats

## Result

You can now send all mainstream interactive button variants (quick replies, URL / copy / call CTAs, single select lists) plus experimental special flows from WhiskeySockets exactly like the official client, with automatic handling for groups vs private chats and without editing fork source.