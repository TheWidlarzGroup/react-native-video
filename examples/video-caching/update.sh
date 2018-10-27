rm -rf node_modules
yarn
cd ios
rm -rf Pods/* Podfile.lock
pod install
