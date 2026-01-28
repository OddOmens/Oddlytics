import Foundation

/// Configuration for Oddlytics analytics
public struct Configuration {
    /// Worker endpoint URL
    let endpoint: URL

    /// API key for authentication
    let apiKey: String

    /// App identifier
    let appId: String

    /// Batch size (number of events before sending)
    let batchSize: Int

    /// Batch interval (seconds before sending)
    let batchInterval: TimeInterval

    /// Enable debug logging
    let debugMode: Bool

    public init(
        endpoint: String,
        apiKey: String,
        appId: String,
        batchSize: Int = 20,
        batchInterval: TimeInterval = 10.0,
        debugMode: Bool = false
    ) {
        guard let url = URL(string: endpoint) else {
            fatalError("Invalid endpoint URL: \(endpoint)")
        }

        self.endpoint = url
        self.apiKey = apiKey
        self.appId = appId
        self.batchSize = batchSize
        self.batchInterval = batchInterval
        self.debugMode = debugMode
    }
}
