// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#pragma once

#include "pch.h"
#include "NativeModules.h"

namespace winrt::BareExample::implementation
{
    REACT_MODULE(BareExampleModule);
    struct BareExampleModule
    {
        REACT_INIT(Initialize);
        void Initialize(winrt::Microsoft::ReactNative::ReactContext const& reactContext) noexcept
        {
            m_reactContext = reactContext;
        }

        // Add a custom native methods here using REACT_METHOD macro
        // Example:
        // REACT_METHOD(CustomMethod);
        // void CustomMethod(std::string param) noexcept { ... }

    private:
        winrt::Microsoft::ReactNative::ReactContext m_reactContext;
    };
}
