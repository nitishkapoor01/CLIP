import SwiftUI
import UIKit

struct KeyboardTabView: View {
    @ObservedObject var store: ClipStore

    var quickKeys: [ClipItem] {
        let favorites = store.clips.filter(\.isFavorite)
        let rest = store.clips.filter { !$0.isFavorite }
        return Array((favorites + rest).prefix(8))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Smart Keyboard Tab")
                .font(.headline)
            Text("One tap quick paste")
                .font(.caption)
                .foregroundStyle(.secondary)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(quickKeys) { clip in
                    Button {
                        UIPasteboard.general.string = clip.value
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Label(clip.type.label, systemImage: clip.type.icon)
                                .font(.caption.bold())
                            Text(clip.value)
                                .lineLimit(2)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                    }
                    .buttonStyle(.plain)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }
}
