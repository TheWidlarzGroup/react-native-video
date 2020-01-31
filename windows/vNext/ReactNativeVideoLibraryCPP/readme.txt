========================================================================
Support react-native-video for React Native Windows Cpp/WinRT
========================================================================

1. Create your C++/WinRT RNW project, following instruction 
   at https://github.com/microsoft/react-native-windows/blob/master/vnext/docs/ConsumingRNW.md

2. Run "yarn add react-native-video"

3. Load your RNW solution in Visual Studio, and add the video project in following steps:
   - Right click on solution, choose "Add" -> "Existing Project" -> 
     browse to "node_modules\react-native-video\windows\vNext\ReactNativeVideoLibraryCPP" 
     and click ReactNativeVideoLibraryCPP project.

   - Right click on your main project, "Add" -> "Reference" -> choose ReactNativeVideoCpp.

   - From your main project, edit pch.h file and add following line to the end: 
     #include "winrt/ReactNativeVideoCPP.h"

   - From your main project, edit app.cpp file and add following right before
     "InitializeComponent();":
     PackageProviders().Append(winrt::ReactNativeVideoCPP::ReactPackageProvider());
 


