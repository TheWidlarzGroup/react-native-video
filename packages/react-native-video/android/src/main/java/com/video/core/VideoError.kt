package com.video.core

// Base class for all video errors
abstract class VideoError(
    open val code: String,
    message: String
) : Error("{%@$code::$message@%}")

// Library related errors
sealed class LibraryError(code: String, message: String) : VideoError(code, message) {
    data object Deallocated : LibraryError(
        "library/deallocated",
        "Object has been deallocated"
    )

    data object ApplicationContextNotFound : LibraryError(
        "library/application-context-not-found",
        "Application context not found"
    )
}

// Player related errors
sealed class PlayerError(code: String, message: String) : VideoError(code, message) {
    data object NotInitialized : PlayerError(
        "player/not-initialized",
        "Player has not been initialized (Or has been set to null)"
    )

    data object AssetNotInitialized : PlayerError(
        "player/asset-not-initialized",
        "Asset has not been initialized (Or has been set to null)"
    )

    data object InvalidSource : PlayerError(
        "player/invalid-source",
        "Invalid source passed to player"
    )
}

// Source related errors
sealed class SourceError(code: String, message: String) : VideoError(code, message) {
    class InvalidUri(val uri: String) : SourceError(
        "source/invalid-uri",
        "Invalid source file uri: $uri"
    )

    class MissingReadFilePermission(val uri: String) : SourceError(
        "source/missing-read-file-permission",
        "Missing read file permission for source file at $uri"
    )

    class FileDoesNotExist(val uri: String) : SourceError(
        "source/file-does-not-exist",
        "File does not exist at URI: $uri"
    )

    object FailedToInitializeAsset : SourceError(
        "source/failed-to-initialize-asset",
        "Failed to initialize asset"
    )
}

// View related errors
sealed class VideoViewError(code: String, message: String) : VideoError(code, message) {
    class ViewNotFound(val viewId: Int) : VideoViewError(
        "view/not-found",
        "View with viewId $viewId not found"
    )
}
