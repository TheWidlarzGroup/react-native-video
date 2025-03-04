(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[606],{7150:function(s,e,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/component/drm",function(){return n(5495)}])},5495:function(s,e,n){"use strict";n.r(e),n.d(e,{__toc:function(){return t}});var r=n(5893),l=n(2673),i=n(2643),o=n(3410);let t=[{depth:2,value:"DRM Example",id:"drm-example"},{depth:2,value:"Provide DRM data (only tested with http/https assets)",id:"provide-drm-data-only-tested-with-httphttps-assets"},{depth:3,value:"base64Certificate",id:"base64certificate"},{depth:3,value:"certificateUrl",id:"certificateurl"},{depth:3,value:"getLicense",id:"getlicense"},{depth:3,value:"contentId",id:"contentid"},{depth:3,value:"headers",id:"headers"},{depth:3,value:"licenseServer",id:"licenseserver"},{depth:3,value:"multiDrm",id:"multidrm"},{depth:3,value:"type",id:"type"},{depth:3,value:"localSourceEncryptionKeyScheme",id:"localsourceencryptionkeyscheme"},{depth:2,value:"Common Usage Scenarios",id:"common-usage-scenarios"},{depth:3,value:"Send cookies to license server",id:"send-cookies-to-license-server"},{depth:3,value:"Custom License Acquisition (only iOS for now)",id:"custom-license-acquisition-only-ios-for-now"}];function c(s){let e=Object.assign({h1:"h1",h2:"h2",p:"p",a:"a",code:"code",h3:"h3",br:"br",ul:"ul",li:"li",pre:"pre",span:"span"},(0,i.a)(),s.components);return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(e.h1,{children:"DRM"}),"\n",(0,r.jsx)(e.h2,{id:"drm-example",children:"DRM Example"}),"\n",(0,r.jsxs)(e.p,{children:["We have available example for DRM usage in the ",(0,r.jsx)(e.a,{href:"https://github.com/TheWidlarzGroup/react-native-video/blob/master/examples/bare/src/DRMExample.tsx",children:"example app"}),".\nTo get token needed for DRM playback you can go to ",(0,r.jsx)(e.a,{href:"https://www.thewidlarzgroup.com/services/free-drm-token-generator-for-video?utm_source=rnv&utm_medium=docs&utm_campaign=drm&utm_id=text",children:"our site"})," and get it."]}),"\n",(0,r.jsx)(e.h2,{id:"provide-drm-data-only-tested-with-httphttps-assets",children:"Provide DRM data (only tested with http/https assets)"}),"\n",(0,r.jsxs)(e.p,{children:["You can provide some configuration to allow DRM playback.\nThis feature will disable the use of ",(0,r.jsx)(e.code,{children:"TextureView"})," on Android."]}),"\n",(0,r.jsx)(e.p,{children:"DRM object allows this members:"}),"\n",(0,r.jsx)(e.h3,{id:"base64certificate",children:(0,r.jsx)(e.code,{children:"base64Certificate"})}),"\n",(0,r.jsx)(o.Z,{types:["iOS","visionOS"]}),"\n",(0,r.jsxs)(e.p,{children:["Type: bool",(0,r.jsx)(e.br,{}),"\n","Default: false"]}),"\n",(0,r.jsx)(e.p,{children:"Whether or not the certificate url returns it on base64."}),"\n",(0,r.jsx)(e.h3,{id:"certificateurl",children:(0,r.jsx)(e.code,{children:"certificateUrl"})}),"\n",(0,r.jsx)(o.Z,{types:["iOS","visionOS"]}),"\n",(0,r.jsxs)(e.p,{children:["Type: string",(0,r.jsx)(e.br,{}),"\n","Default: undefined"]}),"\n",(0,r.jsx)(e.p,{children:"URL to fetch a valid certificate for FairPlay."}),"\n",(0,r.jsx)(e.h3,{id:"getlicense",children:(0,r.jsx)(e.code,{children:"getLicense"})}),"\n",(0,r.jsx)(o.Z,{types:["iOS","visionOS"]}),"\n",(0,r.jsxs)(e.p,{children:["Type: function",(0,r.jsx)(e.br,{}),"\n","Default: undefined"]}),"\n",(0,r.jsxs)(e.p,{children:["Rather than setting the ",(0,r.jsx)(e.code,{children:"licenseServer"})," url to get the license, you can manually get the license on the JS part, and send the result to the native part to configure FairplayDRM for the stream"]}),"\n",(0,r.jsxs)(e.p,{children:[(0,r.jsx)(e.code,{children:"licenseServer"})," and ",(0,r.jsx)(e.code,{children:"headers"})," will be ignored. You will obtain as argument the ",(0,r.jsx)(e.code,{children:"SPC"}),"\n(as ASCII string, you will probably need to convert it to base 64) obtained from\nyour ",(0,r.jsx)(e.code,{children:"contentId"})," + the provided certificate via ",(0,r.jsx)(e.code,{children:"objc [loadingRequest streamingContentKeyRequestDataForApp:certificateData contentIdentifier:contentIdData options:nil error:&spcError]; "})]}),"\n",(0,r.jsx)(e.p,{children:"Also, you will receive following parameter of getLicense:"}),"\n",(0,r.jsxs)(e.ul,{children:["\n",(0,r.jsxs)(e.li,{children:[(0,r.jsx)(e.code,{children:"contentId"})," contentId if passed to ",(0,r.jsx)(e.code,{children:"drm"})," object or loadingRequest.request.url?.host"]}),"\n",(0,r.jsxs)(e.li,{children:[(0,r.jsx)(e.code,{children:"loadedLicenseUrl"})," URL defined as ",(0,r.jsx)(e.code,{children:"loadingRequest.request.URL.absoluteString"}),", this url starts with ",(0,r.jsx)(e.code,{children:"skd://"})," or ",(0,r.jsx)(e.code,{children:"clearkey://"})]}),"\n",(0,r.jsxs)(e.li,{children:[(0,r.jsx)(e.code,{children:"licenseServer"})," prop if prop is passed to ",(0,r.jsx)(e.code,{children:"drm"})," object."]}),"\n",(0,r.jsxs)(e.li,{children:[(0,r.jsx)(e.code,{children:"spcString"})," the SPC used to validate playback with drm server"]}),"\n"]}),"\n",(0,r.jsxs)(e.p,{children:["You should return on this method a ",(0,r.jsx)(e.code,{children:"CKC"})," in Base64, either by just returning it or returning a ",(0,r.jsx)(e.code,{children:"Promise"})," that resolves with the ",(0,r.jsx)(e.code,{children:"CKC"}),"."]}),"\n",(0,r.jsx)(e.p,{children:"With this prop you can override the license acquisition flow, as an example:"}),"\n",(0,r.jsx)(e.pre,{"data-language":"js","data-theme":"default",children:(0,r.jsxs)(e.code,{"data-language":"js","data-theme":"default",children:[(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"getLicense"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" (spcString"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" contentId"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" licenseUrl"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" loadedLicenseUrl) "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"  "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"const"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"base64spc"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"Base64"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".encode"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"(spcString);"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"  "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"const"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"formData"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"new"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:"FormData"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"();"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"  "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"formData"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".append"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"("}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'spc'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" base64spc);"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"  "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"return"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:"fetch"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"("}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"`https://license.pallycon.com/ri/licenseManager.do`"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    method"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'POST'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    headers"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"      "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'pallycon-customdata-v2'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"        "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'d2VpcmRiYXNlNjRzdHJpbmcgOlAgRGFuaWVsIE1hcmnxbyB3YXMgaGVyZQ=='"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"      "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'Content-Type'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'application/x-www-form-urlencoded'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    }"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    body"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" formData"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"  })"})}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".then"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"((response) "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"response"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".text"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"())"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".then"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"((response) "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"      "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"return"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" response;"})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    })"})}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".catch"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"((error) "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"      "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"console"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".error"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"("}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'Error'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" error);"})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    });"})}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"};"})})]})}),"\n",(0,r.jsx)(e.h3,{id:"contentid",children:(0,r.jsx)(e.code,{children:"contentId"})}),"\n",(0,r.jsx)(o.Z,{types:["iOS","visionOS"]}),"\n",(0,r.jsxs)(e.p,{children:["Type: string",(0,r.jsx)(e.br,{}),"\n","Default: undefined"]}),"\n",(0,r.jsxs)(e.p,{children:["Specify the content id of the stream, otherwise it will take the host value from ",(0,r.jsx)(e.code,{children:"loadingRequest.request.URL.host"})," (f.e: ",(0,r.jsx)(e.code,{children:"skd://testAsset"})," -> will take ",(0,r.jsx)(e.code,{children:"testAsset"}),")"]}),"\n",(0,r.jsx)(e.h3,{id:"headers",children:(0,r.jsx)(e.code,{children:"headers"})}),"\n",(0,r.jsx)(o.Z,{types:["Android","iOS","visionOS"]}),"\n",(0,r.jsxs)(e.p,{children:["Type: Object",(0,r.jsx)(e.br,{}),"\n","Default: undefined"]}),"\n",(0,r.jsx)(e.p,{children:"You can customize headers send to the licenseServer."}),"\n",(0,r.jsx)(e.p,{children:"Example:"}),"\n",(0,r.jsx)(e.pre,{"data-language":"js","data-theme":"default",children:(0,r.jsxs)(e.code,{"data-language":"js","data-theme":"default",children:[(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"source"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"{{"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    uri"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest_1080p.mpd'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"}}"})}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"drm"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"{{"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"      type"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"DRMType"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"."}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"WIDEVINE"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"      licenseServer"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'https://drm-widevine-licensing.axtest.net/AcquireLicense'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"      headers"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"          "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'X-AxDRM-Message'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:": "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjMzNjRlYjUtNTFmNi00YWUzLThjOTgtMzNjZWQ1ZTMxYzc4IiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImZpcnN0X3BsYXlfZXhwaXJhdGlvbiI6NjAsInBsYXlyZWFkeSI6eyJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImtleXMiOlt7ImlkIjoiOWViNDA1MGQtZTQ0Yi00ODAyLTkzMmUtMjdkNzUwODNlMjY2IiwiZW5jcnlwdGVkX2tleSI6ImxLM09qSExZVzI0Y3Iya3RSNzRmbnc9PSJ9XX19.FAbIiPxX8BHi9RwfzD7Yn-wugU19ghrkBFKsaCPrZmU'"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"      }"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"}}"})})]})}),"\n",(0,r.jsx)(e.h3,{id:"licenseserver",children:(0,r.jsx)(e.code,{children:"licenseServer"})}),"\n",(0,r.jsx)(o.Z,{types:["Android","iOS","visionOS"]}),"\n",(0,r.jsxs)(e.p,{children:["Type: string",(0,r.jsx)(e.br,{}),"\n","Default: false"]}),"\n",(0,r.jsx)(e.p,{children:"The URL pointing to the licenseServer that will provide the authorization to play the protected stream."}),"\n",(0,r.jsx)(e.h3,{id:"multidrm",children:(0,r.jsx)(e.code,{children:"multiDrm"})}),"\n",(0,r.jsx)(o.Z,{types:["Android"]}),"\n",(0,r.jsxs)(e.p,{children:["Type: boolean",(0,r.jsx)(e.br,{}),"\n","Default: false"]}),"\n",(0,r.jsxs)(e.p,{children:["Indicates that drm system shall support key rotation, see: ",(0,r.jsx)(e.a,{href:"https://developer.android.google.cn/media/media3/exoplayer/drm?hl=en#key-rotation",children:"https://developer.android.google.cn/media/media3/exoplayer/drm?hl=en#key-rotation"})]}),"\n",(0,r.jsx)(e.h3,{id:"type",children:(0,r.jsx)(e.code,{children:"type"})}),"\n",(0,r.jsx)(o.Z,{types:["Android","iOS"]}),"\n",(0,r.jsxs)(e.p,{children:["Type: DRMType",(0,r.jsx)(e.br,{}),"\n","Default: undefined"]}),"\n",(0,r.jsx)(e.p,{children:"You can specify the DRM type, either by string or using the exported DRMType enum.\nValid values are, for Android: DRMType.WIDEVINE / DRMType.PLAYREADY / DRMType.CLEARKEY.\nfor iOS: DRMType.FAIRPLAY"}),"\n",(0,r.jsx)(e.h3,{id:"localsourceencryptionkeyscheme",children:(0,r.jsx)(e.code,{children:"localSourceEncryptionKeyScheme"})}),"\n",(0,r.jsx)(o.Z,{types:["iOS","visionOS"]}),"\n",(0,r.jsx)(e.p,{children:"Set the url scheme for stream encryption key for local assets"}),"\n",(0,r.jsx)(e.p,{children:"Type: String"}),"\n",(0,r.jsx)(e.p,{children:"Example:"}),"\n",(0,r.jsx)(e.pre,{"data-language":"text","data-theme":"default",children:(0,r.jsx)(e.code,{"data-language":"text","data-theme":"default",children:(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:'localSourceEncryptionKeyScheme="my-offline-key"'})})})}),"\n",(0,r.jsx)(e.h2,{id:"common-usage-scenarios",children:"Common Usage Scenarios"}),"\n",(0,r.jsx)(e.h3,{id:"send-cookies-to-license-server",children:"Send cookies to license server"}),"\n",(0,r.jsxs)(e.p,{children:["You can send Cookies to the license server via ",(0,r.jsx)(e.code,{children:"headers"})," prop. Example:"]}),"\n",(0,r.jsx)(e.pre,{"data-language":"js","data-theme":"default",children:(0,r.jsxs)(e.code,{"data-language":"js","data-theme":"default",children:[(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"drm"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    type"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"DRMType"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"."}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"WIDEVINE"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    licenseServer"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'https://drm-widevine-licensing.axtest.net/AcquireLicense'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    headers"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"        "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'Cookie'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:": "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'PHPSESSID=etcetc; csrftoken=mytoken; _gat=1; foo=bar'"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    }"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"}"})})]})}),"\n",(0,r.jsx)(e.h3,{id:"custom-license-acquisition-only-ios-for-now",children:"Custom License Acquisition (only iOS for now)"}),"\n",(0,r.jsx)(e.pre,{"data-language":"js","data-theme":"default",children:(0,r.jsxs)(e.code,{"data-language":"js","data-theme":"default",children:[(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"drm"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    type"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"DRMType"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"."}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"FAIRPLAY"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    getLicense"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" (spcString) "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"        "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"const"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"base64spc"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"Base64"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".encode"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"(spcString);"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"        "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"return"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:"fetch"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"("}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'YOUR LICENSE SERVER HERE'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            method"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'POST'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            headers"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'Content-Type'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'application/json'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                Accept"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'application/json'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            }"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            body"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"JSON"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".stringify"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"({"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                getFairplayLicense"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                    foo"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'bar'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                    spcMessage"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:":"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" base64spc"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                }"})}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            })"})}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"        })"})}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".then"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"(response "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"response"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".json"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"())"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".then"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"((response) "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"if"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" (response "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"&&"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"response"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:".getFairplayLicenseResponse"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                    "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"&&"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"response"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"."}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"getFairplayLicenseResponse"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:".ckcResponse) {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                    "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"return"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"response"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"."}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"getFairplayLicenseResponse"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:".ckcResponse;"})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                }"})}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"throw"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"new"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:"Error"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"("}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'No correct response'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:");"})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            })"})}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".catch"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"((error) "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" {"})]}),"\n",(0,r.jsxs)(e.span,{className:"line",children:[(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"                "}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-constant)"},children:"console"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-function)"},children:".error"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"("}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-string-expression)"},children:"'CKC error'"}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-token-punctuation)"},children:","}),(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:" error);"})]}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"            });"})}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"    }"})}),"\n",(0,r.jsx)(e.span,{className:"line",children:(0,r.jsx)(e.span,{style:{color:"var(--shiki-color-text)"},children:"}"})})]})})]})}e.default=(0,l.j)({MDXContent:function(){let s=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},{wrapper:e}=Object.assign({},(0,i.a)(),s.components);return e?(0,r.jsx)(e,{...s,children:(0,r.jsx)(c,{...s})}):c(s)},pageOpts:{filePath:"pages/component/drm.mdx",route:"/component/drm",timestamp:174109876e4,title:"DRM",headings:t},pageNextRoute:"/component/drm"})},3410:function(s,e,n){"use strict";var r=n(5893);n(7294);var l=n(9701),i=n.n(l);e.Z=function(s){let{types:e}=s;return(0,r.jsxs)("p",{className:i().paragraphStyle,children:[1!==e.length||e.includes("All")?"Platforms:":"Platform:",(0,r.jsx)("span",{className:i().spanStyle,children:" "+e.join(" | ")})]})}},9701:function(s){s.exports={paragraphStyle:"PlatformsList_paragraphStyle__v_l36",spanStyle:"PlatformsList_spanStyle__ISLBH"}}},function(s){s.O(0,[673,888,774,179],function(){return s(s.s=7150)}),_N_E=s.O()}]);