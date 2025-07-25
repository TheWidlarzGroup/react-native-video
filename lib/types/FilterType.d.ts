declare enum FilterType {
    NONE = "",
    INVERT = "CIColorInvert",
    MONOCHROME = "CIColorMonochrome",
    POSTERIZE = "CIColorPosterize",
    FALSE = "CIFalseColor",
    MAXIMUMCOMPONENT = "CIMaximumComponent",
    MINIMUMCOMPONENT = "CIMinimumComponent",
    CHROME = "CIPhotoEffectChrome",
    FADE = "CIPhotoEffectFade",
    INSTANT = "CIPhotoEffectInstant",
    MONO = "CIPhotoEffectMono",
    NOIR = "CIPhotoEffectNoir",
    PROCESS = "CIPhotoEffectProcess",
    TONAL = "CIPhotoEffectTonal",
    TRANSFER = "CIPhotoEffectTransfer",
    SEPIA = "CISepiaTone"
}
export default FilterType;
