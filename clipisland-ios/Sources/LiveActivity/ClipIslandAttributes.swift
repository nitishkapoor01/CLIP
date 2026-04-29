import ActivityKit

struct ClipIslandAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var clipCount: Int
        var latestPreview: String
        var latestType: String
    }

    var sessionID: String
}
