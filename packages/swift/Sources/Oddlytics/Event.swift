import Foundation

/// Analytics event
struct Event: Codable {
    let event: String
    let app_id: String
    let platform: String
    let metadata: [String: String]
    let session_id: String
    let user_id: String
    let timestamp: TimeInterval

    init(
        event: String,
        appId: String,
        metadata: [String: String] = [:],
        sessionId: String,
        userId: String
    ) {
        self.event = event
        self.app_id = appId
        self.platform = "iOS"
        self.metadata = metadata
        self.session_id = sessionId
        self.user_id = userId
        self.timestamp = Date().timeIntervalSince1970
    }

    /// Convert to JSON dictionary for API
    func toJSON() -> [String: Any] {
        return [
            "event": event,
            "app_id": app_id,
            "platform": platform,
            "metadata": metadata,
            "session_id": session_id,
            "user_id": user_id,
            "timestamp": timestamp
        ]
    }
}

/// Batch of events for API
struct EventBatch: Codable {
    let events: [Event]

    func toJSON() -> [String: Any] {
        return [
            "events": events.map { $0.toJSON() }
        ]
    }
}
