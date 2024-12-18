import {
  BufferConfig,
  DRMType,
  ISO639_1,
  SelectedTrackType,
  TextTrackType,
} from 'react-native-video';
import {SampleVideoSource} from '../types';
import {localeVideo} from '../assets';
import {Platform} from 'react-native';

// This constant allows to change how the sample behaves regarding to audio and texts selection.
// You can change it to change how selector will use tracks information.
// by default, index will be displayed and index will be applied to selected tracks.
// You can also use LANGUAGE or TITLE
export const textTracksSelectionBy = SelectedTrackType.INDEX;
export const audioTracksSelectionBy = SelectedTrackType.INDEX;

export const isIos = Platform.OS === 'ios';

export const isAndroid = Platform.OS === 'android';

export const srcAllPlatformList = [
  {
    description: 'local file landscape',
    uri: localeVideo.broadchurch,
  },
  {
    description: 'local file landscape cropped',
    uri: localeVideo.broadchurch,
    cropStart: 3000,
    cropEnd: 10000,
  },
  {
    description: 'video with 90° rotation',
    uri: 'https://bn-dev.fra1.digitaloceanspaces.com/km-tournament/uploads/rn_image_picker_lib_temp_2ee86a27_9312_4548_84af_7fd75d9ad4dd_ad8b20587a.mp4',
  },
  {
    description: 'local file portrait',
    uri: localeVideo.portrait,
    metadata: {
      title: 'Test Title',
      subtitle: 'Test Subtitle',
      artist: 'Test Artist',
      description: 'Test Description',
      imageUri:
        'https://pbs.twimg.com/profile_images/1498641868397191170/6qW2XkuI_400x400.png',
    },
  },
  {
    description: '(hls|live) red bull tv',
    textTracksAllowChunklessPreparation: false,
    uri: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_928.m3u8',
    metadata: {
      title: 'Custom Title',
      subtitle: 'Custom Subtitle',
      artist: 'Custom Artist',
      description: 'Custom Description',
      imageUri:
        'https://pbs.twimg.com/profile_images/1498641868397191170/6qW2XkuI_400x400.png',
    },
  },
  {
    description: 'invalid URL',
    uri: 'mmt://www.youtube.com',
    type: 'mpd',
  },
  {description: '(no url) Stopped playback', uri: undefined},
  {
    description: '(no view) no View',
    noView: true,
  },
  {
    description: 'Another live sample',
    uri: 'https://live.forstreet.cl/live/livestream.m3u8',
  },
  {
    description: 'another bunny (can be saved)',
    uri: 'https://rawgit.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4',
    headers: {referer: 'www.github.com', 'User-Agent': 'react.native.video'},
    metadata: {
      title: 'Custom Title',
      subtitle: 'Custom Subtitle',
      artist: 'Custom Artist',
      description: 'Custom Description',
      imageUri:
        'https://pbs.twimg.com/profile_images/1498641868397191170/6qW2XkuI_400x400.png',
    },
  },
  {
    description: 'sintel with subtitles',
    uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  },
  {
    description: 'sintel starts at 20sec',
    uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    startPosition: 50000,
  },
  {
    description: 'mp3 with texttrack',
    uri: 'https://traffic.libsyn.com/democracynow/wx2024-0702_SOT_DeadCalm-LucileSmith-FULL-V2.mxf-audio.mp3', // an mp3 file
    textTracks: [], // empty text track list
  },
  {
    description: 'BigBugBunny sideLoaded subtitles',
    // sideloaded subtitles wont work for streaming like HLS on ios
    // mp4
    uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
    textTracks: [
      {
        title: 'test',
        language: 'en' as ISO639_1,
        type: TextTrackType.VTT,
        uri: 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt',
      },
    ],
  },
  {
    description: '(mp4) big buck bunny With Ads',
    ad: {
      adTagUrl:
        'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpostoptimizedpodbumper&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator=',
      },
    uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  },
];

export const srcIosList: SampleVideoSource[] = [];

export const srcAndroidList: SampleVideoSource[] = [
  {
    description: 'Another live sample',
    uri: 'https://live.forstreet.cl/live/livestream.m3u8',
  },
  {
    description: 'asset file',
    uri: 'asset:///broadchurch.mp4',
  },
  {
    description: '(dash) sintel subtitles',
    uri: 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd',
  },
  {
    description: '(mp4) big buck bunny',
    uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  },
  {
    description: '(mp4|subtitles) demo with sintel Subtitles',
    uri: 'http://www.youtube.com/api/manifest/dash/id/bf5bb2419360daf1/source/youtube?as=fmp4_audio_clear,fmp4_sd_hd_clear&sparams=ip,ipbits,expire,source,id,as&ip=0.0.0.0&ipbits=0&expire=19000000000&signature=51AF5F39AB0CEC3E5497CD9C900EBFEAECCCB5C7.8506521BFC350652163895D4C26DEE124209AA9E&key=ik0',
    type: 'mpd',
  },
  {
    description: 'WV: Secure SD & HD (cbcs,MP4,H264)',
    uri: 'https://storage.googleapis.com/wvmedia/cbcs/h264/tears/tears_aes_cbcs.mpd',
    drm: {
      type: DRMType.WIDEVINE,
      licenseServer:
        'https://proxy.uat.widevine.com/proxy?provider=widevine_test',
    },
  },
  {
    description: 'Secure UHD (cenc)',
    uri: 'https://storage.googleapis.com/wvmedia/cenc/h264/tears/tears_uhd.mpd',
    drm: {
      type: DRMType.WIDEVINE,
      licenseServer:
        'https://proxy.uat.widevine.com/proxy?provider=widevine_test',
    },
  },
  {
    description: 'rtsp big bug bunny',
    uri: 'rtsp://rtspstream:3cfa3c36a9c00f4aa38f3cd35816b287@zephyr.rtsp.stream/movie',
    type: 'rtsp',
  },
];

const platformSrc: SampleVideoSource[] = isAndroid
  ? srcAndroidList
  : srcIosList;

export const srcList: SampleVideoSource[] =
  platformSrc.concat(srcAllPlatformList);

export const bufferConfig: BufferConfig = {
  minBufferMs: 15000,
  maxBufferMs: 50000,
  bufferForPlaybackMs: 2500,
  bufferForPlaybackAfterRebufferMs: 5000,
  live: {
    targetOffsetMs: 500,
  },
};
