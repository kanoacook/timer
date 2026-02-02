import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct StudyTimerAttributes: ActivityAttributes {
    /// Static data that doesn't change during the activity
    let sessionId: String
    let title: String

    /// Dynamic data that updates during the activity
    struct ContentState: Codable, Hashable {
        /// The absolute session start time (from Supabase)
        var startDate: Date
        /// Total seconds spent in paused state (used to adjust the timer display)
        var totalPausedSeconds: Int
        var isPaused: Bool

        /// Adjusted start date for SwiftUI Text(timerInterval:)
        /// Shifts the start forward by the total paused duration so the timer shows correct elapsed time
        var adjustedStartDate: Date {
            return startDate.addingTimeInterval(Double(totalPausedSeconds))
        }

        /// Computed timer interval for SwiftUI Text(timerInterval:)
        var timerInterval: ClosedRange<Date> {
            // Use 24 hours from now instead of distantFuture to avoid display issues
            return adjustedStartDate...Date().addingTimeInterval(86400)
        }
    }
}
