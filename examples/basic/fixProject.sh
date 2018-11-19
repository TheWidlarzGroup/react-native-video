#!/bin/bash

# This script will fix react-native module issues with glog compilations
# and will fix incorrect libfishhook library references.
# This can be removed once we will start using react-native library 
# where mentioned issues are fixed.



pushd node_modules/react-native/
./scripts/ios-install-third-party.sh
popd

pushd node_modules/react-native/third-party/glog-0.3.4
../../scripts/ios-configure-glog.sh
popd

pushd node_modules/react-native
patch -p1 -N < ../../Use-correct-library-reference-for-libfishhook-patch.diff 
popd

