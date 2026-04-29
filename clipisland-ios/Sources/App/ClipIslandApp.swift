import SwiftUI

@main
struct ClipIslandApp: App {
    @StateObject private var store = ClipStore()
    @StateObject private var engineHolder = EngineHolder()

    var body: some Scene {
        WindowGroup {
            IslandHomeView(store: store, engine: engineHolder.engine(for: store))
                .preferredColorScheme(.dark)
        }
    }
}

@MainActor
final class EngineHolder: ObservableObject {
    private var cached: ClipboardEngine?

    func engine(for store: ClipStore) -> ClipboardEngine {
        if let cached { return cached }
        let engine = ClipboardEngine(store: store)
        cached = engine
        return engine
    }
}
