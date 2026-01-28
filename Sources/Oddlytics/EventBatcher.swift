import Foundation

/// Batches events and sends them periodically
actor EventBatcher {
    private let configuration: Configuration
    private var queue: [Event] = []
    private var timer: Task<Void, Never>?
    private let session: URLSession

    init(configuration: Configuration) {
        self.configuration = configuration
        self.session = URLSession.shared
        Task {
            await startTimer()
        }
    }

    /// Add event to queue
    func enqueue(_ event: Event) {
        queue.append(event)

        if configuration.debugMode {
            print("[Oddlytics] Enqueued event: \(event.event), queue size: \(queue.count)")
        }

        // Send if batch size reached
        if queue.count >= configuration.batchSize {
            Task { await flush() }
        }
    }

    /// Send all queued events
    func flush() async {
        guard !queue.isEmpty else { return }

        let eventsToSend = queue
        queue.removeAll()

        await sendEvents(eventsToSend)
    }

    /// Send events to API
    private func sendEvents(_ events: [Event]) async {
        let batch = EventBatch(events: events)

        guard let jsonData = try? JSONSerialization.data(withJSONObject: batch.toJSON()) else {
            if configuration.debugMode {
                print("[Oddlytics] Failed to serialize events")
            }
            return
        }

        var request = URLRequest(url: configuration.endpoint.appendingPathComponent("track"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(configuration.apiKey, forHTTPHeaderField: "X-API-KEY")
        request.httpBody = jsonData

        do {
            let (data, response) = try await session.data(for: request)

            if let httpResponse = response as? HTTPURLResponse {
                // Success
                if (200...299).contains(httpResponse.statusCode) {
                     if configuration.debugMode {
                        print("[Oddlytics] Sent \(events.count) events, status: \(httpResponse.statusCode)")
                    }
                    return
                }
                
                // Client Error - 4xx (except 429) -> Drop events
                if (400...499).contains(httpResponse.statusCode) && httpResponse.statusCode != 429 {
                    if configuration.debugMode {
                        print("[Oddlytics] Dropping \(events.count) events due to client error: \(httpResponse.statusCode)")
                    }
                    return
                }

                // Server Error - Log it but maybe retry only on 5xx
                if configuration.debugMode {
                    print("[Oddlytics] Server returned status: \(httpResponse.statusCode)")
                    if let errorMessage = String(data: data, encoding: .utf8) {
                        print("[Oddlytics] Response: \(errorMessage)")
                    }
                }
            }
        } catch {
             if configuration.debugMode {
                print("[Oddlytics] Network error: \(error.localizedDescription)")
            }
        }
        
        // Failure: Re-queue events for next batch (simple retry)
        // We prepend them back to the queue so they aren't lost, 
        // but we need to guard against infinite loops/overflow
        if queue.count < 1000 { // Safety limit
            queue.insert(contentsOf: events, at: 0)
             if configuration.debugMode {
                print("[Oddlytics] Re-queued \(events.count) events due to failure")
            }
        } else {
             print("[Oddlytics] Dropped \(events.count) events due to queue limit")
        }
    }

    /// Start periodic flush timer
    private func startTimer() {
        timer?.cancel()

        timer = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(configuration.batchInterval * 1_000_000_000))
                await flush()
            }
        }
    }

    deinit {
        timer?.cancel()
    }
}
