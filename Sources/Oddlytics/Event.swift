import Foundation

/// Analytics event
struct Event: Codable {
    let event: String
    let app_id: String
    let platform: String
    let metadata: [String: String]
    let session_id: String
    let user_id: String
    let device_id: String?
    let timestamp: TimeInterval

    init(
        event: String,
        appId: String,
        metadata: [String: String] = [:],
        sessionId: String,
        userId: String,
        deviceId: String? = nil
    ) {
        self.event = event
        self.app_id = appId
        self.platform = "iOS"
        self.metadata = metadata
        self.session_id = sessionId
        self.user_id = userId
        self.device_id = deviceId
        self.timestamp = Date().timeIntervalSince1970
    }

    /// Convert to JSON dictionary for API
    func toJSON() -> [String: Any] {
        var json: [String: Any] = [
            "event": event,
            "app_id": app_id,
            "platform": platform,
            "metadata": metadata,
            "session_id": session_id,
            "user_id": user_id,
            "timestamp": timestamp
        ]
        
        if let device_id = device_id {
            json["device_id"] = device_id
        }
        
        return json
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
