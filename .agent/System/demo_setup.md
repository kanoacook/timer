# iPhone Demo Setup for React Native/Expo Live Activities App

This guide provides comprehensive instructions for setting up and running a React Native/Expo app with iOS Live Activities (Dynamic Island) on a physical iPhone for demonstration purposes.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Expo Development Build Setup](#2-expo-development-build-setup)
3. [Info.plist Configuration](#3-infoplist-configuration)
4. [Swift Native Module Setup](#4-swift-native-module-setup)
5. [Physical iPhone Testing Steps](#5-physical-iphone-testing-steps)
6. [Native Bridge Debugging](#6-native-bridge-debugging)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### macOS Requirements
- **macOS Version:** macOS Ventura 13.0 or later (recommended: macOS Sonoma 14.0+)
- Ensure your Mac supports the required Xcode version

### Xcode Requirements
- **Xcode Version:** 15.0 or later (for iOS 17 SDK)
  - For iOS 16.1 Live Activities: Xcode 14.1+
  - For iOS 17 features: Xcode 15.0+
- **iOS SDK:** iOS 16.1+ (Live Activities minimum), iOS 17+ recommended
- **Command Line Tools:** Must be installed
  ```bash
  xcode-select --install
  ```
- Accept Xcode license:
  ```bash
  sudo xcodebuild -license accept
  ```

### Node.js and Package Manager
- **Node.js:** v18.0.0 or later (LTS recommended)
  ```bash
  node --version  # Should be >= 18.0.0
  ```
- **npm:** v9.0.0+ (comes with Node.js) OR
- **yarn:** v1.22.0+ (classic) or v3.0.0+ (berry)
  ```bash
  npm install -g yarn  # If using yarn
  ```

### Expo CLI
- **Expo CLI:** Latest version
  ```bash
  npm install -g expo-cli
  # Or use npx (recommended)
  npx expo --version
  ```
- **EAS CLI:** Required for development builds
  ```bash
  npm install -g eas-cli
  eas --version
  ```

### Apple Developer Account
- **Requirement:** Paid Apple Developer Program membership ($99/year)
- **Why needed:**
  - Live Activities require proper app signing
  - Device registration for development
  - Push notifications capability (for remote Live Activity updates)
- **Setup steps:**
  1. Sign up at [developer.apple.com](https://developer.apple.com)
  2. Complete enrollment and payment
  3. Sign in to Xcode with your Apple ID
  4. Download provisioning profiles

### Physical iPhone Requirements
- **iOS Version:** iOS 16.1 or later (Live Activities support)
  - iOS 16.1: Basic Live Activities
  - iOS 16.2+: Live Activities improvements
  - iOS 17.0+: Interactive Live Activities, StandBy mode support
- **Dynamic Island:** iPhone 14 Pro, iPhone 14 Pro Max, iPhone 15 series, or later
  - Non-Dynamic Island iPhones will show Live Activities on Lock Screen only
- **Settings verification:**
  - Settings > Face ID & Passcode > Allow Access When Locked > Live Activities: ON
  - Settings > [Your App] > Live Activities: ON (after first run)

---

## 2. Expo Development Build Setup

### Why Development Builds (Not Expo Go)

Expo Go cannot be used for this project because:
- **Native modules required:** Live Activities use ActivityKit, a native iOS framework
- **Swift code execution:** Custom Swift/SwiftUI code for Live Activity UI
- **Widget extensions:** Live Activities require an App Extension target
- **Entitlements:** Specific app capabilities must be configured

Development builds include your custom native code while maintaining Expo's developer experience.

### Creating expo-dev-client Build

1. **Install expo-dev-client:**
   ```bash
   npx expo install expo-dev-client
   ```

2. **Update app.json/app.config.js:**
   ```json
   {
     "expo": {
       "plugins": [
         "expo-dev-client",
         "./plugins/withLiveActivities"
       ],
       "ios": {
         "bundleIdentifier": "com.yourcompany.studytimer",
         "buildNumber": "1"
       }
     }
   }
   ```

### EAS Build Configuration

1. **Initialize EAS:**
   ```bash
   eas init
   ```

2. **Create/update eas.json:**
   ```json
   {
     "cli": {
       "version": ">= 5.0.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal",
         "ios": {
           "simulator": false,
           "resourceClass": "m-medium"
         }
       },
       "preview": {
         "distribution": "internal",
         "ios": {
           "simulator": false
         }
       },
       "production": {
         "ios": {
           "simulator": false
         }
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```

3. **Configure credentials:**
   ```bash
   eas credentials
   ```
   - Select iOS
   - Choose "Build Credentials"
   - Let EAS manage or provide your own

4. **Build for development:**
   ```bash
   # Build on EAS cloud
   eas build --profile development --platform ios

   # Or specify device
   eas build --profile development --platform ios --device
   ```

### Local Development Build Option

For faster iteration without cloud builds:

1. **Generate native project:**
   ```bash
   npx expo prebuild --platform ios
   ```

2. **Open in Xcode:**
   ```bash
   open ios/*.xcworkspace
   ```

3. **Configure signing in Xcode:**
   - Select the main target
   - Go to "Signing & Capabilities"
   - Select your Team
   - Ensure "Automatically manage signing" is checked
   - Repeat for the Widget Extension target

4. **Build from Xcode:**
   - Select your physical device
   - Press Cmd+R or click Play button

---

## 3. Info.plist Configuration

### Required Plist Entries for Live Activities

The following entries must be in your app's `Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- REQUIRED: Enable Live Activities -->
    <key>NSSupportsLiveActivities</key>
    <true/>

    <!-- OPTIONAL: Enable frequent updates (more than 1 per hour when app is backgrounded) -->
    <!-- Use only if needed - impacts battery life -->
    <key>NSSupportsLiveActivitiesFrequentUpdates</key>
    <true/>
</dict>
</plist>
```

### Configuring via Expo Config Plugin

Create a custom config plugin at `plugins/withLiveActivities.js`:

```javascript
const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const withLiveActivities = (config) => {
  // Add Info.plist entries
  config = withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    config.modResults.NSSupportsLiveActivitiesFrequentUpdates = true;
    return config;
  });

  // Add entitlements if needed for push-based updates
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['aps-environment'] = 'development';
    return config;
  });

  return config;
};

module.exports = withLiveActivities;
```

### Widget Extension Info.plist

The Widget Extension also needs its own `Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Study Timer</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
    <key>NSSupportsLiveActivities</key>
    <true/>
</dict>
</plist>
```

---

## 4. Swift Native Module Setup

### Directory Structure

```
ios/
├── [AppName]/
│   ├── AppDelegate.swift
│   ├── Info.plist
│   └── ...
├── [AppName]Widget/                    # Widget Extension
│   ├── [AppName]Widget.swift           # Widget entry point
│   ├── [AppName]WidgetBundle.swift     # Widget bundle
│   ├── [AppName]WidgetLiveActivity.swift # Live Activity views
│   ├── Info.plist
│   └── Assets.xcassets/
├── Modules/                            # Expo Native Modules
│   └── TimerLiveActivity/
│       ├── TimerLiveActivityModule.swift
│       ├── TimerActivityAttributes.swift
│       └── expo-module.config.json
└── [AppName].xcworkspace
```

### expo-modules-core Integration

1. **Install expo-modules-core:**
   ```bash
   npx expo install expo-modules-core
   ```

2. **Create module configuration:**

   `ios/Modules/TimerLiveActivity/expo-module.config.json`:
   ```json
   {
     "platforms": ["ios"],
     "ios": {
       "modules": ["TimerLiveActivityModule"]
     }
   }
   ```

### Module.swift File Structure

`ios/Modules/TimerLiveActivity/TimerLiveActivityModule.swift`:

```swift
import ExpoModulesCore
import ActivityKit

public class TimerLiveActivityModule: Module {
    public func definition() -> ModuleDefinition {
        Name("TimerLiveActivity")

        // Check if Live Activities are supported
        Function("areActivitiesEnabled") { () -> Bool in
            if #available(iOS 16.1, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        // Start a new Live Activity
        AsyncFunction("startActivity") { (sessionName: String, startTime: Double) -> String? in
            guard #available(iOS 16.1, *) else { return nil }

            let attributes = TimerActivityAttributes(sessionName: sessionName)
            let contentState = TimerActivityAttributes.ContentState(
                elapsedTime: 0,
                isPaused: false,
                startTime: Date(timeIntervalSince1970: startTime / 1000)
            )

            do {
                let activity = try Activity.request(
                    attributes: attributes,
                    contentState: contentState,
                    pushType: nil
                )
                return activity.id
            } catch {
                print("Error starting Live Activity: \(error)")
                return nil
            }
        }

        // Update an existing Live Activity
        AsyncFunction("updateActivity") { (activityId: String, elapsedTime: Double, isPaused: Bool) -> Bool in
            guard #available(iOS 16.1, *) else { return false }

            let contentState = TimerActivityAttributes.ContentState(
                elapsedTime: elapsedTime,
                isPaused: isPaused,
                startTime: Date()
            )

            Task {
                for activity in Activity<TimerActivityAttributes>.activities {
                    if activity.id == activityId {
                        await activity.update(using: contentState)
                        return
                    }
                }
            }
            return true
        }

        // End a Live Activity
        AsyncFunction("endActivity") { (activityId: String) -> Bool in
            guard #available(iOS 16.1, *) else { return false }

            Task {
                for activity in Activity<TimerActivityAttributes>.activities {
                    if activity.id == activityId {
                        await activity.end(dismissalPolicy: .immediate)
                        return
                    }
                }
            }
            return true
        }

        // End all Live Activities
        AsyncFunction("endAllActivities") { () -> Bool in
            guard #available(iOS 16.1, *) else { return false }

            Task {
                for activity in Activity<TimerActivityAttributes>.activities {
                    await activity.end(dismissalPolicy: .immediate)
                }
            }
            return true
        }
    }
}
```

### ActivityAttributes Definition

`ios/Modules/TimerLiveActivity/TimerActivityAttributes.swift`:

```swift
import ActivityKit
import Foundation

public struct TimerActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic state that can be updated
        var elapsedTime: TimeInterval
        var isPaused: Bool
        var startTime: Date

        // Computed property for display
        var formattedTime: String {
            let hours = Int(elapsedTime) / 3600
            let minutes = Int(elapsedTime) / 60 % 60
            let seconds = Int(elapsedTime) % 60
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        }
    }

    // Static attributes set when activity starts
    var sessionName: String
}
```

### Live Activity Views (Widget Extension)

`ios/[AppName]Widget/[AppName]WidgetLiveActivity.swift`:

```swift
import ActivityKit
import WidgetKit
import SwiftUI

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            // Lock Screen view
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    Label(context.attributes.sessionName, systemImage: "book.fill")
                        .font(.caption)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.formattedTime)
                        .font(.title2.monospacedDigit())
                        .foregroundColor(context.state.isPaused ? .orange : .green)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: min(context.state.elapsedTime / 3600, 1.0))
                        .tint(context.state.isPaused ? .orange : .green)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.isPaused ? "PAUSED" : "STUDYING")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            } compactLeading: {
                // Compact leading
                Image(systemName: context.state.isPaused ? "pause.fill" : "book.fill")
                    .foregroundColor(context.state.isPaused ? .orange : .green)
            } compactTrailing: {
                // Compact trailing
                Text(context.state.formattedTime)
                    .font(.caption.monospacedDigit())
            } minimal: {
                // Minimal view (when multiple activities)
                Image(systemName: "timer")
                    .foregroundColor(context.state.isPaused ? .orange : .green)
            }
        }
    }
}

struct LockScreenView: View {
    let context: ActivityViewContext<TimerActivityAttributes>

    var body: some View {
        HStack {
            Image(systemName: "book.fill")
                .foregroundColor(context.state.isPaused ? .orange : .green)

            VStack(alignment: .leading) {
                Text(context.attributes.sessionName)
                    .font(.headline)
                Text(context.state.isPaused ? "Paused" : "Studying")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(context.state.formattedTime)
                .font(.title.monospacedDigit())
                .foregroundColor(context.state.isPaused ? .orange : .green)
        }
        .padding()
    }
}
```

### TypeScript Interface

`src/modules/TimerLiveActivity.ts`:

```typescript
import { NativeModule, requireNativeModule } from 'expo-modules-core';

interface TimerLiveActivityModule extends NativeModule {
  areActivitiesEnabled(): boolean;
  startActivity(sessionName: string, startTime: number): Promise<string | null>;
  updateActivity(activityId: string, elapsedTime: number, isPaused: boolean): Promise<boolean>;
  endActivity(activityId: string): Promise<boolean>;
  endAllActivities(): Promise<boolean>;
}

const TimerLiveActivity = requireNativeModule<TimerLiveActivityModule>('TimerLiveActivity');

export default TimerLiveActivity;
```

---

## 5. Physical iPhone Testing Steps

### Step 1: Connect iPhone to Mac

1. Use a Lightning or USB-C cable (original Apple cable recommended)
2. Connect iPhone to Mac
3. Unlock your iPhone
4. If prompted "Trust This Computer?", tap **Trust**
5. Enter your iPhone passcode when asked

### Step 2: Verify Connection

```bash
# Check if device is recognized
xcrun xctrace list devices

# Or using ios-deploy
npm install -g ios-deploy
ios-deploy -c
```

### Step 3: Register Device UDID

1. **Get UDID:**
   - Open Finder (macOS Catalina+) or iTunes (older macOS)
   - Select your iPhone in sidebar
   - Click on device info area until UDID appears
   - Right-click and copy UDID

   Or via terminal:
   ```bash
   system_profiler SPUSBDataType | grep -A 11 "iPhone"
   ```

2. **Register with Apple Developer:**
   - Go to [developer.apple.com/account/resources/devices](https://developer.apple.com/account/resources/devices)
   - Click + to add device
   - Enter device name and UDID
   - Register

3. **Update provisioning profiles:**
   ```bash
   eas credentials
   # Select iOS > Build Credentials > Update provisioning profile
   ```

### Step 4: Build and Install

**Option A: EAS Build (Cloud)**
```bash
# Build for specific device
eas build --profile development --platform ios

# After build completes, scan QR code or install via link
```

**Option B: Local Build (Xcode)**
```bash
# Generate native project
npx expo prebuild --platform ios

# Open in Xcode
open ios/*.xcworkspace
```

In Xcode:
1. Select your iPhone from device dropdown (top left)
2. Ensure proper signing (see Section 2)
3. Click Play button or press Cmd+R
4. Wait for build and installation

### Step 5: Enable Live Activities in Settings

1. Open **Settings** on iPhone
2. Go to **Face ID & Passcode** (or Touch ID & Passcode)
3. Enter passcode
4. Scroll down to "Allow Access When Locked"
5. Enable **Live Activities**

After first app run:
1. Go to **Settings > [Your App Name]**
2. Enable **Live Activities** toggle

### Step 6: Testing the Timer in Dynamic Island

1. **Launch the app** on your iPhone
2. **Start a timer session:**
   - Enter session name (e.g., "Chapter 5 Review")
   - Tap Start button
3. **Verify Live Activity appears:**
   - Lock your phone - Live Activity should show on Lock Screen
   - With Dynamic Island device: pill should appear at top
4. **Test Dynamic Island interactions:**
   - **Compact view:** Normal state when not interacting
   - **Expanded view:** Long-press or tap the Dynamic Island
   - **Minimal view:** Start another Live Activity (if implemented)
5. **Test pause/resume:**
   - Tap Pause in app
   - Verify Dynamic Island reflects paused state (color change, icon change)
   - Tap Resume and verify update
6. **Test stop:**
   - Tap Stop in app
   - Verify Live Activity dismisses

### Testing Checklist

- [ ] Live Activity appears within 1-2 seconds of starting timer
- [ ] Time updates in real-time (every second)
- [ ] Pause state reflects correctly
- [ ] Resume state reflects correctly
- [ ] Stop properly dismisses Live Activity
- [ ] App backgrounding maintains Live Activity
- [ ] App kill ends Live Activity gracefully
- [ ] Multiple rapid start/stop doesn't create zombie activities
- [ ] Dynamic Island compact view shows correct info
- [ ] Dynamic Island expanded view shows full details
- [ ] Lock Screen view displays properly

---

## 6. Native Bridge Debugging

### Debugging Swift Code from React Native

#### Console.log from Native Side

In Swift, use `print()` statements:

```swift
public class TimerLiveActivityModule: Module {
    public func definition() -> ModuleDefinition {
        AsyncFunction("startActivity") { (sessionName: String, startTime: Double) -> String? in
            print("[TimerLiveActivity] Starting activity for: \(sessionName)")
            print("[TimerLiveActivity] Start time: \(startTime)")

            // ... rest of code

            print("[TimerLiveActivity] Activity started with ID: \(activity.id)")
            return activity.id
        }
    }
}
```

**Viewing logs:**
- **Xcode Console:** When running from Xcode, logs appear in Debug area
- **Console.app:** Open Console.app on Mac, filter by your app name
- **Terminal:** `xcrun simctl spawn booted log stream --predicate 'subsystem == "com.yourapp"'`

### Xcode Debugging Attach

1. **Build and run from Xcode** (Option B above)
2. **Set breakpoints** in Swift code:
   - Click line number gutter in Xcode
   - Red dot appears indicating breakpoint
3. **Debug:**
   - Trigger the code path from React Native
   - Xcode pauses at breakpoint
   - Inspect variables in Debug area
   - Use stepping controls (Step Over, Step Into, Continue)

**Attaching to running process:**
1. Build and install app (from EAS or local)
2. Launch app on device
3. In Xcode: Debug > Attach to Process > [Your App Name]
4. Breakpoints now work

### Debugging Widget Extension

Widget extensions run in a separate process:

1. In Xcode, select Widget Extension scheme
2. Edit Scheme > Run > Info > Launch > Ask on Launch
3. Run (Cmd+R)
4. Select "Study Timer" (main app) when prompted
5. Widget extension debugger is now attached
6. Breakpoints in widget code will work

### Logging from Widget Extension

```swift
import os.log

let logger = Logger(subsystem: "com.yourapp.widget", category: "LiveActivity")

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            let _ = logger.debug("Rendering Live Activity: \(context.state.formattedTime)")
            // ... view code
        }
    }
}
```

### Common Native Bridge Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Module not found | Module not registered | Verify `expo-module.config.json` exists and is correct |
| Method returns undefined | Async handling issue | Ensure `AsyncFunction` is used, await on JS side |
| Activity doesn't appear | Permissions/State issue | Check `areActivitiesEnabled()`, verify Settings |
| Updates not reflecting | Wrong activity ID | Store and use returned activity ID consistently |
| Crash on launch | Swift/ObjC bridging | Check for nullability issues, force unwrap problems |

---

## 7. Troubleshooting

### "Live Activities not appearing" Fixes

1. **Check system-level settings:**
   - Settings > Face ID & Passcode > Live Activities: ON

2. **Check app-level settings:**
   - Settings > [Your App] > Live Activities: ON

3. **Verify permissions in code:**
   ```typescript
   const enabled = TimerLiveActivity.areActivitiesEnabled();
   console.log('Live Activities enabled:', enabled);
   ```

4. **Check iOS version:**
   - Live Activities require iOS 16.1+
   ```swift
   if #available(iOS 16.1, *) {
       // Live Activities available
   } else {
       print("iOS 16.1+ required for Live Activities")
   }
   ```

5. **Restart device:**
   - Sometimes iOS needs a reboot to recognize new capabilities

6. **Check entitlements:**
   - Ensure both main app and widget extension have proper signing

7. **Verify widget extension is included:**
   - In Xcode: main target > Build Phases > Embed App Extensions
   - Widget extension should be listed

### "Module not found" Solutions

1. **Verify module exists:**
   ```bash
   ls ios/Modules/TimerLiveActivity/
   ```

2. **Check expo-module.config.json:**
   - File exists in module directory
   - Module name matches Swift class name

3. **Clean and rebuild:**
   ```bash
   # Clean
   cd ios && rm -rf build && pod deintegrate && pod install

   # Or full clean
   npx expo prebuild --clean --platform ios
   ```

4. **Verify pods:**
   ```bash
   cd ios && pod install
   ```

5. **Check import:**
   ```typescript
   // Correct
   import { requireNativeModule } from 'expo-modules-core';
   const Module = requireNativeModule('ModuleName');

   // Wrong
   import Module from 'module-name'; // Module doesn't exist in npm
   ```

### Signing Issues

1. **"Signing certificate not found":**
   - Open Xcode > Preferences > Accounts
   - Re-authenticate with Apple ID
   - Download certificates manually

2. **"Provisioning profile doesn't include this device":**
   - Register device UDID (see Step 3)
   - Regenerate profiles:
     ```bash
     eas credentials
     ```
   - Or in Xcode: automatically manage signing, untick and retick

3. **"Bundle identifier mismatch":**
   - Ensure `app.json` bundleIdentifier matches Xcode target
   - Widget extension must use: `{mainBundleId}.widget`

4. **Code signing errors during build:**
   ```bash
   # Reset Xcode signing
   rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*

   # Re-download in Xcode
   # Xcode > Preferences > Accounts > Download Manual Profiles
   ```

### Device Compatibility Checklist

| Feature | Minimum iOS | Minimum Device |
|---------|-------------|----------------|
| Live Activities (Lock Screen) | iOS 16.1 | iPhone 8+ |
| Dynamic Island | iOS 16.1 | iPhone 14 Pro/Pro Max, iPhone 15+ |
| Interactive Live Activities | iOS 17.0 | iPhone 8+ |
| StandBy Live Activities | iOS 17.0 | iPhone 8+ |

### Additional Troubleshooting Steps

**App crashes on Live Activity start:**
1. Check for nil/null values in ActivityAttributes
2. Verify all required fields are provided
3. Check Xcode console for crash logs

**Live Activity shows but doesn't update:**
1. Verify activity ID is stored correctly
2. Check update frequency (iOS may throttle)
3. Ensure ContentState is properly encoded
4. Verify update is called on main thread

**Widget extension not building:**
1. Check deployment target matches main app
2. Verify shared code/framework is embedded
3. Check for Swift version mismatches

**"Widget extension crashed":**
1. View crash logs: Window > Devices and Simulators > View Device Logs
2. Filter by widget extension name
3. Check for memory issues (widget extensions have limited memory)

---

## Quick Reference Commands

```bash
# Full clean build
rm -rf node_modules ios android
npm install
npx expo prebuild --clean --platform ios
cd ios && pod install && cd ..

# Open in Xcode
open ios/*.xcworkspace

# EAS build
eas build --profile development --platform ios

# Check device connection
xcrun xctrace list devices

# View iOS logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "YourAppName"'

# Reset iOS simulator
xcrun simctl erase all
```

---

## References

- [Apple ActivityKit Documentation](https://developer.apple.com/documentation/activitykit)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Human Interface Guidelines - Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)
