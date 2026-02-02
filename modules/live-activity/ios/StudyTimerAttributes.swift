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

        /// Adjusted start date for SwiftUI Text(date, style: .timer)
        /// This represents the "virtual" start time accounting for accumulated seconds
        var adjustedStartDate: Date {
            return startDate.addingTimeInterval(-Double(accumulatedSeconds))
        }

        /// Computed timer interval for SwiftUI Text(timerInterval:)
        var timerInterval: ClosedRange<Date> {
            return adjustedStartDate...Date.distantFuture
        }
    }
}
