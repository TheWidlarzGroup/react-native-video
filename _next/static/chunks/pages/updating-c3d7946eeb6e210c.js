(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[884],{5236:function(e,s,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/updating",function(){return n(86)}])},86:function(e,s,n){"use strict";n.r(s),n.d(s,{__toc:function(){return r}});var i=n(5893),l=n(2673),o=n(2643);let r=[{depth:3,value:"Version 6.0.0",id:"version-600"},{depth:4,value:"iOS",id:"ios"},{depth:5,value:"Min iOS version",id:"min-ios-version"},{depth:5,value:"linking",id:"linking"},{depth:5,value:"podspec",id:"podspec"},{depth:4,value:"Android",id:"android"},{depth:5,value:"Using app build settings",id:"using-app-build-settings"}];function a(e){let s=Object.assign({h1:"h1",h3:"h3",h4:"h4",h5:"h5",p:"p",code:"code",pre:"pre",span:"span",a:"a",strong:"strong"},(0,o.a)(),e.components);return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(s.h1,{children:"Updating"}),"\n",(0,i.jsx)(s.h3,{id:"version-600",children:"Version 6.0.0"}),"\n",(0,i.jsx)(s.h4,{id:"ios",children:"iOS"}),"\n",(0,i.jsx)(s.h5,{id:"min-ios-version",children:"Min iOS version"}),"\n",(0,i.jsxs)(s.p,{children:["From version 6.0.0, the minimum iOS version supported is 13.0. Projects that are using ",(0,i.jsx)(s.code,{children:"react-native < 0.73"})," will need to set the minimum iOS version to 13.0 in the Podfile."]}),"\n",(0,i.jsx)(s.p,{children:"You can do it by adding the following code to your Podfile:"}),"\n",(0,i.jsx)(s.pre,{"data-language":"diff","data-theme":"default",children:(0,i.jsxs)(s.code,{"data-language":"diff","data-theme":"default",children:[(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#EF6270"},children:"- platform :ios, min_ios_version_supported"})}),"\n",(0,i.jsx)(s.span,{className:"line",children:" "}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#4BB74A"},children:"+ MIN_IOS_OVERRIDE = '13.0'"})}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#4BB74A"},children:"+ if Gem::Version.new(MIN_IOS_OVERRIDE) > Gem::Version.new(min_ios_version_supported)"})}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#4BB74A"},children:"+   min_ios_version_supported = MIN_IOS_OVERRIDE"})}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#4BB74A"},children:"+ end"})})]})}),"\n",(0,i.jsx)(s.h5,{id:"linking",children:"linking"}),"\n",(0,i.jsx)(s.p,{children:"In your project Podfile add support for static dependency linking. This is required to support the new Promises subdependency in the iOS swift conversion."}),"\n",(0,i.jsxs)(s.p,{children:["Add ",(0,i.jsx)(s.code,{children:"use_frameworks! :linkage => :static"})," just under ",(0,i.jsx)(s.code,{children:"platform :ios"})," in your ios project Podfile."]}),"\n",(0,i.jsx)(s.p,{children:(0,i.jsx)(s.a,{href:"https://github.com/TheWidlarzGroup/react-native-video/blob/master/examples/basic/ios/Podfile#L5",children:"See the example ios project for reference"})}),"\n",(0,i.jsx)(s.h5,{id:"podspec",children:"podspec"}),"\n",(0,i.jsx)(s.p,{children:"You can remove following lines from your podfile as they are not necessary anymore"}),"\n",(0,i.jsx)(s.pre,{"data-language":"diff","data-theme":"default",children:(0,i.jsxs)(s.code,{"data-language":"diff","data-theme":"default",children:[(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#EF6270"},children:"-  `pod 'react-native-video', :path => '../node_modules/react-native-video/react-native-video.podspec'`"})}),"\n",(0,i.jsx)(s.span,{className:"line",children:" "}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#EF6270"},children:"-  `pod 'react-native-video/VideoCaching', :path => '../node_modules/react-native-video/react-native-video.podspec'`"})})]})}),"\n",(0,i.jsxs)(s.p,{children:["If you were previously using VideoCaching, you should $RNVideoUseVideoCaching flag in your podspec, see: ",(0,i.jsx)(s.a,{href:"https://docs.thewidlarzgroup.com/react-native-video/installation#video-caching",children:"installation section"})]}),"\n",(0,i.jsx)(s.h4,{id:"android",children:"Android"}),"\n",(0,i.jsxs)(s.p,{children:["If you are already using Exoplayer on V5, you should remove the patch done from ",(0,i.jsx)(s.strong,{children:"android/settings.gradle"})]}),"\n",(0,i.jsx)(s.pre,{"data-language":"diff","data-theme":"default",children:(0,i.jsxs)(s.code,{"data-language":"diff","data-theme":"default",children:[(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#EF6270"},children:"- include ':react-native-video'"})}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"#EF6270"},children:"- project(':react-native-video').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-video/android-exoplayer')"})})]})}),"\n",(0,i.jsx)(s.h5,{id:"using-app-build-settings",children:"Using app build settings"}),"\n",(0,i.jsxs)(s.p,{children:["You will need to create a ",(0,i.jsx)(s.code,{children:"project.ext"})," section in the top-level build.gradle file (not app/build.gradle). Fill in the values from the example below using the values found in your app/build.gradle file."]}),"\n",(0,i.jsx)(s.pre,{"data-language":"groovy","data-theme":"default",children:(0,i.jsxs)(s.code,{"data-language":"groovy","data-theme":"default",children:[(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-comment)"},children:"// Top-level build file where you can add configuration options common to all sub-projects/modules."})}),"\n",(0,i.jsx)(s.span,{className:"line",children:" "}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"buildscript {"})}),"\n",(0,i.jsxs)(s.span,{className:"line",children:[(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"    "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-keyword)"},children:".."}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:". "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-comment)"},children:"// Various other settings go here"})]}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"}"})}),"\n",(0,i.jsx)(s.span,{className:"line",children:" "}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"allprojects {"})}),"\n",(0,i.jsxs)(s.span,{className:"line",children:[(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"    "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-keyword)"},children:".."}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:". "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-comment)"},children:"// Various other settings go here"})]}),"\n",(0,i.jsx)(s.span,{className:"line",children:" "}),"\n",(0,i.jsxs)(s.span,{className:"line",children:[(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"    project"}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-keyword)"},children:"."}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"ext {"})]}),"\n",(0,i.jsxs)(s.span,{className:"line",children:[(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"        compileSdkVersion "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-constant)"},children:"31"})]}),"\n",(0,i.jsxs)(s.span,{className:"line",children:[(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"        buildToolsVersion "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-string-expression)"},children:'"30.0.2"'})]}),"\n",(0,i.jsx)(s.span,{className:"line",children:" "}),"\n",(0,i.jsxs)(s.span,{className:"line",children:[(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"        minSdkVersion "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-constant)"},children:"21"})]}),"\n",(0,i.jsxs)(s.span,{className:"line",children:[(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"        targetSdkVersion "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,i.jsx)(s.span,{style:{color:"var(--shiki-token-constant)"},children:"22"})]}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"    }"})}),"\n",(0,i.jsx)(s.span,{className:"line",children:(0,i.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:"}"})})]})}),"\n",(0,i.jsxs)(s.p,{children:["If you encounter an error ",(0,i.jsx)(s.code,{children:"Could not find com.android.support:support-annotations:27.0.0."})," reinstall your Android Support Repository."]})]})}s.default=(0,l.j)({MDXContent:function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},{wrapper:s}=Object.assign({},(0,o.a)(),e.components);return s?(0,i.jsx)(s,{...e,children:(0,i.jsx)(a,{...e})}):a(e)},pageOpts:{filePath:"pages/updating.md",route:"/updating",timestamp:1733856415e3,title:"Updating",headings:r},pageNextRoute:"/updating"})}},function(e){e.O(0,[673,888,774,179],function(){return e(e.s=5236)}),_N_E=e.O()}]);