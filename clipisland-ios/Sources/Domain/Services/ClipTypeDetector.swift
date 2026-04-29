import Foundation

enum ClipTypeDetector {
    static func detect(_ value: String) -> ClipType {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if isURL(trimmed) { return .url }
        if isOTP(trimmed) { return .otp }
        if isPhone(trimmed) { return .phone }
        return .text
    }

    private static func isURL(_ value: String) -> Bool {
        value.range(of: #"^(https?:\/\/|www\.)\S+$"#, options: .regularExpression) != nil
    }

    private static func isOTP(_ value: String) -> Bool {
        value.range(of: #"\b\d{4,8}\b"#, options: .regularExpression) != nil
    }

    private static func isPhone(_ value: String) -> Bool {
        value.range(of: #"(?:\+?\d{1,3}[ -]?)?(?:\(?\d{3}\)?[ -]?)?\d{3}[ -]?\d{4}\b"#, options: .regularExpression) != nil
    }
}
