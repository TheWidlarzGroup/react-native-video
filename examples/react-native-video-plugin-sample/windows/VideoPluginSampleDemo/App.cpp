// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "pch.h"

#include <winrt/VideoPluginSample.h>

using namespace winrt;
using namespace Windows::Foundation;
using namespace Microsoft::ReactNative;

int __cdecl wmain(int argc, wchar_t** argv, wchar_t** /* envp */)
{
    UNREFERENCED_PARAMETER(argc);
    UNREFERENCED_PARAMETER(argv);

    winrt::init_apartment(winrt::apartment_type::single_threaded);

    auto host = ReactNativeHost();

    // PackageProviders for external modules
    host.PackageProviders().Append(winrt::make<ReactPackageProvider>());
    host.PackageProviders().Append(winrt::VideoPluginSample::ReactPackageProvider());

    // Initialize instance settings
    host.InstanceSettings().UseWebDebugger(false);
    host.InstanceSettings().UseFastRefresh(false);
    host.InstanceSettings().UseDeveloperSupport(false);

#if BUNDLE
    host.InstanceSettings().JavaScriptBundleFile(L"index.windows");
    host.InstanceSettings().UseDeveloperSupport(false);
#else
    host.InstanceSettings().JavaScriptBundleFile(L"index");
    host.InstanceSettings().JavaScriptMainModuleName(L"index");
    host.InstanceSettings().UseDeveloperSupport(true);
#endif

    host.InstanceSettings().JSIEngineOverride(JSIEngine::Hermes);

    // Create the react instance and load the javascript bundle
    host.LoadInstance();

    // We're not exiting until the window is closed, so make sure the reactor instance doesn't shutdown
    MSG msg = {};
    while (GetMessage(&msg, nullptr, 0, 0))
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return static_cast<int>(msg.wParam);
}
