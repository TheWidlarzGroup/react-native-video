# Examples

This directory contains examples for `react-native-video` - this is a guide that will show you what can you find here and how to use them.

## Examples Structure

- **[`bare`](#bare)** - Main example ([react-native-test-app](https://github.com/microsoft/react-native-test-app) - bare react-native app) that you can run on: iOS, Android, Windows, visionOS

- **[`expo`](#expo)** - Expo example that you can run on: iOS, Android, tvOS, web

### Updating Examples Content

Both of applications have mostly the same code (Windows and tvOS have platform-specific code). Other platform are using codebase from `bare` example.
If you want to update examples content, you should do it in `bare` example. `expo` example is copping (and overwriting!) `src` folder from `bare` on dependency install.
If you want to sync `expo` example, you can use `yarn update-src` command in `expo` example directory.

## How To Run Examples

## [Bare](https://github.com/TheWidlarzGroup/react-native-video/tree/master/examples/bare)

### Configuration

You can configure the example by changing the settings of expo-plugin `app.json` file in the `bare` directory.

> [!TIP]
> You can find more information about the expo-plugin configuration [here](https://docs.thewidlarzgroup.com/react-native-video/other/expo).

> [!CAUTION]
> You will need to regenerate the native project after changing the `app.json` file. eg. on Apple platforms you will need to install pods twice. (one for applying expo-plugin changes and second for applying react-native-video changes)

### Building

1. Install dependency in repository root directory

```bash
yarn install
```

2. Install dependency in `bare` example directory

```bash
cd examples/bare && yarn install
```

3. Now you will need to generate native project for platform you want to run the example on.

   - For iOS / visionOS:
     Install pods in `ios` / `visionOS` directory

     ```bash
     # for ios
     pod install --project-directory=ios
     # for visionOS
     pod install --project-directory=visionos
     ```

     ⚠️ You will need to hit it twice, because expo-plugin changes are not applied in the first run.

     Now you are ready to run the App. (Flag `--interactive` is optional, but it is recommended as it allows you to choose the device you want to run the app on. Select `BareExample` scheme)

     ```bash
     # for ios
     yarn ios --interactive
     # for visionOS
     yarn visionos --interactive
     ```

   - For Android:
     There is no need to run any additional command. you can just run the App. (Flag `--interactive` is optional, but it is recommended as it allows you to choose the device you want to run the app on)

     ```bash
     yarn android --interactive
     ```

   - For Windows:
     There is no need to run any additional command. you can just run the App.
     ```bash
     yarn windows
     ```

If Metro Bundler is not running (or it did not start), you can start it by running:

```bash
yarn start
```

> [!TIP]
> Make sure you've already downloaded the simulator on which you want to launch the app.

## [Expo](https://github.com/TheWidlarzGroup/react-native-video/tree/master/examples/bare)

### Configuration

#### Expo Plugin

You can configure the example by changing the settings of expo-plugin `app.json` file in the `expo` directory.

> [!TIP]
> You can find more information about the expo-plugin configuration [here](https://docs.thewidlarzgroup.com/react-native-video/other/expo).

> [!CAUTION]
> You will need to regenerate the native project after changing the `app.json` file - you can do it by running `yarn prebuild` command in `expo` example directory.

#### Switching between Mobile and TV

If you want to switch between mobile and TV version of the app you will need to regenerate the native project. You can do it by running `yarn prebuild:tv` command in `expo` example directory.

### Building

1. Install dependency in repository root directory

```bash
yarn install
```

2. Install dependency in `expo` example directory

```bash
cd examples/expo && yarn install
```

3. Now you will need to generate native project for platform you want to run the example on.
   If you want to use example on tv you should read [Switching between Mobile and TV](#switching-between-mobile-and-tv) section.

   - For iOS / tvOS:
     Install pods in `ios` directory

     ```bash
     pod install --project-directory=ios
     ```

     Now you are ready to run the App. (Flag `--device` is optional, but it is recommended as it allows you to choose the device you want to run the app on)

     ```bash
     # for ios
     yarn ios --device
     # for tvOS
     yarn ios:tv --device
     ```

   - For Android / Android TV:
     There is no need to run any additional command. you can just run the App. (Flag `--device` is optional, but it is recommended as it allows you to choose the device you want to run the app on)
     ```bash
     # for android
     yarn android --device
     # for android tv
     yarn android:tv --device
     ```

> [!WARNING]  
> Setup for android is not complete yet. Please use bare app for android testing.

    - For Web:
      ```bash
      yarn web
      ```

If Metro Bundler is not running (or it did not start), you can start it by running:

```bash
yarn start
```

## For Maintainers

### Opening React Native Video in Android Studio / Xcode

To open `react-native-video` in Android Studio / Xcode you need to open `examples/bare/android` or `examples/bare/ios` directory.
First, you need to follow the [How To Run Examples](#how-to-run-examples) guide to generate the native project. Then you can open the project in Android Studio / Xcode by running below command in `examples/bare` directory.

```bash
# for android
studio ./android
# for ios
xed ./ios
```

### Updating Examples

#### Bare

Because `bare` example is using react-native-test-app it is very easy to update it.

1. Change version of `react-native` in `package.json` file in `bare` directory.
2. Hit below command and verify if everything is working correctly - RN_VERSION should be the version you want to update to.

```bash
npx @rnx-kit/align-deps@latest --requirements react-native@RN_VERSION --write
```

That's it! Now you can commit changes and create a PR.

#### Expo

To update `expo` example you should follow this [guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough).
After updating `expo` example you will need to use prebuild (yarn expo prebuild) - if it fails you will need to add `--clean` flag to the command - this will remove manual link of `react-native-video` package so you will need to link it again.
