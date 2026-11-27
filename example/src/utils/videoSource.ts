import { Platform } from 'react-native';
import type { VideoConfig } from 'react-native-video';
import {
  enable as enableDRMPlugin,
  disable as disableDRMPlugin,
  isEnabled as isDRMPluginEnabled,
} from '@react-native-video/drm';

const getDRMSource = (): VideoConfig => {
  const HLS =
    'https://d2e67eijd6imrw.cloudfront.net/559c7a7e-960d-4cd8-9dba-bc4e59890177/assets/47cfca69-91b5-4311-bf6c-b9b1f297ed9b/videokit-720p-dash-hls-drm/hls/index.m3u8';
  const DASH =
    'https://d2e67eijd6imrw.cloudfront.net/559c7a7e-960d-4cd8-9dba-bc4e59890177/assets/47cfca69-91b5-4311-bf6c-b9b1f297ed9b/videokit-720p-dash-hls-drm/dash/index.mpd';
  const CERT =
    'https://thewidlarzgroup.la.drm.cloud/certificate/fairplay?brandGuid=559c7a7e-960d-4cd8-9dba-bc4e59890177';
  const FAIRPLAY_LICENSE =
    'https://thewidlarzgroup.la.drm.cloud/acquire-license/fairplay?brandGuid=559c7a7e-960d-4cd8-9dba-bc4e59890177';
  const WIDEVINE_LICENSE =
    'https://thewidlarzgroup.la.drm.cloud/acquire-license/widevine?brandGuid=559c7a7e-960d-4cd8-9dba-bc4e59890177';
  const USER_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTU3NzQzMTQsImtpZCI6WyIqIl0sImR1cmF0aW9uIjo4NjQwMCwicGVyc2lzdGVudCI6dHJ1ZSwid2lkZXZpbmUiOnsibGljZW5zZV9kdXJhdGlvbiI6OTk5OTk5OSwicGxheWJhY2tfZHVyYXRpb24iOjk5OTk5OTksInJlbnRpYWxfZHVyYXRpb24iOjk5OTk5OTl9LCJmYWlycGxheSI6eyJzdG9yYWdlX2R1cmF0aW9uIjo5OTk5OTk5LCJwbGF5YmFja19kdXJhdGlvbiI6OTk5OTk5OX19.Gm5caVyq_pSTJIy8mZ-vrCeATKueRATmubirh-ajqVg';

  if (Platform.OS === 'ios') {
    return {
      uri: HLS,
      drm: {
        type: 'fairplay',
        licenseUrl: FAIRPLAY_LICENSE,
        certificateUrl: CERT,
        getLicense: async ({ spc, keyUrl }) => {
          const formData = new FormData();
          formData.append('spc', spc);

          const fixedLicenseUrl = keyUrl.replace('skd://', 'https://');

          try {
            const response = await fetch(
              `${fixedLicenseUrl}&userToken=${USER_TOKEN}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'multipart/form-data',
                  'Accept': 'application/json',
                },
                body: formData,
              }
            );

            const responseData = await response.json();
            return responseData.ckc;
          } catch (error) {
            console.error('Error fetching license:', error);
            throw error;
          }
        },
      },
    } as VideoConfig;
  }

  if (Platform.OS === 'android') {
    return {
      uri: DASH,
      headers: {
        'x-drm-userToken': USER_TOKEN,
      },
      drm: {
        type: 'widevine',
        licenseUrl: WIDEVINE_LICENSE,
      },
    } as VideoConfig;
  }

  throw new Error('DRM is not supported on this platform');
};

const ADS_HOST = 'https://pubads.g.doubleclick.net/gampad/ads';
const SINGLE_AD = `${ADS_HOST}?iu=/21775744923/external/single_ad_samples&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=`;
// cmsid/vid make Google's sample server place the mid-roll cue point (at 15 s).
const VMAP_AD = `${ADS_HOST}?iu=/21775744923/external/vmap_ad_samples&sz=640x480&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator=`;

export type AdTag = { id: string; label: string; url: string };

/** Google's public IMA sample tags (https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/tags). */
export const AD_TAGS: AdTag[] = [
  {
    id: 'linear',
    label: 'Pre-roll (single)',
    url: `${SINGLE_AD}&cust_params=sample_ct%3Dlinear`,
  },
  {
    id: 'skippable',
    label: 'Skippable',
    url: `${SINGLE_AD}&cust_params=sample_ct%3Dskippablelinear`,
  },
  {
    id: 'vmap-pre',
    label: 'VMAP pre-roll',
    url: `${VMAP_AD}&cust_params=sample_ar%3Dpreonly`,
  },
  {
    id: 'vmap-post',
    label: 'VMAP post-roll',
    url: `${VMAP_AD}&cust_params=sample_ar%3Dpostonly`,
  },
  {
    id: 'vmap-pre-mid-post',
    label: 'VMAP pre + mid + post',
    url: `${VMAP_AD}&cust_params=sample_ar%3Dpremidpost`,
  },
  {
    id: 'vmap-pod',
    label: 'VMAP pre + mid pod + post',
    url: `${VMAP_AD}&cust_params=sample_ar%3Dpremidpostpod`,
  },
];

export type VideoType = 'hls' | 'mp4' | 'drm';

/**
 * `adTagUrl` is only passed when an ad format is picked in the Ads panel: the app opens
 * (and the Video Type buttons switch) without any ad session, so every ad test starts
 * from a plain source instead of from a pre-armed one.
 */
export const getVideoSource = (
  type: VideoType,
  adTagUrl?: string
): VideoConfig => {
  if (type === 'drm') {
    if (!isDRMPluginEnabled) {
      enableDRMPlugin();
    }
    return getDRMSource();
  }

  if (isDRMPluginEnabled) {
    disableDRMPlugin();
  }

  const HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const MP4 =
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_30MB.mp4';
  return {
    uri: type === 'hls' ? HLS : MP4,
    // autoActivate is left at its default (false): the Ads panel calls
    // activateAds()/deactivateAds() explicitly so its buttons have something to show.
    ...(adTagUrl ? { ads: { adTagUrl } } : {}),
    externalSubtitles: [
      {
        label: 'External',
        uri: 'https://gist.githubusercontent.com/samdutton/ca37f3adaf4e23679957b8083e061177/raw/e19399fbccbc069a2af4266e5120ae6bad62699a/sample.vtt',
        language: 'en',
        type: 'vtt',
      },
    ],
    metadata: {
      title: 'Big Buck Bunny',
      artist: 'Blender Foundation',
      imageUri:
        'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
      subtitle: 'By the Blender Institute',
      description:
        'Big Buck Bunny is a short computer-animated comedy film by the Blender Institute, part of the Blender Foundation. It was made using Blender, a free and open-source 3D creation suite.',
    },
  } as VideoConfig;
};
