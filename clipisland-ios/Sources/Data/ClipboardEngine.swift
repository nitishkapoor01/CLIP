import Foundation
import UIKit

@MainActor
final class ClipboardEngine: ObservableObject {
    private var timer: Timer?
    private var observer: NSObjectProtocol?
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

        // Event-based capture gives faster updates when clipboard changes.
        observer = NotificationCenter.default.addObserver(
            forName: UIPasteboard.changedNotification,
            object: UIPasteboard.general,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.captureIfNeeded()
            }
        }

        // Keep a lightweight poll fallback for cases where change notification misses.
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.captureIfNeeded()
            }
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
        if let observer {
            NotificationCenter.default.removeObserver(observer)
            self.observer = nil
        }
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
