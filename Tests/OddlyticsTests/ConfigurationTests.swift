import XCTest
@testable import Oddlytics

final class ConfigurationTests: XCTestCase {
    func testConfigurationDefaults() {
        let config = Configuration(
            endpoint: "https://example.com",
            apiKey: "test-key",
            appId: "TestApp"
        )

        XCTAssertEqual(config.endpoint.absoluteString, "https://example.com")
        XCTAssertEqual(config.apiKey, "test-key")
        XCTAssertEqual(config.appId, "TestApp")
        XCTAssertEqual(config.batchSize, 20)
        XCTAssertEqual(config.batchInterval, 10.0)
        XCTAssertFalse(config.debugMode)
    }

    func testConfigurationCustomValues() {
        let config = Configuration(
            endpoint: "https://example.com",
            apiKey: "test-key",
            appId: "TestApp",
            batchSize: 50,
            batchInterval: 5.0,
            debugMode: true
        )

        XCTAssertEqual(config.batchSize, 50)
        XCTAssertEqual(config.batchInterval, 5.0)
        XCTAssertTrue(config.debugMode)
    }
}
