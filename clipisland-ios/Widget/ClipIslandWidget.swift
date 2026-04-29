import ActivityKit
import SwiftUI
import WidgetKit

struct ClipIslandWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ClipIslandAttributes.self) { context in
            VStack(alignment: .leading, spacing: 6) {
                Text("ClipIsland")
                    .font(.headline)
                Text(context.state.latestPreview)
                    .lineLimit(1)
                Text("Clips: \(context.state.clipCount)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: icon(for: context.state.latestType))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.clipCount)")
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.latestPreview).lineLimit(1)
                }
            } compactLeading: {
                Image(systemName: icon(for: context.state.latestType))
            } compactTrailing: {
                Text("\(context.state.clipCount)")
            } minimal: {
                Image(systemName: icon(for: context.state.latestType))
            }
        }
    }

    private func icon(for type: String) -> String {
        switch type {
        case "url": return "link"
        case "phone": return "phone.fill"
        case "otp": return "lock.fill"
        default: return "note.text"
        }
    }
}
