using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media;

namespace ReactNativeVideo
{
    class ReactVideoViewManager : SimpleViewManager<ReactVideoView>
    {
        public override string Name
        {
            get
            {
                return "RCTVideo";
            }
        }

        public override IReadOnlyDictionary<string, object> ExportedViewConstants
        {
            get
            {
                return new Dictionary<string, object>
                {
                    { "ScaleNone", ((int)Stretch.None).ToString() },
                    { "ScaleToFill", ((int)Stretch.UniformToFill).ToString() },
                    { "ScaleAspectFit", ((int)Stretch.Uniform).ToString() },
                    { "ScaleAspectFill", ((int)Stretch.Fill).ToString() },
                };
            }
        }

        public override IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
        {
            get
            {
                var events = new Dictionary<string, object>();
                var eventTypes = Enum.GetValues(typeof(ReactVideoEventType)).OfType<ReactVideoEventType>();
                foreach (var eventType in eventTypes)
                {
                    events.Add(eventType.GetEventName(), new Dictionary<string, object>
                    {
                        { "registrationName", eventType.GetEventName() },
                    });
                }

                return events;
            }
        }

        [ReactProp("src")]
        public void SetSource(ReactVideoView view, JObject source)
        {
            view.Source = source.Value<string>("uri");
        }

        [ReactProp("resizeMode")]
        public void SetResizeMode(ReactVideoView view, string resizeMode)
        {
            view.Stretch = (Stretch)int.Parse(resizeMode);
        }

        [ReactProp("repeat")]
        public void SetRepeat(ReactVideoView view, bool repeat)
        {
            view.IsLoopingEnabled = repeat;
        }

        [ReactProp("paused")]
        public void SetPaused(ReactVideoView view, bool paused)
        {
            view.IsPaused = paused;
        }

        [ReactProp("muted")]
        public void SetMuted(ReactVideoView view, bool muted)
        {
            view.IsMuted = muted;
        }

        [ReactProp("volume", DefaultDouble = 1.0)]
        public void SetVolume(ReactVideoView view, double volume)
        {
            view.Volume = volume;
        }

        [ReactProp("seek")]
        public void SetSeek(ReactVideoView view, double? seek)
        {
            if (seek.HasValue)
            {
                view.Seek(seek.Value);
            }
        }

        [ReactProp("rate", DefaultDouble = 1.0)]
        public void SetPlaybackRate(ReactVideoView view, double rate)
        {
            view.Rate = rate;
        }

        [ReactProp("playInBackground")]
        public void SetPlayInBackground(ReactVideoView view, bool playInBackground)
        {
            throw new NotImplementedException("Play in background has not been implemented on Windows.");
        }

        [ReactProp("controls")]
        public void SetControls(ReactVideoView view, bool controls)
        {
            view.IsUserControlEnabled = controls;
        }

        [ReactProp("progressUpdateInterval")]
        public void SetProgressUpdateInterval(ReactVideoView view, double progressUpdateInterval)
        {
            view.ProgressUpdateInterval = progressUpdateInterval;
        }

        public override void OnDropViewInstance(ThemedReactContext reactContext, ReactVideoView view)
        {
            base.OnDropViewInstance(reactContext, view);
            view.Dispose();
        }

        protected override ReactVideoView CreateViewInstance(ThemedReactContext reactContext)
        {
            return new ReactVideoView
            {
                HorizontalAlignment = HorizontalAlignment.Stretch,
            };
        }
    }
}
