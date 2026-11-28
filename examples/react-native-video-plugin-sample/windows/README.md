# React Native Video Plugin Sample - Windows

This folder contains the Windows Win32 application demo for the react-native-video-plugin-sample module.

## Prerequisites

- Visual Studio 2022 (or later) with:
  - Desktop development with C++ workload
  - C++ (v143) build tools
- Windows 10 SDK (10.0.16299.0 or later)
- Node.js and npm/yarn

## Building and Running

1. Install dependencies:
   ```bash
   cd C:\work\react-native-video\examples\react-native-video-plugin-sample
   npm install
   ```

2. Restore NuGet packages:
   - Open `video-plugin-sample-demo.sln` in Visual Studio
   - Right-click on the solution and select "Restore NuGet Packages"

3. Build the solution:
   - Press F7 or select Build > Build Solution
   - Or from command line: `msbuild video-plugin-sample-demo.sln /p:Configuration=Debug /p:Platform=x64`

4. Run the application:
   - Press F5 or select Debug > Start Debugging
   - Or run the executable from: `x64\Debug\VideoPluginSampleDemo\VideoPluginSampleDemo.exe`

## Project Structure

- **VideoPluginSampleDemo**: Win32 desktop application that hosts React Native
- **VideoPluginSample**: Plugin module demonstrating react-native-video integration

## Plugin Architecture

This sample demonstrates how to integrate react-native-video in a Windows plugin architecture. The VideoPluginSample module provides a foundation for building video-related extensions and custom functionality on the Windows platform.

## Troubleshooting

- If you get build errors about missing NuGet packages, right-click on the solution and select "Restore NuGet Packages"
- Make sure all required workloads are installed in Visual Studio
- Ensure the Windows 10 SDK version matches the one specified in the project files
