# iOS Integration Guide

This guide explains how to integrate the Oddlytics Swift Package into your iOS application.

## 1. Installation

### Option A: Local Package (Development)
If you are developing locally within the same workspace:
1. Open your iOS project in Xcode.
2. Drag the `packages/swift` folder from your file browser into your Xcode project's file navigator.
3. In your Target settings, under **General** > **Frameworks, Libraries, and Embedded Content**, add `Oddlytics`.

### Option B: Swift Package Manager (Remote)
Once you have pushed this repository to GitHub/GitLab:
1. In Xcode, go to **File** > **Add Package Dependencies...**
2. Enter the URL of your repository.
3. Select the `Oddlytics` library.

## 2. Configuration

Initialize the SDK as early as possible in your app's lifecycle, typically in your `App` struct or `AppDelegate`.

### SwiftUI (`App.swift`)

```swift
import SwiftUI
import Oddlytics

@main
struct MyApp: App {
    init() {
        // Configure Oddlytics on launch
        Analytics.configure(
            endpoint: "https://oddlytics-worker.hello-52a.workers.dev",
            apiKey: "95fb7db2cc0187ca0d036193b5e686feef693479042f92ad47ea72b7857bd920",
            appId: "MyIOSApp", // Your unique app identifier
            debugMode: true    // Set false for production
        )
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    Analytics.track("app_opened")
                }
        }
    }
}
```

### UIKit (`AppDelegate.swift`)

```swift
import UIKit
import Oddlytics

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        Analytics.configure(
            endpoint: "https://oddlytics-worker.hello-52a.workers.dev",
            apiKey: "95fb7db2cc0187ca0d036193b5e686feef693479042f92ad47ea72b7857bd920",
            appId: "MyIOSApp"
        )
        
        Analytics.track("app_launched")
        
        return true
    }
}
```

## 3. Tracking Events

Track any user action by calling `Analytics.track`. You can optionally attach metadata.

### Basic Event
```swift
Analytics.track("button_tapped")
```

### Event with Metadata
```swift
Analytics.track("purchase_completed", metadata: [
    "item_id": "prod_123",
    "amount": "9.99",
    "currency": "USD"
])
```

### Tracking Screen Views (SwiftUI)
```swift
var body: some View {
    HomeView()
        .onAppear {
            Analytics.track("screen_view", metadata: ["screen": "Home"])
        }
}
```

### Grouping Events
You can assign events to a custom group (e.g., "Sleep Aids", "Achievements") to automatically create a dedicated section in the dashboard.

```swift
// Events will appear in a "Sleep Aids" section
Analytics.track("Melatonin", group: "Sleep Aids")
Analytics.track("Magnesium", group: "Sleep Aids", metadata: ["dosage": "5mg"])
```

## 4. Advanced Usage

### Manual Flushing
Events are automatically batched and sent every 10 seconds or when 20 events accumulate. You can force a send (e.g., when the app goes to background):

```swift
// SceneDelegate or SwiftUI .onChange(of: scenePhase)
if phase == .background {
    Analytics.flush()
}
```

### Resetting Sessions
If your app has user accounts and a user logs out, you might want to reset the analytics session ID:

```swift
func logOut() {
    // ... perform logout logic ...
    Analytics.resetSession()
}
```
