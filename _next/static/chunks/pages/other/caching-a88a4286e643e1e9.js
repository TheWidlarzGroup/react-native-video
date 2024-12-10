(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[79],{6745:function(e,n,i){(window.__NEXT_P=window.__NEXT_P||[]).push(["/other/caching",function(){return i(1393)}])},1393:function(e,n,i){"use strict";i.r(n),i.d(n,{__toc:function(){return o}});var s=i(5893),t=i(2673),c=i(2643);let o=[{depth:2,value:"Android",id:"android"},{depth:2,value:"iOS",id:"ios"},{depth:3,value:"Technology",id:"technology"},{depth:3,value:"How Does It Work",id:"how-does-it-work"},{depth:3,value:"Restrictions",id:"restrictions"}];function h(e){let n=Object.assign({h1:"h1",p:"p",code:"code",h2:"h2",h3:"h3",a:"a"},(0,c.a)(),e.components);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{children:"Caching"}),"\n",(0,s.jsxs)(n.p,{children:["Caching is supported on ",(0,s.jsx)(n.code,{children:"iOS"})," platforms with a CocoaPods setup, and on ",(0,s.jsx)(n.code,{children:"android"})," using ",(0,s.jsx)(n.code,{children:"SimpleCache"}),"."]}),"\n",(0,s.jsx)(n.h2,{id:"android",children:"Android"}),"\n",(0,s.jsxs)(n.p,{children:["Android uses a LRU ",(0,s.jsx)(n.code,{children:"SimpleCache"})," with a variable cache size that can be specified by bufferConfig - cacheSizeMB. This creates a folder named ",(0,s.jsx)(n.code,{children:"RNVCache"})," in the app's ",(0,s.jsx)(n.code,{children:"cache"})," folder. Do note RNV does not yet offer a native call to flush the cache, it can be flushed by clearing the app's cache."]}),"\n",(0,s.jsx)(n.p,{children:"In addition, this resolves RNV6's repeated source URI call problem when looping a video on Android."}),"\n",(0,s.jsx)(n.h2,{id:"ios",children:"iOS"}),"\n",(0,s.jsx)(n.h3,{id:"technology",children:"Technology"}),"\n",(0,s.jsxs)(n.p,{children:["The cache is backed by ",(0,s.jsx)(n.a,{href:"https://github.com/spotify/SPTPersistentCache",children:"SPTPersistentCache"})," and ",(0,s.jsx)(n.a,{href:"https://github.com/vdugnist/DVAssetLoaderDelegate",children:"DVAssetLoaderDelegate"}),"."]}),"\n",(0,s.jsx)(n.h3,{id:"how-does-it-work",children:"How Does It Work"}),"\n",(0,s.jsxs)(n.p,{children:["The caching is based on the url of the asset.\nSPTPersistentCache is a LRU (",(0,s.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)",children:"Least Recently Used"}),") cache."]}),"\n",(0,s.jsx)(n.h3,{id:"restrictions",children:"Restrictions"}),"\n",(0,s.jsxs)(n.p,{children:["Currently, caching is only supported for URLs that end in a ",(0,s.jsx)(n.code,{children:".mp4"}),", ",(0,s.jsx)(n.code,{children:".m4v"}),", or ",(0,s.jsx)(n.code,{children:".mov"})," extension. In future versions, URLs that end in a query string (e.g. test.mp4?resolution=480p) will be support once dependencies allow access to the ",(0,s.jsx)(n.code,{children:"Content-Type"})," header. At this time, HLS playlists (.m3u8) and videos that sideload text tracks are not supported and will bypass the cache."]}),"\n",(0,s.jsxs)(n.p,{children:["You will also receive warnings in the Xcode logs by using the ",(0,s.jsx)(n.code,{children:"debug"})," mode. So if you are not 100% sure if your video is cached, check your Xcode logs!"]}),"\n",(0,s.jsx)(n.p,{children:"By default files expire after 30 days and the maximum cache size is 100mb."}),"\n",(0,s.jsx)(n.p,{children:"In a future release the cache might have more configurable options."})]})}n.default=(0,t.j)({MDXContent:function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},{wrapper:n}=Object.assign({},(0,c.a)(),e.components);return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(h,{...e})}):h(e)},pageOpts:{filePath:"pages/other/caching.md",route:"/other/caching",timestamp:1733856415e3,title:"Caching",headings:o},pageNextRoute:"/other/caching"})}},function(e){e.O(0,[673,888,774,179],function(){return e(e.s=6745)}),_N_E=e.O()}]);