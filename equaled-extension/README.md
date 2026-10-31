# EqualEd Accessibility — Chrome Extension

Production-grade Chrome Extension (Manifest V3) that delivers a full accessibility toolkit on **any** educational website.

---

## 📁 Folder Structure

```
equaled-extension/
├── manifest.json          # MV3 manifest — permissions, shortcuts, content scripts
├── background.js          # Service worker — routing, context menus, TTS API, profiles
├── popup/
│   ├── popup.html         # Extension popup UI (4 tabs: Visual, Reading, Speech, Motion)
│   ├── popup.css          # Premium dark-theme popup styles
│   ├── popup.js           # Popup controller — all controls wired up
│   └── welcome.html       # First-install welcome page
├── content/
│   ├── content.js         # Main content script injected on every page
│   └── content.css        # CSS injected into pages
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## ✨ Features

### 🎨 Visual
| Feature | Description |
|---|---|
| Font Size | 80%–200%, step controls |
| Font Family | Default, OpenDyslexic, Sans-Serif, Monospace |
| High Contrast | Dark / Yellow-Black / Green-Black / White-Black |
| Dark Mode | Force dark overlay on any site |
| Color Vision Filters | Deuteranopia, Protanopia, Tritanopia, Grayscale |
| Brightness & Saturation | Adjustable sliders |
| Cursor Size | Default / Large / Extra-Large |
| Highlight Links | Yellow highlight + amber border |
| Image Alt Text | Show alt text labels below images |

### 📖 Reading
| Feature | Description |
|---|---|
| Line Height | 1.0–3.0 |
| Letter Spacing | 0–0.3em |
| Word Spacing | 0–0.5em |
| Paragraph Spacing | Extra spacing between paragraphs |
| Text Alignment | Auto / Left / Center / Justify |
| Reading Guide | Horizontal ruler following mouse |
| Reading Mask | Dim above & below current line |
| Focus Mode | Spotlight circle following cursor |
| Highlight Headings | Purple left-border on h1–h6 |
| Pause Animations | Stop all CSS animations & GIFs |

### 🔊 Speech
| Feature | Description |
|---|---|
| Text-to-Speech | Web Speech API, adjustable rate/pitch/volume |
| Voice Selection | All system voices available |
| Read on Click | Click any element to read it |
| Auto-Read | Read full page on load |
| Word Highlight | Highlight word being spoken |
| Voice Control | Say commands to navigate |

### 🎙️ Voice Commands
- `scroll down` / `scroll up` / `page down` / `page up`
- `go back` / `go forward`
- `go to top` / `go to bottom`
- `read page` / `stop reading`
- `zoom in` / `zoom out`
- `dark mode` / `high contrast`
- `click [element name]` — clicks matching link/button
- `reset` — resets all settings

### 👁️ Motion
- **Eye Tracking** — MediaPipe FaceMesh, gaze-to-scroll + dwell-click + back navigation
- **Hand Control** — MediaPipe Hands, gesture-based navigation
  - ☝️ Point → Scroll Up
  - ✌️ Peace → Scroll Down
  - 👌 Pinch → Click
  - 🖐️ Open Palm → Go Back

### 🧩 Quick Profiles
- **Visual** — High contrast + large cursor + TTS
- **Motor** — Voice control + large cursor + focus mode
- **Dyslexia** — OpenDyslexic font + spacing + reading guide
- **ADHD** — Focus mode + mask + pause animations
- **Elderly** — Large font + large cursor + TTS slow speed

---

## 🚀 Installation (Chrome)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `equaled-extension/` folder
5. Pin the extension for easy access

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Shift+A` | Toggle on-page accessibility panel |
| `Alt+Shift+S` | Toggle Text-to-Speech |
| `Alt+Shift+C` | Toggle High Contrast |

Customize shortcuts at `chrome://extensions/shortcuts`

---

## 🖱️ Context Menu

Right-click on any webpage for:
- **Read Selected Text** — Speaks highlighted text
- **Define Selected Word** — Dictionary lookup tooltip
- **Toggle Accessibility Panel** — Show/hide floating panel
- **Toggle High Contrast** — Quick contrast switch

---

## 🔧 Technical Details

- **Manifest Version**: 3 (latest)
- **Permissions**: `storage`, `tts`, `activeTab`, `scripting`, `tabs`, `contextMenus`, `notifications`
- **Settings Storage**: `chrome.storage.sync` (syncs across devices)
- **TTS Engine**: Web Speech API (browser) + Chrome TTS API (background)
- **Motion Tracking**: MediaPipe FaceMesh + Hands (CDN loaded on demand)
- **Auto-Restore**: Settings re-applied on every tab navigation

---

## 📝 Notes

- Motion tracking (eye/hand) requires **camera permission** — user will be prompted
- MediaPipe models are loaded from CDN on first use (~2MB each)
- Color vision filters use SVG `<feColorMatrix>` — no performance impact
- All features are stateless — toggle any time without page reload
