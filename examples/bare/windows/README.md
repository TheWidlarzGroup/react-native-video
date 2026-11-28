# Bare Example - Windows (UWP)

This folder contains the Windows UWP (Universal Windows Platform) application for the bare example of react-native-video.

## Prerequisites

- Visual Studio 2022 (or later) with:
  - Universal Windows Platform development workload
  - C++ (v143) Universal Windows Platform tools
- Windows 10 SDK (10.0.16299.0 or later)
- Node.js and npm/yarn

## Building and Running

1. Install dependencies from the repository root:
   ```bash
   cd /path/to/react-native-video
   yarn install
   ```

2. Install dependencies in the bare example:
   ```bash
   cd examples/bare
   yarn install
   ```

3. Restore NuGet packages:
   - Open `BareExample.sln` in Visual Studio
   - Right-click on the solution and select "Restore NuGet Packages"

4. Build the solution:
   - Press F7 or select Build > Build Solution
   - Or from command line: `msbuild BareExample.sln /p:Configuration=Debug /p:Platform=x64`

5. Run the application:
   - Press F5 or select Debug > Start Debugging
   - Or use the command: `yarn windows`

## Running with Metro Bundler

1. Start Metro bundler from the bare example directory:
   ```bash
   cd examples/bare
   yarn start
   ```

2. Run the Windows application:
   ```bash
   yarn windows
   ```

## Project Structure

- `BareExample.sln` - Visual Studio solution file
- `BareExampleApp/` - UWP application project (entry point)
- `BareExample/` - Native module library project

## Troubleshooting

### NuGet Package Errors
If one encounters NuGet package errors, try:
1. Close Visual Studio
2. Delete the `packages` folder
3. Reopen the solution and restore packages

### Build Errors
Make sure to have the correct Windows SDK version installed and that your Visual Studio installation includes the C++ desktop development workload.
