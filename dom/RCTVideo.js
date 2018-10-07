// @flow

import { RCTEvent, RCTView, type RCTBridge } from "react-native-dom";

import resizeModes from "./resizeModes";
import type { VideoSource } from "./types";
import RCTVideoEvent from "./RCTVideoEvent";

class RCTVideo extends RCTView {
  playPromise: Promise<void> = Promise.resolve();
  progressTimer: number;
  videoElement: HTMLVideoElement;

  onEnd: boolean = false;
  onLoad: boolean = false;
  onLoadStart: boolean = false;
  onProgress: boolean = false;

  _paused: boolean = false;
  _progressUpdateInterval: number = 250.0;
  _savedVolume: number = 1.0;

  constructor(bridge: RCTBridge) {
    super(bridge);

    this.eventDispatcher = bridge.getModuleByName("EventDispatcher");

    this.onEnd = this.onEnd.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onLoadStart = this.onLoadStart.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.onProgress = this.onProgress.bind(this);

    this.videoElement = this.initializeVideoElement();
    this.videoElement.addEventListener("ended", this.onEnd);
    this.videoElement.addEventListener("loadeddata", this.onLoad);
    this.videoElement.addEventListener("loadstart", this.onLoadStart);
    this.videoElement.addEventListener("pause", this.onPause);
    this.videoElement.addEventListener("play", this.onPlay);

    this.muted = false;
    this.rate = 1.0;
    this.volume = 1.0;
    this.videoElement.autoplay = true;
    this.childContainer.appendChild(this.videoElement);
  }

  detachFromView(view: UIView) {
    this.videoElement.removeEventListener("ended", this.onEnd);
    this.videoElement.removeEventListener("loadeddata", this.onLoad);
    this.videoElement.removeEventListener("loadstart", this.onLoadStart);
    this.videoElement.removeEventListener("pause", this.onPause);
    this.videoElement.removeEventListener("play", this.onPlay);

    this.stopProgressTimer();
  }

  initializeVideoElement() {
    const elem = document.createElement("video");

    Object.assign(elem.style, {
      display: "block",
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%"
    });

    return elem;
  }

  presentFullscreenPlayer() {
    console.log("V PF");
    this.videoElement.webkitRequestFullScreen();
  }

  set controls(value: boolean) {
    if (value) {
      this.videoElement.controls = true;
      this.videoElement.style.pointerEvents = "auto";
    } else {
      this.videoElement.controls = false;
      this.videoElement.style.pointerEvents = "";
    }
  }

  set muted(value: boolean) {
    if (value) {
      this.videoElement.muted = true;
    } else {
      this.videoElement.muted = false;
    }
  }

  set paused(value: boolean) {
    this.playPromise.then(() => {
      if (value) {
        this.videoElement.pause();
      } else {
        this.playPromise = this.videoElement.play();
      }
    });
    this._paused = value;
  }

  set progressUpdateInterval(value: number) {
    this._progressUpdateInterval = value;
    this.stopProgressTimer();
    if (!this._paused) {
      this.startProgressTimer();
    }
  }

  set rate(value: number) {
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

  set seek(value: number) {
    this.videoElement.currentTime = value;
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
    if (value === 0) {
      this.muted = true;
    } else {
      this.videoElement.volume = value;
      this.muted = false;
    }
  }

  onEnd = () => {
    this.onProgress();
    this.sendEvent("topVideoEnd", null);
    this.stopProgressTimer();    
  }

  onLoad = () => {
    // height & width are safe with audio, will be 0
    const height = this.videoElement.videoHeight;
    const width = this.videoElement.videoWidth;
    const payload = {
      currentPosition: this.videoElement.currentTime,
      duration: this.videoElement.duration,
      naturalSize: {
        width,
        height,
        orientation: width >= height ? "landscape" : "portrait"
      }
    };
    this.sendEvent("topVideoLoad", payload);
  }

  onLoadStart = () => {
    const src = this.videoElement.currentSrc;
    const payload = {
      isNetwork: !src.match(/^https?:\/\/localhost/), // require is served from localhost
      uri: this.videoElement.currentSrc
    };
    this.sendEvent("topVideoLoadStart", payload);
  }

  onPause = () => {
    this.stopProgressTimer();
  }

  onPlay = () => {
    this.startProgressTimer();
  }

  onProgress = () => {
    const payload = {
      currentTime: this.videoElement.currentTime,
      seekableDuration: this.videoElement.duration
    };
    this.sendEvent("topVideoProgress", payload);
  }

  sendEvent(eventName, payload) {
    const event = new RCTVideoEvent(eventName, this.reactTag, 0, payload);
    this.eventDispatcher.sendEvent(event);
  }

  startProgressTimer() {
    if (!this.progressTimer && this._progressUpdateInterval) {
      this.onProgress();
      this.progressTimer = setInterval(this.onProgress, this._progressUpdateInterval);
    }
  }

  stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }
}

customElements.define("rct-video", RCTVideo);

export default RCTVideo;
