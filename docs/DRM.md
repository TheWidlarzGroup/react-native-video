# DRM

## Provide DRM data (only tested with http/https assets)

You can provide some configuration to allow DRM playback.
This feature will disable the use of `TextureView` on Android.

DRM object allows this members:

| Property | Type | Default | Platform | Description |
| --- | --- | --- | --- | --- |
| [`type`](#type) | DRMType | undefined | iOS/Android | Specifies which type of DRM you are going to use, DRMType is an enum exposed on the JS module ('fairplay', 'playready', ...) |
| [`licenseServer`](#licenseserver) | string | undefined | iOS/Android | Specifies the license server URL |
| [`headers`](#headers) | Object | undefined | iOS/Android | Specifies the headers send to the license server URL on license acquisition |
| [`contentId`](#contentid) | string | undefined | iOS | Specify the content id of the stream, otherwise it will take the host value from `loadingRequest.request.URL.host` (f.e: `skd://testAsset` -> will take `testAsset`) |
| [`certificateUrl`](#certificateurl) | string | undefined | iOS | Specifies the url to obtain your ios certificate for fairplay, Url to the .cer file |
| [`base64Certificate`](#base64certificate) | bool | false | iOS | Specifies whether or not the certificate returned by the `certificateUrl` is on base64 |
| [`getLicense`](#getlicense)| function | undefined | iOS | Rather than setting the `licenseServer` url to get the license, you can manually get the license on the JS part, and send the result to the native part to configure FairplayDRM for the stream |

### `base64Certificate`

Whether or not the certificate url returns it on base64.

Platforms: iOS

### `certificateUrl`

URL to fetch a valid certificate for FairPlay.

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
          'pallycon-customdata-v2': 'd2VpcmRiYXNlNjRzdHJpbmcgOlAgRGFuaWVsIE1hcmnxbyB3YXMgaGVyZQ==',
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
}}
drm={{
      type: DRMType.WIDEVINE,
      licenseServer: 'https://drm-widevine-licensing.axtest.net/AcquireLicense',
      headers: {
          'X-AxDRM-Message': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjMzNjRlYjUtNTFmNi00YWUzLThjOTgtMzNjZWQ1ZTMxYzc4IiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImZpcnN0X3BsYXlfZXhwaXJhdGlvbiI6NjAsInBsYXlyZWFkeSI6eyJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImtleXMiOlt7ImlkIjoiOWViNDA1MGQtZTQ0Yi00ODAyLTkzMmUtMjdkNzUwODNlMjY2IiwiZW5jcnlwdGVkX2tleSI6ImxLM09qSExZVzI0Y3Iya3RSNzRmbnc9PSJ9XX19.FAbIiPxX8BHi9RwfzD7Yn-wugU19ghrkBFKsaCPrZmU'
      },
}}
```

### `licenseServer`

The URL pointing to the licenseServer that will provide the authorization to play the protected stream.

### `type`

You can specify the DRM type, either by string or using the exported DRMType enum.
Valid values are, for Android: DRMType.WIDEVINE / DRMType.PLAYREADY / DRMType.CLEARKEY.
for iOS: DRMType.FAIRPLAY

## Common Usage Scenarios

### Send cookies to license server

You can send Cookies to the license server via `headers` prop. Example:

```js
drm: {
    type: DRMType.WIDEVINE
    licenseServer: 'https://drm-widevine-licensing.axtest.net/AcquireLicense',
    headers: {
        'Cookie': 'PHPSESSID=etcetc; csrftoken=mytoken; _gat=1; foo=bar'
    },
}
```

### Custom License Acquisition (only iOS for now)

```js
drm: {
    type: DRMType.FAIRPLAY,
    getLicense: (spcString) => {
        const base64spc = Base64.encode(spcString);
        return fetch('YOUR LICENSE SERVER HERE', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                getFairplayLicense: {
                    foo: 'bar',
                    spcMessage: base64spc,
                }
            })
        })
            .then(response => response.json())
            .then((response) => {
                if (response && response.getFairplayLicenseResponse
                    && response.getFairplayLicenseResponse.ckcResponse) {
                    return response.getFairplayLicenseResponse.ckcResponse;
                }
                throw new Error('No correct response');
            })
            .catch((error) => {
                console.error('CKC error', error);
            });
    }
}
```
