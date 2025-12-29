# React Native Video Plugin Sample - Windows

This folder contains the Windows Win32 application demo for the react-native-video-plugin-sample module.

## Prerequisites

- Visual Studio 2019 or later with C++ desktop development workload
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
- **VideoPluginSample**: TurboModule DLL that implements the native module functionality

## TurboModule Implementation

The VideoPluginSample module demonstrates a simple TurboModule with a `multiply` method that multiplies two numbers. This serves as a template for implementing more complex native functionality.

## Troubleshooting

- If you get build errors about missing NuGet packages, right-click on the solution and select "Restore NuGet Packages"
- Make sure all required workloads are installed in Visual Studio
- Ensure the Windows 10 SDK version matches the one specified in the project files
