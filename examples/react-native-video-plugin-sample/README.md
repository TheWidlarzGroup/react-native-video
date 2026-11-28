# React Native Video Plugin Sample

This is a sample plugin/subpackage for react-native-video that demonstrates how to integrate video playback in Windows Win32 applications. It serves as a foundation for building video-related plugins and extensions.

## Project Structure

```
react-native-video-plugin-sample/
├── windows/                          # Windows platform-specific code
│   ├── VideoPluginSample/            # TurboModule DLL project
│   │   ├── VideoPluginSampleModule.h # Native module implementation
│   │   ├── ReactPackageProvider.*    # Package provider for React Native
│   │   ├── pch.h/pch.cpp             # Precompiled headers
│   │   └── VideoPluginSample.vcxproj # Visual Studio project
│   ├── VideoPluginSampleDemo/        # Win32 demo application
│   │   ├── App.cpp                   # Application entry point
│   │   ├── pch.h/pch.cpp             # Precompiled headers
│   │   └── VideoPluginSampleDemo.vcxproj
│   ├── video-plugin-sample-demo.sln  # Visual Studio solution
│   └── README.md                     # Windows-specific documentation
├── ios/                              # iOS platform code
├── android/                          # Android platform code
├── src/                              # JavaScript source
│   └── index.tsx                     # Main entry point
├── App.js                            # Demo application UI
├── index.js                          # React Native entry point
├── package.json
├── metro.config.js
├── babel.config.js
└── react-native.config.js            # React Native CLI configuration

## Features

- ✅ Windows Win32 desktop application support
- ✅ Integration with react-native-video component
- ✅ Plugin architecture for video-related extensions
- ✅ Video playback with play/pause controls

## Getting Started

### Prerequisites

- Windows 10 or later
- Visual Studio 2022 (or later) with:
  - Desktop development with C++ workload
  - Windows 10 SDK (10.0.16299.0 or later)
- Node.js 16 or later
- React Native development environment set up

### Installation

1. Navigate to this directory:
   ```bash
   cd C:\work\react-native-video\examples\react-native-video-plugin-sample
   ```

2. Install JavaScript dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Building and Running

#### Option 1: Using React Native CLI

```bash
npm run windows
```

This will:
- Build the native modules
- Start the Metro bundler
- Launch the Win32 application

#### Option 2: Using Visual Studio

1. Open `windows\video-plugin-sample-demo.sln` in Visual Studio
2. Right-click the solution and select "Restore NuGet Packages"
3. Press F7 to build or F5 to build and run
4. In a separate terminal, start Metro bundler:
   ```bash
   npx react-native start
   ```

## Usage Example

This sample demonstrates how to use react-native-video in a plugin architecture:

```javascript
import React, {useState, useRef} from 'react';
import {View, Button, StyleSheet} from 'react-native';
import Video from 'react-native-video';

const VideoPlayerExample = () => {
  const [paused, setPaused] = useState(true);
  const videoRef = useRef(null);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        }}
        style={styles.video}
        paused={paused}
        controls={false}
        resizeMode="contain"
        onLoad={(data) => console.log('Video loaded', data)}
        onProgress={(data) => console.log('Progress', data)}
        onError={(error) => console.error('Video error', error)}
      />
      
      <Button
        title={paused ? 'Play' : 'Pause'}
        onPress={() => setPaused(!paused)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: 200,
  },
});
```

For more advanced usage and props, see the [react-native-video documentation](https://github.com/react-native-video/react-native-video).

## Development

### Extending the Plugin

This sample provides a foundation for building video-related plugins. You can extend it by:

1. **Adding Custom Video Features**: Implement additional video controls, filters, or effects
2. **Platform-Specific Optimizations**: Leverage Windows-specific APIs for enhanced performance
3. **Custom Video Overlays**: Add UI elements on top of the video player
4. **Video Analytics**: Track playback metrics and user interactions

### Project Structure

Key files for plugin development:
- **App.js**: Main application UI demonstrating video integration
- **windows/**: Platform-specific Windows implementation
- **src/index.tsx**: Plugin entry point and exports
- **react-native.config.js**: React Native CLI configuration for Windows

## Project Configuration

### react-native.config.js

Defines the Windows platform configuration:
```javascript
{
  dependency: {
    platforms: {
      windows: {
        sourceDir: 'windows\\VideoPluginSample',
        solutionFile: 'VideoPluginSample.vcxproj',
        // ...
      }
    }
  }
}
```

### package.json

Includes scripts for running on Windows:
```json
{
  "scripts": {
    "windows": "react-native run-windows --root .. --proj-dir windows --arch x64"
  }
}
```

## Troubleshooting

### Build Errors

- **Missing NuGet packages**: Right-click solution → "Restore NuGet Packages"
- **SDK not found**: Install Windows 10 SDK from Visual Studio Installer
- **C++ workload missing**: Install "Desktop development with C++" from Visual Studio Installer

### Runtime Errors

- **Metro bundler not running**: Start it manually with `npx react-native start`
- **Module not found**: Ensure the package is properly linked in the main app
- **JavaScript errors**: Check the Metro bundler console for errors

## References

- [React Native Windows Documentation](https://microsoft.github.io/react-native-windows/)
- [TurboModules Documentation](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [DateTimePicker Windows PR #1025](https://github.com/react-native-datetimepicker/datetimepicker/pull/1025) - Reference implementation

## License

UNLICENSED
