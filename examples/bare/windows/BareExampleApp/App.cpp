// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "pch.h"
#include "App.xaml.g.h"

#include "NativeModules.h"
#include <winrt/BareExample.h>

using namespace winrt;
using namespace Windows::ApplicationModel;
using namespace Windows::ApplicationModel::Activation;
using namespace Windows::Foundation;
using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Controls;
using namespace Windows::UI::Xaml::Navigation;
using namespace Microsoft::ReactNative;

namespace winrt::BareExampleApp::implementation
{
    // A PackageProvider containing any turbo modules that is defined within this app project
    struct CompReactPackageProvider
        : winrt::implements<CompReactPackageProvider, IReactPackageProvider> {
        void CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept {
            // For UWP, we don't use AddPackageProvider - packages are added directly to PackageProviders collection
        }
    };

    struct App : AppT<App>
    {
        App()
        {
#if BUNDLE
            JavaScriptBundleFile(L"index.windows");
            InstanceSettings().UseFastRefresh(false);
#else
            JavaScriptBundleFile(L"index");
            InstanceSettings().UseFastRefresh(true);
#endif

#if _DEBUG
            InstanceSettings().UseDirectDebugger(true);
            InstanceSettings().UseDeveloperSupport(true);
#else
            InstanceSettings().UseDirectDebugger(false);
            InstanceSettings().UseDeveloperSupport(false);
#endif

            // Register package providers
            PackageProviders().Append(winrt::make<CompReactPackageProvider>());
            PackageProviders().Append(winrt::BareExample::ReactPackageProvider());

            InitializeComponent();
        }

        void OnLaunched(LaunchActivatedEventArgs const& e)
        {
            super::OnLaunched(e);
            auto frame = Window::Current().Content().try_as<Frame>();
            if (frame == nullptr)
            {
                frame = Frame();
                Interop::TypeName typeName;
                typeName.Name = L"Microsoft.ReactNative.ReactPage";
                typeName.Kind = Interop::TypeKind::Metadata;
                frame.Navigate(typeName, box_value(L"BareExample"));
                Window::Current().Content(frame);
            }

            Window::Current().Activate();
        }

        void OnSuspending([[maybe_unused]] IInspectable const&, [[maybe_unused]] SuspendingEventArgs const& e)
        {
            // Save application state
        }

    private:
        using super = AppT<App>;
    };
}

int __stdcall wWinMain(HINSTANCE, HINSTANCE, PWSTR, int)
{
    Application::Start([](auto &&) { winrt::make<winrt::BareExampleApp::implementation::App>(); });
    return 0;
}
