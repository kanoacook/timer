import ExpoModulesCore
import ActivityKit

public class LiveActivityModule: Module {
    // Keep track of the current activity
    private var currentActivityId: String?

    public func definition() -> ModuleDefinition {
        Name("LiveActivity")

        // Check if Live Activities are supported
        Function("isSupported") { () -> Bool in
            if #available(iOS 16.1, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        // Start a new Live Activity
        AsyncFunction("startActivity") { (sessionId: String, title: String) -> [String: Any] in
            guard #available(iOS 16.1, *) else {
                return ["success": false, "error": "Live Activities require iOS 16.1+"]
            }

            // End any existing activity first
            await self.endAllActivitiesInternal()

            let attributes = StudyTimerAttributes(sessionId: sessionId, title: title)
            let initialState = StudyTimerAttributes.ContentState(elapsedSeconds: 0, isPaused: false)

            do {
                let activity = try Activity.request(
                    attributes: attributes,
                    content: .init(state: initialState, staleDate: nil),
                    pushType: nil
                )
                self.currentActivityId = activity.id
                return ["success": true, "activityId": activity.id]
            } catch {
                return ["success": false, "error": error.localizedDescription]
            }
        }

        // Update the current Live Activity
        AsyncFunction("updateActivity") { (elapsedSeconds: Int, isPaused: Bool) -> Bool in
            guard #available(iOS 16.1, *) else {
                return false
            }

            guard let activityId = self.currentActivityId else {
                return false
            }

            let newState = StudyTimerAttributes.ContentState(
                elapsedSeconds: elapsedSeconds,
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
        }

        // End the current Live Activity
        AsyncFunction("endActivity") { () -> Bool in
            guard #available(iOS 16.1, *) else {
                return false
            }

            guard let activityId = self.currentActivityId else {
                return false
            }

            for activity in Activity<StudyTimerAttributes>.activities {
                if activity.id == activityId {
                    await activity.end(nil, dismissalPolicy: .immediate)
                    self.currentActivityId = nil
                    return true
                }
            }

            self.currentActivityId = nil
            return false
        }

        // End all Live Activities (cleanup)
        AsyncFunction("endAllActivities") { () -> Void in
            await self.endAllActivitiesInternal()
        }

        // Get the current activity state
        Function("getCurrentActivityId") { () -> String? in
            return self.currentActivityId
        }
    }

    @available(iOS 16.1, *)
    private func endAllActivitiesInternal() async {
        for activity in Activity<StudyTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        self.currentActivityId = nil
    }
}
