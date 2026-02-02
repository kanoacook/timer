import ExpoModulesCore
import ActivityKit

public class LiveActivityModule: Module {
    // Keep track of the current activity
    private var currentActivityId: String?
    // Store the start date for the current session
    private var sessionStartDate: Date?

    public func definition() -> ModuleDefinition {
        Name("LiveActivity")

        // Check if Live Activities are supported
        Function("isSupported") { () -> Bool in
            if #available(iOS 16.2, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        // Start a new Live Activity
        // Parameters: sessionId, title, startTime (optional JS timestamp in ms)
        AsyncFunction("startActivity") { (sessionId: String, title: String, startTime: Double?) -> [String: Any] in
            if #available(iOS 16.2, *) {
                // End any existing activity first
                await self.endAllActivitiesInternal()

                // Use provided startTime or current time
                let startDate: Date
                if let jsTimestamp = startTime {
                    startDate = Date(timeIntervalSince1970: jsTimestamp / 1000)
                } else {
                    startDate = Date()
                }
                self.sessionStartDate = startDate

                let attributes = StudyTimerAttributes(sessionId: sessionId, title: title)
                let initialState = StudyTimerAttributes.ContentState(
                    startDate: startDate,
                    accumulatedSeconds: 0,
                    isPaused: false
                )

                do {
                    let activity = try Activity.request(
                        attributes: attributes,
                        content: .init(state: initialState, staleDate: nil),
                        pushType: nil
                    )
                    self.currentActivityId = activity.id
                    return [
                        "success": true,
                        "activityId": activity.id,
                        "startTime": startDate.timeIntervalSince1970 * 1000 // Return JS timestamp
                    ]
                } catch {
                    return ["success": false, "error": error.localizedDescription]
                }
            } else {
                return ["success": false, "error": "Live Activities require iOS 16.2+"]
            }
        }

        // Update the current Live Activity
        // Parameters: accumulatedSeconds, isPaused, startTime (optional JS timestamp in ms)
        AsyncFunction("updateActivity") { (accumulatedSeconds: Int, isPaused: Bool, startTime: Double?) -> Bool in
            if #available(iOS 16.2, *) {
                guard let activityId = self.currentActivityId else {
                    return false
                }

                // Use provided startTime or fall back to stored session start date
                let startDate: Date
                if let jsTimestamp = startTime {
                    startDate = Date(timeIntervalSince1970: jsTimestamp / 1000)
                } else if let stored = self.sessionStartDate {
                    startDate = stored
                } else {
                    // Fallback: calculate from accumulated seconds
                    startDate = Date().addingTimeInterval(-Double(accumulatedSeconds))
                }

                let newState = StudyTimerAttributes.ContentState(
                    startDate: startDate,
                    accumulatedSeconds: accumulatedSeconds,
                    isPaused: isPaused
                )

                // Find the activity by ID
                for activity in Activity<StudyTimerAttributes>.activities {
                    if activity.id == activityId {
                        await activity.update(
                            ActivityContent(state: newState, staleDate: nil)
                        )
                        return true
                    }
                }
                return false
            } else {
                return false
            }
        }

        // End the current Live Activity
        AsyncFunction("endActivity") { () -> Bool in
            if #available(iOS 16.2, *) {
                guard let activityId = self.currentActivityId else {
                    return false
                }

                for activity in Activity<StudyTimerAttributes>.activities {
                    if activity.id == activityId {
                        await activity.end(nil, dismissalPolicy: .immediate)
                        self.currentActivityId = nil
                        self.sessionStartDate = nil
                        return true
                    }
                }

                self.currentActivityId = nil
                self.sessionStartDate = nil
                return false
            } else {
                return false
            }
        }

        // End all Live Activities (cleanup)
        AsyncFunction("endAllActivities") { () -> Void in
            if #available(iOS 16.2, *) {
                await self.endAllActivitiesInternal()
            }
        }

        // Get the current activity state
        Function("getCurrentActivityId") { () -> String? in
            return self.currentActivityId
        }
    }

    @available(iOS 16.2, *)
    private func endAllActivitiesInternal() async {
        for activity in Activity<StudyTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        self.currentActivityId = nil
        self.sessionStartDate = nil
    }
}
