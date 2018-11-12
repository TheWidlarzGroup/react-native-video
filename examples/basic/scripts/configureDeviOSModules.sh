#!/bin/bash

# This script is for development use only. It creates symbolic links 
# for libraries that are essensial for DiceShield. Makes development and 
# change management in repositories easier.
# 
# WARNING: the script assumes certain folder structure so it may require some 
# changes to work for you.

# if [ -L "node_modules/@imggaming/dice-shield" ]; then
# 	echo "[skipped] @imggaming/dice-shield is already simlinked";
# else
# 	rm -rf node_modules/@imggaming/dice-shield	
# 	ln -s ../../../../../dice-shield/ node_modules/@imggaming/dice-shield
# fi

# if [ -L "node_modules/@imggaming/dice-shield-ios" ]; then
# 	echo "[skipped] @imggaming/dice-shield-dlm is already simlinked";
# else
# 	rm -rf node_modules/@imggaming/dice-shield-ios
# 	ln -s ../../../../../dice-shield-ios/ node_modules/@imggaming/dice-shield-ios
# fi


# if [ -L "node_modules/@imggaming/dice-shield-android" ]; then
# 	echo "[skipped] @imggaming/dice-shield-android is already simlinked";
# else
# 	rm -rf node_modules/@imggaming/dice-shield-android
# 	ln -s ../../../../../dice-shield-android/ node_modules/@imggaming/dice-shield-android
# fi

if [ -L "node_modules/react-native-video/ios" ]; then
	echo "[skipped] react-native-video is already simlinked";
else
	rm -rf node_modules/react-native-video/ios/
	ln -s ../../../../../react-native-video/ios/ node_modules/react-native-video/ios
fi

