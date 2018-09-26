// @flow

import { RCTViewManager } from "react-native-dom";

import RCTVideo from "./RCTVideo";
import resizeModes from "./resizeModes";

import type { VideoSource } from "./types";

class RCTVideoManager extends RCTViewManager {
  static moduleName = "RCTVideoManager";

  view() {
    return new RCTVideo(this.bridge);
  }

  describeProps() {
    return super
      .describeProps()
      .addObjectProp("src", this.setSource)
      .addNumberProp("resizeMode", this.setResizeMode)
      .addBooleanProp("repeat", this.setRepeat)
      .addBooleanProp("paused", this.setPaused)
      .addBooleanProp("muted", this.setMuted);
  }

  setSource(view: RCTVideo, value: VideoSource) {
    view.source = value;
  }

  setResizeMode(view: RCTVideo, value: number) {
    view.resizeMode = value;
  }

  setRepeat(view: RCTVideo, value: boolean) {
    view.repeat = value;
  }

  setPaused(view: RCTVideo, value: boolean) {
    view.paused = value;
  }

  setMuted(view: RCTVideo, value: boolean) {
    view.muted = value;
  }

  constantsToExport() {
    return { ...resizeModes };
  }
}

export default RCTVideoManager;
