import Foundation

enum ClipType: String, Codable, CaseIterable {
    case url
    case phone
    case otp
    case text

    var icon: String {
        switch self {
        case .url: return "link"
        case .phone: return "phone.fill"
        case .otp: return "lock.fill"
        case .text: return "note.text"
        }
    }

    var label: String {
        switch self {
        case .url: return "Link Saved"
        case .phone: return "Number Saved"
        case .otp: return "OTP Saved"
        case .text: return "Note Saved"
        }
    }
}

struct ClipItem: Identifiable, Codable, Equatable {
    let id: UUID
    var value: String
    var type: ClipType
    var isFavorite: Bool
    var createdAt: Date
    var updatedAt: Date

    init(id: UUID = UUID(), value: String, type: ClipType, isFavorite: Bool = false, createdAt: Date = .now, updatedAt: Date = .now) {
        self.id = id
        self.value = value
        self.type = type
        self.isFavorite = isFavorite
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

struct CopyCapsule: Identifiable, Codable {
    let id: UUID
    var name: String
    var items: [String]
}
