import Foundation

@MainActor
final class ClipStore: ObservableObject {
    @Published private(set) var clips: [ClipItem]
    @Published var autoSaveEnabled: Bool

    private let clipStorageKey = "clipIsland.native.history.v1"
    private let autoSaveStorageKey = "clipIsland.native.autosave.v1"
    private let maxHistory = 50

    init() {
        self.clips = Self.load(key: clipStorageKey) ?? []
        self.autoSaveEnabled = UserDefaults.standard.object(forKey: autoSaveStorageKey) as? Bool ?? true
    }

    func addClip(_ value: String) {
        let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { return }

        if let index = clips.firstIndex(where: { $0.value == normalized }) {
            var existing = clips.remove(at: index)
            existing.updatedAt = .now
            clips.insert(existing, at: 0)
        } else {
            let item = ClipItem(value: normalized, type: ClipTypeDetector.detect(normalized))
            clips.insert(item, at: 0)
            clips = Array(clips.prefix(maxHistory))
        }

        save()
    }

    func toggleFavorite(_ item: ClipItem) {
        guard let index = clips.firstIndex(where: { $0.id == item.id }) else { return }
        clips[index].isFavorite.toggle()
        save()
    }

    func clearAll() {
        clips = []
        save()
    }

    func updateAutoSave(_ isEnabled: Bool) {
        autoSaveEnabled = isEnabled
        UserDefaults.standard.set(isEnabled, forKey: autoSaveStorageKey)
    }

    private func save() {
        if let data = try? JSONEncoder().encode(clips) {
            UserDefaults.standard.set(data, forKey: clipStorageKey)
        }
    }

    private static func load(key: String) -> [ClipItem]? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode([ClipItem].self, from: data)
    }
}
