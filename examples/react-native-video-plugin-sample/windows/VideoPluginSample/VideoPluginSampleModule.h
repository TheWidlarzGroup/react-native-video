// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#pragma once

#include "pch.h"
#include "NativeModules.h"

namespace winrt::VideoPluginSample::implementation
{
    REACT_MODULE(VideoPluginSampleModule);
    struct VideoPluginSampleModule
    {
        REACT_INIT(Initialize);
        void Initialize(winrt::Microsoft::ReactNative::ReactContext const& reactContext) noexcept
        {
            m_reactContext = reactContext;
        }

        REACT_METHOD(multiply);
        void multiply(int a, int b, winrt::Microsoft::ReactNative::ReactPromise<int> promise) noexcept
        {
            promise.Resolve(a * b);
        }

    private:
        winrt::Microsoft::ReactNative::ReactContext m_reactContext;
    };
}
