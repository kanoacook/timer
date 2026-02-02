const { withInfoPlist, withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_EXTENSION_NAME = 'StudyTimerWidgetExtension';
const WIDGET_BUNDLE_ID_SUFFIX = '.widget';

const withLiveActivities = (config) => {
  // Add NSSupportsLiveActivities to Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });

  // Copy StudyTimerAttributes.swift to main app
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      const mainAppPath = path.join(iosPath, 'StudyTimer');
      const moduleAttributesPath = path.join(projectRoot, 'modules/live-activity/ios/StudyTimerAttributes.swift');
      const mainAppAttributesPath = path.join(mainAppPath, 'StudyTimerAttributes.swift');

      // Ensure main app directory exists
      if (!fs.existsSync(mainAppPath)) {
        fs.mkdirSync(mainAppPath, { recursive: true });
      }

      // Copy attributes file from module to main app
      if (fs.existsSync(moduleAttributesPath) && !fs.existsSync(mainAppAttributesPath)) {
        fs.copyFileSync(moduleAttributesPath, mainAppAttributesPath);
        console.log('Copied StudyTimerAttributes.swift to main app');
      }

      return config;
    },
  ]);

  // Add widget extension to Xcode project
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosPath = path.join(projectRoot, 'ios');
    const widgetExtensionPath = path.join(iosPath, WIDGET_EXTENSION_NAME);

    // Check if widget extension files exist
    if (!fs.existsSync(widgetExtensionPath)) {
      console.warn(`Widget extension path not found: ${widgetExtensionPath}`);
      return config;
    }

    const bundleId = config.ios?.bundleIdentifier || 'com.kanoa.studytimer';
    const widgetBundleId = bundleId + WIDGET_BUNDLE_ID_SUFFIX;

    // Check if widget extension target already exists
    let existingTarget = xcodeProject.pbxTargetByName(WIDGET_EXTENSION_NAME);
    let target;
    let widgetGroup;

    if (existingTarget) {
      console.log(`Widget extension target already exists, will add missing files`);
      target = existingTarget;

      // Find existing group
      const groupSection = xcodeProject.hash.project.objects['PBXGroup'];
      for (const key of Object.keys(groupSection)) {
        const group = groupSection[key];
        if (group && group.name === WIDGET_EXTENSION_NAME && group.path === WIDGET_EXTENSION_NAME) {
          widgetGroup = { uuid: key };
          break;
        }
      }
    } else {
      // Create the widget extension target
      target = xcodeProject.addTarget(
        WIDGET_EXTENSION_NAME,
        'app_extension',
        WIDGET_EXTENSION_NAME,
        widgetBundleId
      );

      // Create a PBXGroup for the widget extension
      widgetGroup = xcodeProject.addPbxGroup(
        [],
        WIDGET_EXTENSION_NAME,
        WIDGET_EXTENSION_NAME
      );

      // Add group to main project group
      const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
      xcodeProject.addToPbxGroup(widgetGroup.uuid, mainGroup);

      // Add widget extension as dependency of main app
      xcodeProject.addTargetDependency(
        xcodeProject.getFirstTarget().uuid,
        [target.uuid]
      );

      // Set build settings for widget extension
      const buildConfigurationList = xcodeProject.pbxXCConfigurationList();
      Object.keys(buildConfigurationList).forEach((key) => {
        const buildConfig = buildConfigurationList[key];
        if (buildConfig.buildConfigurations) {
          buildConfig.buildConfigurations.forEach((configRef) => {
            const configSettings = xcodeProject.pbxXCBuildConfigurationSection()[configRef.value];
            if (configSettings && configSettings.name) {
              configSettings.buildSettings = configSettings.buildSettings || {};
              if (configSettings.buildSettings.PRODUCT_NAME === `"${WIDGET_EXTENSION_NAME}"`) {
                configSettings.buildSettings.SWIFT_VERSION = '5.0';
                configSettings.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
                configSettings.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.1';
                configSettings.buildSettings.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
                configSettings.buildSettings.INFOPLIST_FILE = `${WIDGET_EXTENSION_NAME}/Info.plist`;
                configSettings.buildSettings.SKIP_INSTALL = 'YES';
                configSettings.buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
              }
            }
          });
        }
      });

      // Add Embed App Extensions build phase to main app
      const mainTarget = xcodeProject.getFirstTarget();
      xcodeProject.addBuildPhase(
        [],
        'PBXCopyFilesBuildPhase',
        'Embed App Extensions',
        mainTarget.uuid,
        'app_extension',
        ''
      );
    }

    // Get the target's native target object to find its build phases
    const nativeTargets = xcodeProject.pbxNativeTargetSection();
    let sourcesBuildPhaseUuid = null;

    for (const key of Object.keys(nativeTargets)) {
      const nativeTarget = nativeTargets[key];
      if (nativeTarget && nativeTarget.name === WIDGET_EXTENSION_NAME) {
        // Find the Sources build phase
        if (nativeTarget.buildPhases) {
          const sourcesPhaseSection = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
          for (const phase of nativeTarget.buildPhases) {
            if (sourcesPhaseSection && sourcesPhaseSection[phase.value]) {
              sourcesBuildPhaseUuid = phase.value;
              break;
            }
          }
        }
        break;
      }
    }

    // Check which files are already in the Sources build phase
    const existingFiles = new Set();
    if (sourcesBuildPhaseUuid) {
      const buildPhaseSection = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
      const sourcesPhase = buildPhaseSection[sourcesBuildPhaseUuid];
      if (sourcesPhase && sourcesPhase.files) {
        for (const fileEntry of sourcesPhase.files) {
          const buildFile = xcodeProject.hash.project.objects['PBXBuildFile'][fileEntry.value];
          if (buildFile && buildFile.fileRef) {
            const fileRef = xcodeProject.hash.project.objects['PBXFileReference'][buildFile.fileRef];
            if (fileRef && fileRef.name) {
              existingFiles.add(fileRef.name);
            }
          }
        }
      }
    }

    // Add Swift files to the widget extension
    const swiftFiles = [
      'StudyTimerWidgetBundle.swift',
      'StudyTimerLiveActivity.swift',
      'StudyTimerAttributes.swift'
    ];

    swiftFiles.forEach((fileName) => {
      // Skip if file already added
      if (existingFiles.has(fileName)) {
        console.log(`File ${fileName} already in Sources, skipping`);
        return;
      }

      const filePath = path.join(widgetExtensionPath, fileName);
      if (fs.existsSync(filePath)) {
        // Create file reference
        const fileRefUuid = xcodeProject.generateUuid();
        const fileRef = {
          isa: 'PBXFileReference',
          lastKnownFileType: 'sourcecode.swift',
          name: fileName,
          path: fileName,
          sourceTree: '"<group>"'
        };
        xcodeProject.hash.project.objects['PBXFileReference'][fileRefUuid] = fileRef;
        xcodeProject.hash.project.objects['PBXFileReference'][`${fileRefUuid}_comment`] = fileName;

        // Add to widget group
        if (widgetGroup) {
          const groupSection = xcodeProject.hash.project.objects['PBXGroup'];
          if (groupSection[widgetGroup.uuid] && groupSection[widgetGroup.uuid].children) {
            // Check if already in group
            const alreadyInGroup = groupSection[widgetGroup.uuid].children.some(
              child => child.comment === fileName
            );
            if (!alreadyInGroup) {
              groupSection[widgetGroup.uuid].children.push({
                value: fileRefUuid,
                comment: fileName
              });
            }
          }
        }

        // Create build file for Sources phase
        if (sourcesBuildPhaseUuid) {
          const buildFileUuid = xcodeProject.generateUuid();
          xcodeProject.hash.project.objects['PBXBuildFile'][buildFileUuid] = {
            isa: 'PBXBuildFile',
            fileRef: fileRefUuid,
            fileRef_comment: fileName
          };
          xcodeProject.hash.project.objects['PBXBuildFile'][`${buildFileUuid}_comment`] = `${fileName} in Sources`;

          // Add to Sources build phase
          const buildPhaseSection = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
          if (buildPhaseSection[sourcesBuildPhaseUuid] && buildPhaseSection[sourcesBuildPhaseUuid].files) {
            buildPhaseSection[sourcesBuildPhaseUuid].files.push({
              value: buildFileUuid,
              comment: `${fileName} in Sources`
            });
          }
        }
        console.log(`Added ${fileName} to widget extension`);
      }
    });

    // Add Info.plist to the group (but not to Sources)
    const infoPlistPath = path.join(widgetExtensionPath, 'Info.plist');
    if (fs.existsSync(infoPlistPath) && widgetGroup) {
      const groupSection = xcodeProject.hash.project.objects['PBXGroup'];
      const alreadyHasInfoPlist = groupSection[widgetGroup.uuid]?.children?.some(
        child => child.comment === 'Info.plist'
      );

      if (!alreadyHasInfoPlist) {
        const plistRefUuid = xcodeProject.generateUuid();
        xcodeProject.hash.project.objects['PBXFileReference'][plistRefUuid] = {
          isa: 'PBXFileReference',
          lastKnownFileType: 'text.plist.xml',
          name: 'Info.plist',
          path: 'Info.plist',
          sourceTree: '"<group>"'
        };
        xcodeProject.hash.project.objects['PBXFileReference'][`${plistRefUuid}_comment`] = 'Info.plist';

        if (groupSection[widgetGroup.uuid] && groupSection[widgetGroup.uuid].children) {
          groupSection[widgetGroup.uuid].children.push({
            value: plistRefUuid,
            comment: 'Info.plist'
          });
        }
      }
    }

    return config;
  });

  // Create widget extension files
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      const widgetExtensionPath = path.join(iosPath, WIDGET_EXTENSION_NAME);

      // Ensure widget extension directory exists
      if (!fs.existsSync(widgetExtensionPath)) {
        fs.mkdirSync(widgetExtensionPath, { recursive: true });
      }

      // Create Info.plist
      const infoPlistPath = path.join(widgetExtensionPath, 'Info.plist');
      if (!fs.existsSync(infoPlistPath)) {
        const bundleId = config.ios?.bundleIdentifier || 'com.kanoa.studytimer';
        const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Study Timer Widget</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}.widget</string>
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
</dict>
</plist>`;
        fs.writeFileSync(infoPlistPath, infoPlistContent);
        console.log('Created Info.plist for widget extension');
      }

      // Create StudyTimerAttributes.swift
      const attributesPath = path.join(widgetExtensionPath, 'StudyTimerAttributes.swift');
      if (!fs.existsSync(attributesPath)) {
        // Try to copy from modules first
        const moduleAttributesPath = path.join(projectRoot, 'modules/live-activity/ios/StudyTimerAttributes.swift');
        if (fs.existsSync(moduleAttributesPath)) {
          fs.copyFileSync(moduleAttributesPath, attributesPath);
        } else {
          const attributesContent = `import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct StudyTimerAttributes: ActivityAttributes {
    let sessionId: String
    let title: String

    struct ContentState: Codable, Hashable {
        var startDate: Date
        var accumulatedSeconds: Int
        var isPaused: Bool

        var timerInterval: ClosedRange<Date> {
            let adjustedStart = startDate.addingTimeInterval(-Double(accumulatedSeconds))
            return adjustedStart...Date.distantFuture
        }
    }
}
`;
          fs.writeFileSync(attributesPath, attributesContent);
        }
        console.log('Created StudyTimerAttributes.swift for widget extension');
      }

      // Create StudyTimerWidgetBundle.swift
      const bundlePath = path.join(widgetExtensionPath, 'StudyTimerWidgetBundle.swift');
      if (!fs.existsSync(bundlePath)) {
        const bundleContent = `import SwiftUI
import WidgetKit

@main
struct StudyTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.1, *) {
            StudyTimerLiveActivity()
        }
    }
}
`;
        fs.writeFileSync(bundlePath, bundleContent);
        console.log('Created StudyTimerWidgetBundle.swift for widget extension');
      }

      // Create StudyTimerLiveActivity.swift
      const liveActivityPath = path.join(widgetExtensionPath, 'StudyTimerLiveActivity.swift');
      if (!fs.existsSync(liveActivityPath)) {
        const liveActivityContent = `import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct StudyTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StudyTimerAttributes.self) { context in
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.attributes.title)
                            .font(.headline)
                            .lineLimit(1)
                        Text(context.state.isPaused ? "Paused" : "Studying")
                            .font(.caption)
                            .foregroundColor(context.state.isPaused ? .orange : .green)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 4) {
                        if context.state.isPaused {
                            Text(formatTime(context.state.accumulatedSeconds))
                                .font(.system(.title, design: .monospaced))
                                .fontWeight(.bold)
                        } else {
                            Text(timerInterval: context.state.timerInterval, countsDown: false)
                                .font(.system(.title, design: .monospaced))
                                .fontWeight(.bold)
                                .monospacedDigit()
                        }
                    }
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
                Image(systemName: context.state.isPaused ? "pause.circle.fill" : "book.fill")
                    .foregroundColor(context.state.isPaused ? .orange : .green)
            } compactTrailing: {
                if context.state.isPaused {
                    Text(formatTime(context.state.accumulatedSeconds))
                        .font(.system(.caption, design: .monospaced))
                        .monospacedDigit()
                } else {
                    Text(timerInterval: context.state.timerInterval, countsDown: false)
                        .font(.system(.caption, design: .monospaced))
                        .monospacedDigit()
                }
            } minimal: {
                Image(systemName: "book.fill")
                    .foregroundColor(context.state.isPaused ? .orange : .green)
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
}

@available(iOS 16.1, *)
struct LockScreenView: View {
    let context: ActivityViewContext<StudyTimerAttributes>

    var body: some View {
        HStack(spacing: 12) {
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
            Spacer(minLength: 0)
            if context.state.isPaused {
                Text(formatTime(context.state.accumulatedSeconds))
                    .font(.system(size: 32, weight: .medium, design: .rounded))
                    .monospacedDigit()
            } else {
                Text(timerInterval: context.state.timerInterval, countsDown: false)
                    .font(.system(size: 32, weight: .medium, design: .rounded))
                    .monospacedDigit()
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .activityBackgroundTint(Color.black.opacity(0.85))
        .widgetURL(URL(string: "studytimer://open"))
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
}
`;
        fs.writeFileSync(liveActivityPath, liveActivityContent);
        console.log('Created StudyTimerLiveActivity.swift for widget extension');
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withLiveActivities;
