# React Native Video Plugin Sample

This is a sample plugin/subpackage for react-native-video that demonstrates how to create a TurboModule for Windows Win32 applications.

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
- ✅ TurboModule architecture
- ✅ Native C++ implementation
- ✅ Sample `multiply` function demonstrating native-to-JS bridge

## Getting Started

### Prerequisites

- Windows 10 or later
- Visual Studio 2019 or later with:
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

```javascript
import {multiply} from 'react-native-video-plugin-sample';

// Call the native multiply function
const result = await multiply(5, 7);
console.log(result); // 35
```

## Development

### Modifying the Native Module

1. Open `windows\VideoPluginSample\VideoPluginSampleModule.h`
2. Add your native methods using the REACT_METHOD macro
3. Rebuild the solution
4. Update the JavaScript interface in `src/index.tsx`

### TurboModule Architecture

This plugin uses the new TurboModule architecture which provides:
- Better type safety
- Improved performance
- Direct native-to-JS bindings
- Lazy module loading

The key components are:
- **VideoPluginSampleModule.h**: Native module with REACT_METHOD annotations
- **ReactPackageProvider**: Registers the module with React Native
- **App.cpp**: Initializes React Native and loads the JS bundle

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
