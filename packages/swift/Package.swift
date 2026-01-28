// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Oddlytics",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "Oddlytics",
            targets: ["Oddlytics"]
        ),
    ],
    targets: [
        .target(
            name: "Oddlytics",
            dependencies: []
        ),
        .testTarget(
            name: "OddlyticsTests",
            dependencies: ["Oddlytics"]
        ),
    ]
)
