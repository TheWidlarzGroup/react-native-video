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
      .addBooleanProp("controls", this.setControls)
      .addBooleanProp("muted", this.setMuted)
      .addBooleanProp("paused", this.setPaused)
      .addBooleanProp("rate", this.setRate)
      .addBooleanProp("repeat", this.setRepeat)
      .addNumberProp("resizeMode", this.setResizeMode)
      .addObjectProp("src", this.setSource)
      .addNumberProp("volume", this.setVolume);
  }

  setControls(view: RCTVideo, value: boolean) {
    view.controls = value;
  }

  setMuted(view: RCTVideo, value: boolean) {
    view.muted = value;
  }

  setPaused(view: RCTVideo, value: boolean) {
    view.paused = value;
  }

  setRate(view: RCTVideo, value: number) {
    view.rate = value;
  }

  setRepeat(view: RCTVideo, value: boolean) {
    view.repeat = value;
  }
  
  setResizeMode(view: RCTVideo, value: number) {
    view.resizeMode = value;
  }

  setSource(view: RCTVideo, value: VideoSource) {
    view.source = value;
  }

  constantsToExport() {
    return { ...resizeModes };
  }
}

export default RCTVideoManager;
