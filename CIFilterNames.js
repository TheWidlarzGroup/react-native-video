/**
 * See detailed Core Image filter list at: https://developer.apple.com/library/archive/documentation/GraphicsImaging/Reference/CoreImageFilterReference/index.html#//apple_ref/doc/filter/ci/CIPhotoEffectInstant
 */
const validCIFilterNames = [
  /** Applies a preconfigured set of effects that imitate vintage photography film with distorted colors. */
  'CIPhotoEffectInstant',
  /** Applies a preconfigured set of effects that imitate vintage photography film with emphasized warm colors. */
  'CIPhotoEffectTransfer',
  /** Applies a preconfigured set of effects that imitate black-and-white photography film without significantly altering contrast. */
  'CIPhotoEffectTonal',
  /** Applies a preconfigured set of effects that imitate vintage photography film with emphasized cool colors. */
  'CIPhotoEffectProcess',
  /** Applies a preconfigured set of effects that imitate black-and-white photography film with exaggerated contrast. */
  'CIPhotoEffectNoir',
  /** Applies a preconfigured set of effects that imitate black-and-white photography film with low contrast. */
  'CIPhotoEffectMono',
  /** Applies a preconfigured set of effects that imitate vintage photography film with exaggerated color. */
  'CIPhotoEffectChrome',
  /** Applies a preconfigured set of effects that imitate vintage photography film with diminished color. */
  'CIPhotoEffectFade',
  /** Maps the colors of an image to various shades of brown. */
  'CISepiaTone',
  /** Inverts the colors in an image. */
  'CIColorInvert',
  /** Simulates a comic book drawing by outlining edges and applying a color halftone effect. */
  'CIComicEffect',
];

export { validCIFilterNames };
