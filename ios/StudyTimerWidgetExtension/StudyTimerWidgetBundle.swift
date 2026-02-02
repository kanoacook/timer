import SwiftUI
import WidgetKit

@main
struct StudyTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.1, *) {
            StudyTimerLiveActivity()
        }
    }
}
