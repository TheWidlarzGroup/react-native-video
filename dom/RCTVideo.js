// @flow

import { RCTEvent, RCTView, type RCTBridge } from "react-native-dom";
import shaka from "shaka-player";

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

    shaka.polyfill.installAll();

    this.onEnd = this.onEnd.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onLoadStart = this.onLoadStart.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.onProgress = this.onProgress.bind(this);

    this.videoElement = this.initializeVideoElement();
    this.videoElement.addEventListener("ended", this.onEnd);
    this.videoElement.addEventListener("loadeddata", this.onLoad);
    this.videoElement.addEventListener("canplay", this.onReadyForDisplay);
    this.videoElement.addEventListener("loadstart", this.onLoadStart);
    this.videoElement.addEventListener("pause", this.onPause);
    this.videoElement.addEventListener("play", this.onPlay);
    this.player = new shaka.Player(this.videoElement);

    this.muted = false;
    this.rate = 1.0;
    this.volume = 1.0;
    this.childContainer.appendChild(this.videoElement);
  }

  detachFromView(view: UIView) {
    this.videoElement.removeEventListener("ended", this.onEnd);
    this.videoElement.removeEventListener("loadeddata", this.onLoad);
    this.videoElement.removeEventListener("canplay", this.onReadyForDisplay);
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
    this.videoElement.webkitRequestFullScreen();
  }

  set controls(value: boolean) {
    this.videoElement.controls = value;
    this.videoElement.style.pointerEvents = value ? "auto" : "";
  }

  set id(value: string) {
    this.videoElement.id = value;
  }

  set muted(value: boolean) {
    this.videoElement.muted = true;
  }

  set paused(value: boolean) {
    if (value) {
      this.videoElement.pause();
    } else {
      this.requestPlay();
    }
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
    this.videoElement.loop = value;
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

    if (!shaka.Player.isBrowserSupported()) { // primarily iOS WebKit
      this.videoElement.setAttribute("src", uri);
      if (!this._paused) {
        this.requestPlay();
      }
    } else {
      this.player.load(uri)
        .then(() => {
          if (!this._paused) {
            this.requestPlay();
          }
        })
        .catch(this.onError);
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

  onError = error => {
    console.warn("topVideoError", error);
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

  onReadyForDisplay = () => {
    this.sendEvent("onReadyForDisplay");
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

  onRejectedAutoplay = () => {
    this.sendEvent("topVideoRejectedAutoplay", null);
  }

  requestPlay() {
    const playPromise = this.videoElement.play();
    if (playPromise) {
      playPromise
        .then(() => {})
        .catch(e => {
          /* This is likely one of:
           * name: NotAllowedError - autoplay is not supported
           * name: NotSupportedError - format is not supported
           */
          this.onError({ code: e.name, message: e.message });
        });
    }
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
