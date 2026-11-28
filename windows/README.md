# React Native Video (Windows)

React Native Video is currently maintained for React Native Windows (RNW) >= 0.76.

## TurboModule Support

As of version 0.76+, React Native Video for Windows uses the **TurboModule architecture** for improved performance and forward compatibility with React Native's new architecture.

### Implementation Details

The Windows implementation now includes:
- **TurboModule-based native modules** using the `REACT_MODULE` macro system
- **VideoManager module** for imperative video control commands
- **Microsoft.UI.Xaml.Controls** for modern XAML MediaPlayerElement
- Codegen configuration for automatic type generation
- Modern C++/WinRT implementation with async/await support

## Project Structure

There is one implementation of `react-native-video` in this folder:

1. _ReactNativeVideoCPP_ is the currently maintained TurboModule implementation:
   1. Use _ReactNativeVideoCPP_ for RNW >= 0.76.

### Legacy Implementations (Deprecated)

For older versions of React Native Windows:
- Use _ReactNativeVideoCPP62_ for RNW 0.62.
- Use _ReactNativeVideoCPP61_ for RNW 0.61.

**Note:** Legacy implementations use the old IViewManager architecture and are no longer maintained.

# Local Development Setup (RNW >= 0.76)

In order to work on _ReactNativeVideoCPP_, you'll need to install the [Windows Development Dependencies](https://microsoft.github.io/react-native-windows/docs/rnw-dependencies).

## Development Requirements

1. Visual Studio 2022 (or later) with:
   - Universal Windows Platform development workload
   - C++ (v143) Universal Windows Platform tools
   - Windows 10/11 SDK

2. Node.js and Yarn

3. React Native Windows CLI tools

## Building the Project

1. Install dependencies:
```
yarn install
```

2. Run codegen (generates TurboModule specs):
```
npx react-native codegen-windows
```

3. Open `ReactNativeVideoCPP.sln` in Visual Studio and build the project.

## TurboModule Architecture

The Windows implementation uses React Native's TurboModule system which provides:
- **Type safety** through codegen from TypeScript specs
- **Better performance** with direct native method calls
- **Async/await support** in native code
- **Future compatibility** with React Native's new architecture

### Key Components

- `VideoManagerModule.h/cpp` - TurboModule for imperative video commands
- `ReactVideoViewManager.h/cpp` - View manager for the Video component
- `ReactVideoView.h/cpp` - Native video player view implementation using Microsoft.UI.Xaml.Controls.MediaPlayerElement

### NuGet Dependencies

- **Microsoft.UI.Xaml** (2.8.6+) - Modern XAML controls including MediaPlayerElement
- **Microsoft.Windows.CppWinRT** - C++/WinRT language projection
