#include <jni.h>
#include "ReactNativeVideoDrmOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::videodrm::initialize(vm);
}
