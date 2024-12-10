(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[901],{6734:function(e,n,s){(window.__NEXT_P=window.__NEXT_P||[]).push(["/component/ads",function(){return s(1891)}])},1891:function(e,n,s){"use strict";s.r(n),s.d(n,{__toc:function(){return t}});var a=s(5893),o=s(2673),i=s(2643);let t=[{depth:2,value:"IMA SDK",id:"ima-sdk"},{depth:3,value:"Usage",id:"usage"},{depth:3,value:"Events",id:"events"},{depth:3,value:"Localization",id:"localization"}];function l(e){let n=Object.assign({h1:"h1",h2:"h2",p:"p",code:"code",a:"a",h3:"h3",pre:"pre",span:"span",blockquote:"blockquote"},(0,i.a)(),e.components);return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.h1,{children:"Ads"}),"\n",(0,a.jsx)(n.h2,{id:"ima-sdk",children:"IMA SDK"}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.code,{children:"react-native-video"})," has built-in support for Google IMA SDK for Android and iOS. To enable it please refer to ",(0,a.jsx)(n.a,{href:"/installation",children:"installation section"})]}),"\n",(0,a.jsx)(n.h3,{id:"usage",children:"Usage"}),"\n",(0,a.jsxs)(n.p,{children:["To use AVOD, you need to pass ",(0,a.jsx)(n.code,{children:"adTagUrl"})," prop to ",(0,a.jsx)(n.code,{children:"Video"})," component. ",(0,a.jsx)(n.code,{children:"adTagUrl"})," is a VAST uri."]}),"\n",(0,a.jsx)(n.p,{children:"Example:"}),"\n",(0,a.jsx)(n.pre,{"data-language":"text","data-theme":"default",children:(0,a.jsx)(n.code,{"data-language":"text","data-theme":"default",children:(0,a.jsx)(n.span,{className:"line",children:(0,a.jsx)(n.span,{style:{color:"var(--shiki-color-text)"},children:'adTagUrl="https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpostoptimizedpodbumper&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator="'})})})}),"\n",(0,a.jsxs)(n.blockquote,{children:["\n",(0,a.jsxs)(n.p,{children:["NOTE: Video ads cannot start when you are using the PIP on iOS (more info available at ",(0,a.jsx)(n.a,{href:"https://developers.google.com/interactive-media-ads/docs/sdks/ios/client-side/picture_in_picture?hl=en#starting_ads",children:"Google IMA SDK Docs"}),"). If you are using custom controls, you must hide your PIP button when you receive the ",(0,a.jsx)(n.code,{children:"STARTED"})," event from ",(0,a.jsx)(n.code,{children:"onReceiveAdEvent"})," and show it again when you receive the ",(0,a.jsx)(n.code,{children:"ALL_ADS_COMPLETED"})," event."]}),"\n"]}),"\n",(0,a.jsx)(n.h3,{id:"events",children:"Events"}),"\n",(0,a.jsxs)(n.p,{children:["To receive events from IMA SDK, you need to pass ",(0,a.jsx)(n.code,{children:"onReceiveAdEvent"})," prop to ",(0,a.jsx)(n.code,{children:"Video"})," component. List of events, you can find ",(0,a.jsx)(n.a,{href:"https://github.com/TheWidlarzGroup/react-native-video/blob/master/src/types/Ads.ts",children:"here"})]}),"\n",(0,a.jsx)(n.p,{children:"Example:"}),"\n",(0,a.jsx)(n.pre,{"data-language":"jsx","data-theme":"default",children:(0,a.jsxs)(n.code,{"data-language":"jsx","data-theme":"default",children:[(0,a.jsx)(n.span,{className:"line",children:(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-keyword)"},children:"..."})}),"\n",(0,a.jsxs)(n.span,{className:"line",children:[(0,a.jsx)(n.span,{style:{color:"var(--shiki-color-text)"},children:"onReceiveAdEvent"}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-color-text)"},children:"{event "}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-keyword)"},children:"=>"}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-constant)"},children:"console"}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-function)"},children:".log"}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-color-text)"},children:"(event)}"})]}),"\n",(0,a.jsx)(n.span,{className:"line",children:(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-keyword)"},children:"..."})})]})}),"\n",(0,a.jsx)(n.h3,{id:"localization",children:"Localization"}),"\n",(0,a.jsxs)(n.p,{children:["To change the language of the IMA SDK, you need to pass ",(0,a.jsx)(n.code,{children:"adLanguage"})," prop to ",(0,a.jsx)(n.code,{children:"Video"})," component. List of supported languages, you can find ",(0,a.jsx)(n.a,{href:"https://developers.google.com/interactive-media-ads/docs/sdks/android/client-side/localization#locale-codes",children:"here"})]}),"\n",(0,a.jsxs)(n.p,{children:["By default, ios will use system language and android will use ",(0,a.jsx)(n.code,{children:"en"})]}),"\n",(0,a.jsx)(n.p,{children:"Example:"}),"\n",(0,a.jsx)(n.pre,{"data-language":"jsx","data-theme":"default",children:(0,a.jsxs)(n.code,{"data-language":"jsx","data-theme":"default",children:[(0,a.jsx)(n.span,{className:"line",children:(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-keyword)"},children:"..."})}),"\n",(0,a.jsxs)(n.span,{className:"line",children:[(0,a.jsx)(n.span,{style:{color:"var(--shiki-color-text)"},children:"adLanguage"}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-keyword)"},children:"="}),(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-string-expression)"},children:'"fr"'})]}),"\n",(0,a.jsx)(n.span,{className:"line",children:(0,a.jsx)(n.span,{style:{color:"var(--shiki-token-keyword)"},children:"..."})})]})})]})}n.default=(0,o.j)({MDXContent:function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},{wrapper:n}=Object.assign({},(0,i.a)(),e.components);return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(l,{...e})}):l(e)},pageOpts:{filePath:"pages/component/ads.md",route:"/component/ads",timestamp:1733856415e3,title:"Ads",headings:t},pageNextRoute:"/component/ads"})}},function(e){e.O(0,[673,888,774,179],function(){return e(e.s=6734)}),_N_E=e.O()}]);