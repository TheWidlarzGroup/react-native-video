/**
 * Video resize modes that determine how video content is resized to fit the view
 *
 * - 'contain': Scale the video uniformly (maintain aspect ratio) so that it fits entirely within the view
 * - 'cover': Scale the video uniformly (maintain aspect ratio) so that it fills the entire view (may crop)
 * - 'stretch': Scale the video to fill the entire view without maintaining aspect ratio
 * - 'none': Do not resize the video - it will fallback to default behavior (contain)
 */
export type ResizeMode = 'contain' | 'cover' | 'stretch' | 'none';
