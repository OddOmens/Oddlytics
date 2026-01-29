import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// Main analytics interface
public enum Analytics {
    private static var batcher: EventBatcher?
    private static var configuration: Configuration?
    private static var sessionId: String = UUID().uuidString
    
    /// Persistent anonymous user ID
    private static var userId: String {
        get {
            // Priority 1: IDFV (Shared across vendor apps on iOS)
            #if os(iOS)
            if let idfv = UIDevice.current.identifierForVendor?.uuidString {
                return idfv
            }
            #endif
            
            // Priority 2: Persistent Random ID (Fallback for macOS/other)
            if let stored = UserDefaults.standard.string(forKey: "oddlytics_user_id") {
                return stored
            }
            
            let newId = UUID().uuidString
            UserDefaults.standard.set(newId, forKey: "oddlytics_user_id")
            return newId
        }
    }

    /// Device ID (IDFV on iOS)
    private static var deviceId: String? {
        #if os(iOS)
        return UIDevice.current.identifierForVendor?.uuidString
        #else
        return nil
        #endif
    }

    /// Configure analytics (call once at app launch)
    public static func configure(
        endpoint: String,
        apiKey: String,
        appId: String,
        batchSize: Int = 50,
        batchInterval: TimeInterval = 30.0,
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
        
        setupLifecycleObservers()

        if config.debugMode {
            print("[Oddlytics] Configured with endpoint: \(endpoint)")
            print("[Oddlytics] Session ID: \(sessionId)")
            print("[Oddlytics] User ID: \(userId)")
            if let deviceId = deviceId {
                print("[Oddlytics] Device ID (IDFV): \(deviceId)")
            }
        }
    }
    
    private static func setupLifecycleObservers() {
        #if os(iOS)
        NotificationCenter.default.addObserver(
            forName: UIApplication.willResignActiveNotification,
            object: nil,
            queue: .main
        ) { _ in
            flush()
        }
        #endif
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
            userId: userId,
            deviceId: deviceId
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
