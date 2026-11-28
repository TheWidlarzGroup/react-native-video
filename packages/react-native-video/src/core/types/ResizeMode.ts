/**
 * Video resize modes that determine how video content is resized to fit the view
 *
 * - 'contain': Scale the video uniformly (maintain aspect ratio) so that it fits entirely within the view
 * - 'cover': Scale the video uniformly (maintain aspect ratio) so that it fills the entire view (may crop)
 * - 'stretch': Scale the video to fill the entire view without maintaining aspect ratio
 * - 'none': Do not resize the video - it will fallback to default behavior (contain)
 */
export type VideoResizeMode = 'contain' | 'cover' | 'stretch' | 'none';

/**
 * Public name of {@link VideoResizeMode}.
 *
 * The Nitro spec uses `VideoResizeMode`, so that the generated native headers are not called
 * `ResizeMode.hpp`: another Nitro library in the same app that generates a header with that name
 * (for example react-native-nitro-image) breaks the iOS build.
 */
export type ResizeMode = VideoResizeMode;
