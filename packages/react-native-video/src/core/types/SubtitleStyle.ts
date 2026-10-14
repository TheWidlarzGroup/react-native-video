/**
 * The style of the edge drawn around each subtitle character.
 * - `none` - no edge.
 * - `outline` - a uniform outline around each character.
 * - `dropShadow` - a drop shadow behind each character.
 * - `raised` - a raised, embossed edge.
 * - `depressed` - a depressed, engraved edge.
 */
export type SubtitleEdgeType =
  | 'none'
  | 'outline'
  | 'dropShadow'
  | 'raised'
  | 'depressed';

export interface SubtitleStyle {
  /**
   * Scales the platform's default subtitle font size.
   * `1.0` keeps the default size, `1.5` renders subtitles 50% larger, `0.75`
   * renders them 25% smaller.
   * @default 1.0
   */
  fontScale?: number;
  /**
   * Color of the subtitle text itself.
   * @example '#FFFFFF' (white) or '#80FFFFFF' (50%-opaque white - alpha-first, 8-digit hex)
   */
  foregroundColor?: string;
  /**
   * Color of the box drawn directly behind the subtitle text.
   * @example '#80000000' (50%-opaque black)
   */
  backgroundColor?: string;
  /**
   * Color of the padded caption window surrounding {@link backgroundColor}'s box.
   * @platform android
   */
  windowColor?: string;
  /**
   * The style of the edge drawn around each character.
   * @default 'none'
   */
  edgeType?: SubtitleEdgeType;
  /**
   * Color of the edge drawn around each character, when {@link edgeType} is not `'none'`.
   * @platform android
   */
  edgeColor?: string;
  /**
   * Extra space to keep clear beneath the subtitle, as a fraction of the video's height
   * (`0.08` keeps the bottom 8% of the frame clear). Leaves the platform default untouched
   * when unset.
   *
   * @remarks
   * On Android this is purely additive - it reserves blank space without otherwise changing
   * how the cue is placed. On iOS there is no equivalent additive-padding primitive, so this
   * pins the cue's vertical position outright (overriding the system's own placement, including
   * its multi-line/dual-subtitle collision avoidance) rather than padding around a position it
   * still controls. Prefer leaving this unset on iOS unless you need the position pinned.
   * @default 0.08
   */
  bottomPadding?: number;
}
