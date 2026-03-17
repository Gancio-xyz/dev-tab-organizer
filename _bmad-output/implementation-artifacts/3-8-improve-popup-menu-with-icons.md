# Story 3.8: Improve Popup Menu with Icons/Emojis

Status: ready-for-dev

## Story

As a developer using the extension,
I want to see a recognizable icon (emoji) next to each port in the popup menu,
So that I can quickly identify my projects at a glance and customize them to my liking.

## Acceptance Criteria

1. Every port row in the popup UI must display an emoji.
2. The default emoji for all ports is ⚡ (Lightning Bolt), unless a specific default is defined in `port-map.js`.
3. Users can set a custom emoji for any port.
4. Custom emojis are persisted in `chrome.storage.sync` alongside the custom port name.
5. In the popup UI, the emoji appears to the left of the port label.
6. The user can edit the emoji through a dedicated small input field (max 1-2 characters). *Decision: Option A selected.*

## Tasks / Subtasks

- [ ] Update `port-map.js` to support default emojis for specific ports:
    - ⚛️ 3000 (React)
    - 🚀 5173 (Vite)
    - 📦 8080 (Webpack/Spring Boot)
    - 🟢 3001 (Node.js)
    - 🐍 8000 (Python)
    - 🐦 4000 (Phoenix)
    - 🐘 8000 (PHP)
    - ⚡ Default
- [ ] Modify `popup.js` `renderTabList` to include an emoji in each row.
- [ ] Update `popup.js` `saveMapping` and `attachEditListeners` to handle the new emoji input field.
- [ ] Update `popup.html` / `popup.css` to accommodate the new emoji input field (proper spacing, alignment).
- [ ] Ensure `background.js` (or wherever title rewriting happens) doesn't break if the storage structure for `portMappings` changes.

## Dev Notes

### Storage Compatibility
Currently `portMappings` stores `{ "3000": "My App" }`. 
To support emojis, we will transition to `{ "3000": { "name": "My App", "emoji": "🚀" } }`. 
**CRITICAL:** We must maintain backward compatibility. If `portMappings[port]` is a string, it represents the name, and the emoji should fall back to the default for that port.

### UI Layout
New row structure:
```html
<div class="tab-row" data-port="3000" role="listitem">
  <input class="emoji-input" data-port="3000" type="text" maxlength="2" placeholder="⚡">
  <label for="input-3000">Port 3000</label>
  <input id="input-3000" class="tab-name-input" ...>
</div>
```
