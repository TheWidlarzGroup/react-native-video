# DRM

## Provide DRM data (only tested with http/https assets)

You can provide some configuration to allow DRM playback.
This feature will disable the use of `TextureView` on Android.

DRM object allows this members:

| Property | Type | Platform | Description |
| --- | --- | --- | --- |
| [`type`](#type) | DRMType | iOS/Android | Specifies which type of DRM you are going to use, DRMType is an enum exposed on the JS module ('fairplay', 'playready', ...) |
| [`licenseServer`](#licenseserver) | string | iOS/Android | Specifies the license server URL |
| [`headers`](#headers) | Object | iOS/Android | Specifies the headers send to the license server URL on license acquisition |
| [`contentId`](#contentid) | string | iOS | Specify the content id of the stream, otherwise it will take the host value from `loadingRequest.request.URL.host` (f.e: `skd://testAsset` -> will take `testAsset`) |
| [`certificateUrl`](#certificateurl) | string | iOS | Specifies the url to obtain your ios certificate for fairplay, Url to the .cer file |
| [`base64Certificate`](#base64certificate) | bool | iOS | Specifies whether or not the certificate returned by the `certificateUrl` is on base64 |
| [`getLicense`](#getlicense)| function | iOS | Rather than setting the `licenseServer` url to get the license, you can manually get the license on the JS part, and send the result to the native part to configure FairplayDRM for the stream |

### `base64Certificate`

Whether or not the certificate url returns it on base64.

Platforms: iOS

### `certificateUrl`

URL to fetch a valid certificatefor FairPlay.

Platforms: iOS

### `getLicense`

`licenseServer` and `headers` will be ignored. You will obtain as argument the `SPC` (as ASCII string, you will probably need to convert it to base 64) obtained from your `contentId` + the provided certificate via `[loadingRequest streamingContentKeyRequestDataForApp:certificateData contentIdentifier:contentIdData options:nil error:&spcError];`.
  You should return on this method a `CKC` in Base64, either by just returning it or returning a `Promise` that resolves with the `CKC`.

With this prop you can override the license acquisition flow, as an example:

```js
getLicense: (spcString) => {
  const base64spc = Base64.encode(spcString);
  const formData = new FormData();
  formData.append('spc', base64spc);
  return fetch(`https://license.pallycon.com/ri/licenseManager.do`, {
      method: 'POST',
      headers: {
          'pallycon-customdata-v2': 'eyJkcm1fdHlwZSI6IkZhaXJQbGF5Iiwic2l0ZV9pZCI6IkJMMkciLCJ1c2VyX2lkIjoiMTIxMjc5IiwiY2lkIjoiYXNzZXRfMTQ5OTAiLCJ0b2tlbiI6IjBkQVVLSEQ4bm5pTStJeDJ2Y09HVStzSWRWY2wvSEdxSjdEanNZK1laazZKdlhLczRPM3BVNitVVnV3dkNvLzRyc2lIUi9PSnY4RDJncHBBN0cycnRGdy9pVFMvTWNZaVhML2VLOXdMMXFVM05VbXlFL25RdVV3Tm5mOXI2YlArUjUvRDZxOU5vZmZtTGUybmo4VGphQ3UwUUFQZlVqVzRFREE4eDNUYlI5cXZOa0pKVHdmNTA5NE5UYXY5VzJxbFp0MmczcDNMcUV0RkNMK0N5dFBZSWJEN2ZBUmR1ZzkvVTdiMXB1Y3pndTBqRjg3QnlMU0tac0J3TUpYd2xSZkxTTTZJSzRlWHMvNC9RWU4rVXhnR3ozVTgxODl4aHhWS0RJaDdBcGFkQVllVUZUMWJIVVZBSVVRQms0cjRIQ28yczIydWJvVnVLaVNQazdvYmtJckVNQT09IiwidGltZXN0YW1wIjoiMjAxOS0wMi0xMlQwNjoxODo0MloiLCJoYXNoIjoiMThqcDBDVTdOaUJ3WFdYVC8zR2lFN3R0YXVRWlZ5SjVSMUhSK2J2Um9JWT0ifQ==',
          'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
  }).then(response => response.text()).then((response) => {
      return response;
  }).catch((error) => {
      console.error('Error', error);
  });
}
```

Platforms: iOS

### `headers`

You can customize headers send to the licenseServer.

Example:

```js
source={{
    uri: 'https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest_1080p.mpd',
    drm: {
        type: 'widevine', //or DRMType.WIDEVINE
        licenseServer: 'https://drm-widevine-licensing.axtest.net/AcquireLicense',
        headers: {
            'X-AxDRM-Message': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjMzNjRlYjUtNTFmNi00YWUzLThjOTgtMzNjZWQ1ZTMxYzc4IiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImZpcnN0X3BsYXlfZXhwaXJhdGlvbiI6NjAsInBsYXlyZWFkeSI6eyJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImtleXMiOlt7ImlkIjoiOWViNDA1MGQtZTQ0Yi00ODAyLTkzMmUtMjdkNzUwODNlMjY2IiwiZW5jcnlwdGVkX2tleSI6ImxLM09qSExZVzI0Y3Iya3RSNzRmbnc9PSJ9XX19.FAbIiPxX8BHi9RwfzD7Yn-wugU19ghrkBFKsaCPrZmU'
        },
    }
}}
```

### `licenseServer`

The URL pointing to the licenseServer that will provide the authorization to play the protected stream.

### `type`

You can specify the DRM type, either by string or using the exported DRMType enum.
Valid values are, for Android: DRMType.WIDEVINE / DRMType.PLAYREADY / DRMType.CLEARKEY.
for iOS: DRMType.FAIRPLAY