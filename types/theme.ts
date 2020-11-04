
export interface IVideoPlayerTheme {
  colors: IVideoPlayerThemeObject,
  fonts: IVideoPlayerThemeObject
}


interface IVideoPlayerThemeObject {
  primary?: string;
  secondary?: string;
}