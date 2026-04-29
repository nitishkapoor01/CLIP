# ClipIsland Web

Futuristic iOS-inspired clipboard memory prototype powered by a Dynamic Island style interface.

## Run

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build + Lint

```bash
npm run lint
npm run build
```

## Features

- Clipboard auto-save polling with dedupe and newest-first history
- Dynamic Island collapsed/expanded states with pulse + live notice
- Smart detection for URL, OTP, phone, and plain text clips
- Contextual actions: open link, call, autofill, copy/paste
- Multi-copy stack navigation with quick focus controls and touch swipes
- Copy Capsules and keyboard-style quick paste tab
- Persistent local storage for clipboard history and autosave preference

## Native iOS Mapping

See `docs/IOS_ARCHITECTURE.md` for the SwiftUI + ActivityKit + UIPasteboard scaffold.
