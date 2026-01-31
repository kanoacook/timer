import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct StudyTimerAttributes: ActivityAttributes {
    /// Static data that doesn't change during the activity
    let sessionId: String
    let title: String

    /// Dynamic data that updates during the activity
    struct ContentState: Codable, Hashable {
        var elapsedSeconds: Int
        var isPaused: Bool
    }
}
