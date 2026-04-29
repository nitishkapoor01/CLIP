import SwiftUI
import UIKit

struct IslandHomeView: View {
    @ObservedObject var store: ClipStore
    let engine: ClipboardEngine

    @State private var expanded = false
    @State private var activeIndex = 0
    @State private var showPulse = false

    private var clips: [ClipItem] { store.clips }
    private var activeClip: ClipItem? {
        guard clips.indices.contains(activeIndex) else { return clips.first }
        return clips[activeIndex]
    }

    var body: some View {
        NavigationStack {
            GeometryReader { proxy in
                ScrollView {
                    VStack(spacing: 16) {
                        island(screenWidth: proxy.size.width)
                        controls
                        CapsulesView(store: store)
                        KeyboardTabView(store: store)
                    }
                    .frame(maxWidth: min(proxy.size.width - 24, 420))
                    .padding(.horizontal, 12)
                    .padding(.top, 10)
                    .padding(.bottom, max(proxy.safeAreaInsets.bottom, 16))
                }
            }
            .background(
                LinearGradient(colors: [.black, Color.blue.opacity(0.35)], startPoint: .topLeading, endPoint: .bottomTrailing)
                    .ignoresSafeArea()
            )
            .navigationTitle("ClipIsland")
            .onChange(of: store.clips.count) { _ in
                showPulse = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { showPulse = false }
                LiveActivityManager.shared.update(with: store.clips)
            }
            .onAppear { engine.start() }
        }
    }

    private func island(screenWidth: CGFloat) -> some View {
        let islandWidth = min(max(screenWidth - 24, 300), 390)
        let collapsedMinHeight: CGFloat = 84
        let expandedMinHeight: CGFloat = 200

        return VStack(spacing: 10) {
            Button {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
                    expanded.toggle()
                }
            } label: {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Label("\(clips.count)", systemImage: clips.first?.type.icon ?? "square.stack")
                        Spacer()
                        Text(clips.first?.type.label ?? "Ready")
                    }
                    .font(.subheadline.bold())

                    Text(clips.first?.value ?? "Copy anything to start")
                        .lineLimit(1)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if expanded, let activeClip {
                        Divider().overlay(.white.opacity(0.2))
                        Text(activeClip.value)
                            .font(.subheadline)
                        HStack {
                            Button("Paste") { UIPasteboard.general.string = activeClip.value }
                            Button(activeClip.isFavorite ? "Unpin" : "Pin") { store.toggleFavorite(activeClip) }
                            Spacer()
                            Button("Clear") { store.clearAll() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
                .foregroundStyle(.white)
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .frame(minHeight: expanded ? expandedMinHeight : collapsedMinHeight)
            }
            .buttonStyle(.plain)
            .frame(width: islandWidth)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: expanded ? 26 : 36, style: .continuous))
            .overlay {
                if showPulse {
                    RoundedRectangle(cornerRadius: expanded ? 26 : 36, style: .continuous)
                        .stroke(.cyan.opacity(0.8), lineWidth: 1)
                        .scaleEffect(1.03)
                        .opacity(0.0)
                        .animation(.easeOut(duration: 0.65), value: showPulse)
                }
            }

            if expanded {
                HStack {
                    Button("Prev") { activeIndex = max(0, activeIndex - 1) }
                    Button("Next") { activeIndex = min(max(0, clips.count - 1), activeIndex + 1) }
                    Spacer()
                }
                .buttonStyle(.bordered)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 10) {
            Toggle("Enable Auto Save Clipboard", isOn: Binding(
                get: { store.autoSaveEnabled },
                set: {
                    store.updateAutoSave($0)
                    if $0 { engine.start() } else { engine.stop() }
                }
            ))

            Button("Capture Clipboard Now") { engine.captureIfNeeded() }
                .buttonStyle(.borderedProminent)
        }
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
