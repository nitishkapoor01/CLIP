import Foundation
import UIKit

@MainActor
final class ClipboardEngine: ObservableObject {
    private var timer: Timer?
    private var lastSeenValue = ""
    private let interval: TimeInterval = 3
    private let store: ClipStore
    private let liveActivity = LiveActivityManager.shared

    init(store: ClipStore) {
        self.store = store
        liveActivity.startIfNeeded()
    }

    func start() {
        stop()
        guard store.autoSaveEnabled else { return }
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.captureIfNeeded()
            }
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
    }

    func captureIfNeeded() {
        guard let raw = UIPasteboard.general.string else { return }
        let value = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty, value != lastSeenValue else { return }

        lastSeenValue = value
        store.addClip(value)
        liveActivity.update(with: store.clips)
    }
}
