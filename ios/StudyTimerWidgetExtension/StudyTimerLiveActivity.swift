import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct StudyTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StudyTimerAttributes.self) { context in
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading, priority: 1) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.attributes.title)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .lineLimit(1)
                        Text(context.state.isPaused ? "Paused" : "Studying")
                            .font(.caption2)
                            .foregroundColor(context.state.isPaused ? .orange : .green)
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ZStack {
                        // Background ring
                        Circle()
                            .stroke(Color.gray.opacity(0.3), lineWidth: 3)

                        // Progress ring - fills over 60 minutes
                        Circle()
                            .trim(from: 0, to: hourlyProgress(for: context.state))
                            .stroke(
                                context.state.isPaused ? Color.orange : Color.green,
                                style: StrokeStyle(lineWidth: 3, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))

                        // Time in center
                        if context.state.isPaused {
                            Text(formatTimeCompact(elapsedSeconds(for: context.state)))
                                .font(.system(size: 11, weight: .bold, design: .monospaced))
                                .multilineTextAlignment(.center)
                        } else {
                            Text(timerInterval: context.state.timerInterval, countsDown: false)
                                .font(.system(size: 11, weight: .bold, design: .monospaced))
                                .multilineTextAlignment(.center)
                        }
                    }
                    .frame(width: 52, height: 52)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Image(systemName: context.state.isPaused ? "pause.circle.fill" : "book.fill")
                            .foregroundColor(context.state.isPaused ? .orange : .green)
                        Text(context.state.isPaused ? "Session Paused" : "Session Active")
                            .font(.caption)
                    }
                }
            } compactLeading: {
                Text(context.attributes.title)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .lineLimit(1)
                    .truncationMode(.tail)
            } compactTrailing: {
                Group {
                    if context.state.isPaused {
                        Text(formatTime(elapsedSeconds(for: context.state)))
                            .font(.system(.caption, design: .monospaced))
                            .monospacedDigit()
                    } else {
                        Text(timerInterval: context.state.timerInterval, countsDown: false)
                            .font(.system(.caption, design: .monospaced))
                            .monospacedDigit()
                    }
                }
                .frame(minWidth: 45, alignment: .trailing)
            } minimal: {
                if context.state.isPaused {
                    Text(formatTimeCompact(elapsedSeconds(for: context.state)))
                        .font(.caption2)
                        .monospacedDigit()
                } else {
                    Text(timerInterval: context.state.timerInterval, countsDown: false)
                        .font(.caption2)
                        .monospacedDigit()
                }
            }
        }
    }

    private func formatTime(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }

    private func formatTimeCompact(_ totalSeconds: Int) -> String {
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    /// Calculate elapsed seconds from state (now - startDate - totalPausedSeconds)
    private func elapsedSeconds(for state: StudyTimerAttributes.ContentState) -> Int {
        let now = Date()
        let totalElapsed = now.timeIntervalSince(state.startDate)
        return max(0, Int(totalElapsed) - state.totalPausedSeconds)
    }

    private func hourlyProgress(for state: StudyTimerAttributes.ContentState) -> Double {
        let totalSeconds = elapsedSeconds(for: state)
        let secondsInHour = totalSeconds % 3600
        return Double(secondsInHour) / 3600.0
    }
}

@available(iOS 16.1, *)
struct LockScreenView: View {
    let context: ActivityViewContext<StudyTimerAttributes>

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: "book.fill")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(context.attributes.title)
                        .font(.headline)
                        .lineLimit(1)
                }
                HStack(spacing: 4) {
                    Circle()
                        .fill(context.state.isPaused ? Color.orange : Color.green)
                        .frame(width: 8, height: 8)
                    Text(context.state.isPaused ? "Paused" : "Studying")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
            // Live timer with proper format - use fixed width container for consistent alignment
            Group {
                if context.state.isPaused {
                    Text(formatTime(elapsedSeconds(for: context.state)))
                        .font(.system(size: 28, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(.primary)
                } else {
                    Text(timerInterval: context.state.timerInterval, countsDown: false)
                        .font(.system(size: 28, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(.primary)
                }
            }
            .frame(width: 100, alignment: .trailing)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .activityBackgroundTint(Color.black.opacity(0.9))
        .widgetURL(URL(string: "studytimer://open"))
    }

    /// Calculate elapsed seconds from state (now - startDate - totalPausedSeconds)
    private func elapsedSeconds(for state: StudyTimerAttributes.ContentState) -> Int {
        let now = Date()
        let totalElapsed = now.timeIntervalSince(state.startDate)
        return max(0, Int(totalElapsed) - state.totalPausedSeconds)
    }

    private func formatTime(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%d:%02d", minutes, seconds)
    }
}
