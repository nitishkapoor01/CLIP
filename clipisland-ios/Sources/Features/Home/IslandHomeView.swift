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
                        heroHeader
                        island(screenWidth: proxy.size.width)
                        controls
                        CapsulesView(store: store)
                        KeyboardTabView(store: store)
                    }
                    .padding(.horizontal, 14)
                    .padding(.top, 8)
                    .padding(.bottom, max(proxy.safeAreaInsets.bottom, 16))
                }
            }
            .background(
                LinearGradient(colors: [Color(red: 0.04, green: 0.05, blue: 0.09), Color(red: 0.06, green: 0.12, blue: 0.24)], startPoint: .topLeading, endPoint: .bottomTrailing)
                    .ignoresSafeArea()
            )
            .navigationTitle("ClipIsland")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: store.clips.count) { _ in
                showPulse = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { showPulse = false }
                LiveActivityManager.shared.update(with: store.clips)
            }
            .onAppear { engine.start() }
        }
    }

    private func island(screenWidth: CGFloat) -> some View {
        let islandWidth = max(screenWidth - 28, 300)
        let collapsedMinHeight: CGFloat = 84
        let expandedMinHeight: CGFloat = 232

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
                    .font(.headline.weight(.semibold))

                    Text(clips.first?.value ?? "Copy anything to start")
                        .lineLimit(1)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.82))

                    if expanded, let activeClip {
                        Divider().overlay(.white.opacity(0.2))
                        Text(activeClip.value)
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.95))
                            .lineLimit(4)
                        HStack {
                            Button("Paste") { UIPasteboard.general.string = activeClip.value }
                            Button(activeClip.isFavorite ? "Unpin" : "Pin") { store.toggleFavorite(activeClip) }
                            Spacer()
                            Button("Clear") { store.clearAll() }
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .foregroundStyle(.white)
                .padding(18)
                .frame(maxWidth: .infinity, alignment: .leading)
                .frame(minHeight: expanded ? expandedMinHeight : collapsedMinHeight)
            }
            .buttonStyle(.plain)
            .frame(width: islandWidth)
            .background(
                LinearGradient(colors: [Color.black.opacity(0.88), Color.blue.opacity(0.35)], startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: expanded ? 26 : 36, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: expanded ? 26 : 36, style: .continuous)
                    .stroke(.white.opacity(0.18), lineWidth: 1)
            )
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
                .tint(.cyan)
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
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(.white.opacity(0.12), lineWidth: 1)
        )
    }

    private var heroHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Clipboard Intelligence")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.cyan)
                .textCase(.uppercase)
            Text("Your Dynamic Clipboard Island")
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
            Text("Auto-save, quick paste, live updates.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.75))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 4)
    }
}
