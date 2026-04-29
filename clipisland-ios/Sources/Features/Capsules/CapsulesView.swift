import SwiftUI

struct CapsulesView: View {
    @ObservedObject var store: ClipStore

    private let capsules: [CopyCapsule] = [
        CopyCapsule(id: UUID(), name: "Personal Info Pack", items: ["Alex Johnson", "+1 415 555 0178", "alex@clipisland.app"]),
        CopyCapsule(id: UUID(), name: "Coding Snippets", items: ["git checkout -b feature/clip-island", "npm run lint && npm run test", "let enabled = true"]),
        CopyCapsule(id: UUID(), name: "Study Notes", items: ["Spaced repetition beats cramming.", "Focus blocks: 50/10.", "Summarize before memorizing."])
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Copy Capsules")
                .font(.headline)
            Text("Reusable bundles for one-tap paste flows")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(capsules) { capsule in
                Button {
                    let bundle = capsule.items.joined(separator: "\n")
                    UIPasteboard.general.string = bundle
                    store.addClip(bundle)
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(capsule.name).font(.subheadline.bold())
                            Text("\(capsule.items.count) clips").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Image(systemName: "capsule")
                    }
                    .padding(12)
                }
                .buttonStyle(.plain)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(.white.opacity(0.12), lineWidth: 1)
        )
    }
}
