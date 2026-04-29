# ClipIsland Native iOS App

This is a native SwiftUI scaffold for ClipIsland (not a web wrapper).

## What is included

- SwiftUI app entry and home screen
- Dynamic Island style UI flow in app
- Clipboard polling engine using `UIPasteboard`
- Smart type detection (`url`, `phone`, `otp`, `text`)
- Deduped clipboard history with local persistence
- Favorites, clear history, quick paste actions
- Copy Capsules section
- Smart Keyboard tab section
- Live Activity model + manager
- Widget extension file with Dynamic Island layouts

## Generate Xcode project (Mac only)

1. Install Xcode + Homebrew
2. Install XcodeGen:
   - `brew install xcodegen`
3. From this folder:
   - `xcodegen generate`
4. Open generated project in Xcode

## Sideload flow

1. Set signing team + unique bundle IDs in Xcode
2. Build to device (or Archive -> Export `.ipa`)
3. Install with AltStore / Sideloadly

## Windows + GitHub + Sideloadly flow (no Mac)

1. Push this project to GitHub with `.github/workflows/ios-ipa.yml`.
2. Open GitHub -> Actions -> `Build iOS IPA (Unsigned)`.
3. Click `Run workflow` and select:
   - `build_mode: full` for app + widget/live activity extension
   - `build_mode: app-only` for fallback (widget removed from IPA)
   - `configuration: Release`
4. After success, download artifact `clipisland-ipa-*`.
5. On Windows, open Sideloadly and select downloaded `*-unsigned.ipa`.
6. Sign/install with your Apple ID.

The workflow builds without Apple signing (`CODE_SIGNING_ALLOWED=NO`) and packages an unsigned IPA for local sideload signing.

## Notes

- Minimum iOS target is `16.1` (ActivityKit + Dynamic Island support path).
- Dynamic Island compact/expanded UI lives in `Widget/ClipIslandWidget.swift`.
