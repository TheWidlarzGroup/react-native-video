using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;

namespace ReactNativeVideo
{
    public class ReactVideoPackage : IReactPackage
    {
        public IReadOnlyList<Type> CreateJavaScriptModulesConfig()
        {
            return Array.Empty<Type>();
        }

        public IReadOnlyList<INativeModule> CreateNativeModules(ReactContext reactContext)
        {
            return Array.Empty<INativeModule>();

        }

        public IReadOnlyList<IViewManager> CreateViewManagers(ReactContext reactContext)
        {
            return new List<IViewManager>
            {
                new ReactVideoViewManager(),
            };
        }
    }
}
