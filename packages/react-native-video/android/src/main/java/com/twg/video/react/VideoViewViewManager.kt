package com.twg.video.react

import androidx.media3.common.util.UnstableApi
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.RNCVideoViewManagerDelegate
import com.facebook.react.viewmanagers.RNCVideoViewManagerInterface
import com.twg.video.view.VideoView

internal class NitroIdChange(
  surfaceId: Int,
  viewTag: Int,
  val nitroId: Int
) : Event<NitroIdChange>(surfaceId, viewTag) {
  override fun getEventName() = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap().apply {
    putInt("nitroId", nitroId)
  }

  companion object {
    const val EVENT_NAME = "topNitroIdChange"
  }
}

@UnstableApi
@ReactModule(name = VideoViewViewManager.NAME)
class VideoViewViewManager : SimpleViewManager<VideoView>(), RNCVideoViewManagerInterface<VideoView> {
  private val mDelegate: ViewManagerDelegate<VideoView>

  init {
    mDelegate = RNCVideoViewManagerDelegate(this)
  }

  @ReactProp(name = "nitroId")
  override fun setNitroId(view: VideoView, nitroId: Int) {
    view.nitroId = nitroId
  }

  public override fun createViewInstance(reactContext: ThemedReactContext): VideoView {
    return VideoView(reactContext)
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
    return MapBuilder.builder<String, Any>()
      .put(NitroIdChange.EVENT_NAME, MapBuilder.of("registrationName", "onNitroIdChange"))
      .build()
  }

  override fun getName() = NAME

  override fun getDelegate() = mDelegate

  override fun addEventEmitters(reactContext: ThemedReactContext, view: VideoView) {
    super.addEventEmitters(reactContext, view)

    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)

    if (dispatcher != null) {
      view.onNitroIdChange = {
        dispatcher.dispatchEvent(NitroIdChange(surfaceId, view.id, view.nitroId))
      }
    }
  }

  companion object {
    const val NAME = "RNCVideoView"
  }
}
