#include <jni.h>
#include "ReactNativeVideoOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::video::initialize(vm);
}