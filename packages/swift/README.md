# Oddlytics Swift Package

Privacy-first analytics SDK for iOS apps.

## Installation

Add to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/yourusername/Oddlytics", from: "1.0.0")
]
```

## Usage

```swift
import Oddlytics

// Configure once in your App or AppDelegate
Analytics.configure(
    endpoint: "https://your-worker.workers.dev",
    apiKey: "your-secret-key",
    appId: "MyAwesomeApp"
)

// Track events anywhere
Analytics.track("screen_view", metadata: ["screen": "Home"])
Analytics.track("button_tap", metadata: ["button": "Login"])
```

## Privacy

- No device identifiers (IDFA, IDFV)
- Session ID is random UUID per app launch
- Metadata is opt-in per event
- All events queued locally on network failure

## Features

- Automatic batching (every 10 seconds or 20 events)
- Retry with exponential backoff
- Silent failures in production
- No external dependencies
