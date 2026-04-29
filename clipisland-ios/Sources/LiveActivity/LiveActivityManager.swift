import ActivityKit
import Foundation

@MainActor
final class LiveActivityManager {
    static let shared = LiveActivityManager()
    private var activity: Activity<ClipIslandAttributes>?

    func startIfNeeded() {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        guard activity == nil else { return }

        let attrs = ClipIslandAttributes(sessionID: UUID().uuidString)
        let initial = ClipIslandAttributes.ContentState(clipCount: 0, latestPreview: "Ready", latestType: "text")
        do {
            activity = try Activity.request(attributes: attrs, contentState: initial)
        } catch {
            // Safely ignore if user has disabled live activities.
        }
    }

    func update(with clips: [ClipItem]) {
        guard let activity else { return }
        let latest = clips.first
        let state = ClipIslandAttributes.ContentState(
            clipCount: clips.count,
            latestPreview: String((latest?.value ?? "Nothing saved").prefix(28)),
            latestType: latest?.type.rawValue ?? "text"
        )
        Task {
            await activity.update(using: state)
        }
    }
}
