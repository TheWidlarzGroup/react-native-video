import NewArchVideo from './NewArchVideo';
import OldArchVideo from './OldArchVideo';
export { default as FilterType } from './lib/FilterType';
export { default as VideoResizeMode } from './lib/VideoResizeMode';
export { default as TextTrackType } from './lib/TextTrackType';
export { default as DRMType } from './lib/DRMType';
export { VideoRef } from './NewArchVideo';

// @ts-expect-error nativeFabricUIManager is not yet included in the RN types
const Video = !!global?.nativeFabricUIManager ? NewArchVideo : OldArchVideo;

export default Video;
