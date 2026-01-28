import Foundation

/// Main analytics interface
public enum Analytics {
    private static var batcher: EventBatcher?
    private static var configuration: Configuration?
    private static var sessionId: String = UUID().uuidString
    
    /// Persistent anonymous user ID
    private static var userId: String {
        get {
            if let stored = UserDefaults.standard.string(forKey: "oddlytics_user_id") {
                return stored
            }
            let newId = UUID().uuidString
            UserDefaults.standard.set(newId, forKey: "oddlytics_user_id")
            return newId
        }
    }

    /// Configure analytics (call once at app launch)
    public static func configure(
        endpoint: String,
        apiKey: String,
        appId: String,
        batchSize: Int = 20,
        batchInterval: TimeInterval = 10.0,
        debugMode: Bool = false
    ) {
        let config = Configuration(
            endpoint: endpoint,
            apiKey: apiKey,
            appId: appId,
            batchSize: batchSize,
            batchInterval: batchInterval,
            debugMode: debugMode
        )

        self.configuration = config
        self.batcher = EventBatcher(configuration: config)

        if config.debugMode {
            print("[Oddlytics] Configured with endpoint: \(endpoint)")
            print("[Oddlytics] Session ID: \(sessionId)")
            print("[Oddlytics] User ID: \(userId)")
        }
    }

    /// Track an event
    public static func track(_ eventName: String, metadata: [String: String] = [:]) {
        guard let config = configuration else {
            print("[Oddlytics] Warning: Analytics not configured. Call configure() first.")
            return
        }

        let event = Event(
            event: eventName,
            appId: config.appId,
            metadata: metadata,
            sessionId: sessionId,
            userId: userId
        )

        Task {
            await batcher?.enqueue(event)
        }
    }

    /// Manually flush all queued events
    public static func flush() {
        Task {
            await batcher?.flush()
        }
    }

    /// Reset session ID (call on significant app events if needed)
    public static func resetSession() {
        sessionId = UUID().uuidString

        if let config = configuration, config.debugMode {
            print("[Oddlytics] New session ID: \(sessionId)")
        }
    }
}
