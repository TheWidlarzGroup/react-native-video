// @flow

import { RCTView, type RCTBridge } from "react-native-dom";

import resizeModes from "./resizeModes";
import type { VideoSource } from "./types";

class RCTVideo extends RCTView {
  playPromise: Promise<void> = Promise.resolve();
  videoElement: HTMLVideoElement;

  _paused: boolean = false;

  constructor(bridge: RCTBridge) {
    super(bridge);

    this.videoElement = this.initializeVideoElement();
    this.controls = false;
    this.muted = false;
    this.rate = 1.0;
    this.volume = 1.0;
    this.childContainer.appendChild(this.videoElement);
  }

  initializeVideoElement() {
    const elem = document.createElement("video");

    Object.assign(elem.style, {
      display: "block",
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
    });

    return elem;
  }

  set controls(value: boolean) {
    if (value) {
      this.videoElement.setAttribute("controls", "true");
      this.videoElement.controls = true;
    } else {
      this.videoElement.removeAttribute("controls");
      this.videoElement.controls = false;
    }
  }

  set muted(value: boolean) {
    if (value) {
      this.videoElement.setAttribute("muted", "true");
      this.videoElement.muted = true;
    } else {
      this.videoElement.removeAttribute("muted");
      this.videoElement.muted = false;
    }
  }

  set paused(value: boolean) {
    this.playPromise.then(() => {
      if (value) {
        this.videoElement.pause();
      } else {
        this.playPromise = this.videoElement.play().catch(console.error);
      }
    });
    this._paused = value;
  }

  set rate(value: number) {
    this.videoElement.setAttribute("defaultPlaybackRate", value);
    this.videoElement.setAttribute("playbackRate", value);
    this.videoElement.defaultPlaybackRate = value; // playbackRate doesn't work on Chrome
    this.videoElement.playbackRate = value;
  }

  set repeat(value: boolean) {
    if (value) {
      this.videoElement.setAttribute("loop", "true");
    } else {
      this.videoElement.removeAttribute("loop");
    }
  }

  set resizeMode(value: number) {
    switch (value) {
      case resizeModes.ScaleNone: {
        this.videoElement.style.objectFit = "none";
        break;
      }
      case resizeModes.ScaleToFill: {
        this.videoElement.style.objectFit = "fill";
        break;
      }
      case resizeModes.ScaleAspectFit: {
        this.videoElement.style.objectFit = "contain";
        break;
      }
      case resizeModes.ScaleAspectFill: {
        this.videoElement.style.objectFit = "cover";
        break;
      }
    }
  }

  set source(value: VideoSource) {
    let uri = value.uri;

    if (uri.startsWith("blob:")) {
      let blob = this.bridge.blobManager.resolveURL(uri);
      if (blob.type === "text/xml") {
        blob = new Blob([blob], { type: "video/mp4" });
      }
      uri = URL.createObjectURL(blob);
    }

    this.videoElement.setAttribute("src", uri);
    if (!this._paused) {
      this.playPromise = this.videoElement.play();
    }
  }

  set volume(value: number) {
    this.videoElement.setAttribute("volume", value);
    if (this.value === 0) {
      this.muted = true;
    } else {
      this.muted = false;
    }
  }
}

customElements.define("rct-video", RCTVideo);

export default RCTVideo;
