import XCTest
@testable import Oddlytics

final class EventTests: XCTestCase {
    func testEventCreation() {
        let event = Event(
            event: "test_event",
            appId: "TestApp",
            metadata: ["key": "value"],
            sessionId: "session123",
            userId: "user123"
        )

        XCTAssertEqual(event.event, "test_event")
        XCTAssertEqual(event.app_id, "TestApp")
        XCTAssertEqual(event.platform, "iOS")
        XCTAssertEqual(event.metadata["key"], "value")
        XCTAssertEqual(event.session_id, "session123")
        XCTAssertEqual(event.user_id, "user123")
    }

    func testEventToJSON() {
        let event = Event(
            event: "test_event",
            appId: "TestApp",
            metadata: ["key": "value"],
            sessionId: "session123",
            userId: "user123"
        )

        let json = event.toJSON()

        XCTAssertEqual(json["event"] as? String, "test_event")
        XCTAssertEqual(json["app_id"] as? String, "TestApp")
        XCTAssertEqual(json["platform"] as? String, "iOS")
        XCTAssertEqual(json["session_id"] as? String, "session123")
        XCTAssertEqual(json["user_id"] as? String, "user123")
    }

    func testEventBatchToJSON() {
        let event1 = Event(event: "event1", appId: "App", sessionId: "session1", userId: "user1")
        let event2 = Event(event: "event2", appId: "App", sessionId: "session1", userId: "user1")
        let batch = EventBatch(events: [event1, event2])

        let json = batch.toJSON()
        let events = json["events"] as? [[String: Any]]

        XCTAssertEqual(events?.count, 2)
        XCTAssertEqual(events?[0]["event"] as? String, "event1")
        XCTAssertEqual(events?[1]["event"] as? String, "event2")
    }
}
