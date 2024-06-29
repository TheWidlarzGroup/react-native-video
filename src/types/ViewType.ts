/**
 * Define Available view type for android
 * these values shall match android spec, see ViewType.kt
 */
enum ResizeMode {
  TEXTURE = 0,
  SURFACE = 1,
  SURFACE_SECURE = 2,
}

export default ResizeMode;
