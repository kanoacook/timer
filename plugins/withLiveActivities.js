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

    // Add widget extension target if it doesn't exist
    if (!xcodeProject.pbxTargetByName(WIDGET_EXTENSION_NAME)) {
      const targetUuid = xcodeProject.generateUuid();
      const groupName = WIDGET_EXTENSION_NAME;

      // Create group for widget extension files
      const widgetGroup = xcodeProject.addPbxGroup(
        ['StudyTimerWidgetBundle.swift', 'StudyTimerLiveActivity.swift', 'Info.plist'],
        groupName,
        WIDGET_EXTENSION_NAME
      );

      // Add to main group
      const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
      xcodeProject.addToPbxGroup(widgetGroup.uuid, mainGroup);

      // Create the widget extension target
      const target = xcodeProject.addTarget(
        WIDGET_EXTENSION_NAME,
        'app_extension',
        WIDGET_EXTENSION_NAME,
        widgetBundleId
      );

      // Add source files to target
      const swiftFiles = ['StudyTimerWidgetBundle.swift', 'StudyTimerLiveActivity.swift'];
      swiftFiles.forEach((file) => {
        const filePath = path.join(widgetExtensionPath, file);
        if (fs.existsSync(filePath)) {
          xcodeProject.addSourceFile(
            `${WIDGET_EXTENSION_NAME}/${file}`,
            { target: target.uuid },
            widgetGroup.uuid
          );
        }
      });

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
              // Add widget-specific build settings
              configSettings.buildSettings = configSettings.buildSettings || {};
              if (configSettings.buildSettings.PRODUCT_NAME === `"${WIDGET_EXTENSION_NAME}"`) {
                configSettings.buildSettings.SWIFT_VERSION = '5.0';
                configSettings.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
                configSettings.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.1';
                configSettings.buildSettings.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
                configSettings.buildSettings.INFOPLIST_FILE = `${WIDGET_EXTENSION_NAME}/Info.plist`;
                configSettings.buildSettings.CODE_SIGN_ENTITLEMENTS = '';
                configSettings.buildSettings.SKIP_INSTALL = 'YES';
              }
            }
          });
        }
      });

      // Copy embed extension in frameworks phase
      xcodeProject.addBuildPhase(
        [],
        'PBXCopyFilesBuildPhase',
        'Embed App Extensions',
        xcodeProject.getFirstTarget().uuid,
        'app_extension',
        ''
      );
    }

    return config;
  });

  // Copy shared StudyTimerAttributes.swift to widget extension
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      const mainAppPath = path.join(iosPath, 'StudyTimer');
      const widgetExtensionPath = path.join(iosPath, WIDGET_EXTENSION_NAME);

      const attributesSource = path.join(mainAppPath, 'StudyTimerAttributes.swift');
      const attributesDest = path.join(widgetExtensionPath, 'StudyTimerAttributes.swift');

      // Copy attributes file if it exists in main app but not in widget
      if (fs.existsSync(attributesSource) && !fs.existsSync(attributesDest)) {
        fs.copyFileSync(attributesSource, attributesDest);
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withLiveActivities;
