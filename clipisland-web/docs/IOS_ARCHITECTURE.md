# ClipIsland iOS Architecture Scaffold

This maps the web prototype into a native iOS product architecture with `SwiftUI`, `ActivityKit`, and `UIPasteboard`.

## Product Modules

- `ClipIslandApp` (SwiftUI app entry + dependency container)
- `ClipboardEngine` (polling, dedupe, type detection, save pipeline)
- `ClipStore` (SwiftData/CoreData persistence)
- `CapsuleStore` (prebuilt + user-defined capsule bundles)
- `LiveActivityEngine` (ActivityKit start/update/end)
- `DynamicIslandViews` (compact/expanded/minimal widgets)
- `QuickPasteKeyboard` (custom keyboard extension target)

## Core Data Models

### ClipItem
- `id: UUID`
- `value: String`
- `type: ClipType` (`url`, `phone`, `otp`, `text`)
- `isFavorite: Bool`
- `source: ClipSource` (`clipboard`, `capsule`, `manual`)
- `createdAt: Date`
- `lastUsedAt: Date?`

### CopyCapsule
- `id: UUID`
- `name: String`
- `items: [String]`
- `createdAt: Date`
- `updatedAt: Date`

## Clipboard Engine (`UIPasteboard`)

### Responsibilities
- Poll `UIPasteboard.general.string` every N seconds when autosave enabled
- Ignore empty values
- Deduplicate and move existing clips to top
- Persist newest-first history
- Emit app-level events for UI + Live Activity updates

### Pseudocode

```swift
final class ClipboardEngine: ObservableObject {
    @Published var autosaveEnabled: Bool = true
    private var lastSeen: String = ""
    private var timer: Timer?

    func startPolling() {
        stopPolling()
        guard autosaveEnabled else { return }
        timer = Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { [weak self] _ in
            self?.captureIfNeeded()
        }
    }

    private func captureIfNeeded() {
        guard let value = UIPasteboard.general.string?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty,
              value != lastSeen else { return }
        lastSeen = value
        saveClip(value)
    }
}
```

## Smart Detection Service

Create a pure service:
- `ClipTypeDetector.detect(_ value: String) -> ClipType`

Rules:
- URL regex -> `url`
- phone regex -> `phone`
- 4-8 digit token regex -> `otp`
- fallback -> `text`

Expose contextual actions:
- `url`: open in Safari
- `phone`: `tel:` call intent
- `otp`: copy for autofill
- `text`: paste/copy

## Dynamic Island + Live Activity (`ActivityKit`)

### Activity Attributes

```swift
struct ClipIslandAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var clipCount: Int
        var latestPreview: String
        var latestType: ClipType
        var pulseToken: Int
    }

    var sessionID: String
}
```

### Update Flow

1. New clip saved in `ClipStore`
2. `LiveActivityEngine` receives event
3. `Activity.update(using:)` called with:
   - new count
   - truncated latest preview
   - type icon hint
   - incremented pulse token for animation state

### Widget Layouts

- **Compact leading**: type icon (`🔐`, `🔗`, `📝`, `📞`)
- **Compact trailing**: clip count badge
- **Expanded center**: latest preview + quick actions row
- **Minimal**: icon + count

## SwiftUI App Screens

### `IslandHomeView`
- Hero floating island (collapsed/expanded morph)
- Recent clip stack
- Swipe left/right across active clip
- Pin/unpin
- Clear history

### `CapsulesView`
- Personal Info Pack / Coding Snippets / Study Notes
- User-created capsule editor
- One-tap "copy all" pipeline

### `QuickPasteTabView`
- Keyboard-like grid sorted by favorites first
- One-tap copy/paste handoff

### `SettingsView`
- Toggle `Enable Auto Save Clipboard`
- Polling interval controls
- Privacy messaging

## Suggested Folder Layout

```txt
ClipIsland/
  App/
    ClipIslandApp.swift
    AppContainer.swift
  Features/
    Home/
    Capsules/
    KeyboardTab/
    Settings/
  Domain/
    Models/
    Services/ClipTypeDetector.swift
  Data/
    Persistence/ClipStore.swift
    Persistence/CapsuleStore.swift
    Clipboard/ClipboardEngine.swift
  LiveActivity/
    ClipIslandAttributes.swift
    LiveActivityEngine.swift
    DynamicIslandWidget.swift
  Shared/
    DesignSystem/
    Utils/
```

## Extension Targets

- **Widget Extension**: Live Activity + Dynamic Island layouts
- **Keyboard Extension** (optional premium feature):
  - quick paste bar
  - favorite clips
  - privacy-safe read/write policy

## Privacy + Platform Notes

- Clipboard reads may surface platform privacy banners; be explicit in onboarding.
- Keep all clips local by default; sync should be opt-in.
- For startup-grade UX, pair save events with subtle haptics and spring animations.
