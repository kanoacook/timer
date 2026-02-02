import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct StudyTimerAttributes: ActivityAttributes {
    /// Static data that doesn't change during the activity
    let sessionId: String
    let title: String

    /// Dynamic data that updates during the activity
    struct ContentState: Codable, Hashable {
        var startDate: Date
        var accumulatedSeconds: Int
        var isPaused: Bool

        /// Computed timer interval for SwiftUI Text(timerInterval:)
        var timerInterval: ClosedRange<Date> {
            let adjustedStart = startDate.addingTimeInterval(-Double(accumulatedSeconds))
            return adjustedStart...Date.distantFuture
        }
    }
}
