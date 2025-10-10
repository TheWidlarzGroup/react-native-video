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

  throw new Error(
    'DRM is not Supported or Configured on Platform not supported'
  );
};

export type VideoType = 'hls' | 'mp4' | 'drm';

export const getVideoSource = (type: VideoType): VideoConfig => {
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
