using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using System;
using Windows.ApplicationModel.Core;
using Windows.Media.Core;
using Windows.Media.Playback;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNativeVideo
{
    class ReactVideoView : MediaPlayerElement, IDisposable
    {
        public const string EVENT_PROP_SEEK_TIME = "seekTime";

        private readonly DispatcherTimer _timer;

        private bool _isSourceSet;

        private string _uri;
        private bool _isLoopingEnabled;
        private bool _isPaused;
        private bool _isMuted;
        private bool _isUserControlEnabled;
        private bool _isCompleted;
        private double _volume;
        private double _rate;

        public ReactVideoView()
        {
            _timer = new DispatcherTimer();
            _timer.Interval = TimeSpan.FromMilliseconds(250.0);
            _timer.Start();
        }

        public new string Source
        {
            set
            {
                _uri = value;
                base.Source = MediaSource.CreateFromUri(new Uri(_uri));
                _isSourceSet = true;
                ApplyModifiers();
                SubscribeEvents();
            }
        }

        public bool IsLoopingEnabled
        {
            set
            {
                _isLoopingEnabled = value;
                if (_isSourceSet)
                {
                    MediaPlayer.IsLoopingEnabled = _isLoopingEnabled;
                }
            }
        }

        public bool IsMuted
        {
            set
            {
                _isMuted = value;
                if (_isSourceSet)
                {
                    MediaPlayer.IsMuted = _isMuted;
                }
            }
        }

        public bool IsPaused
        {
            set
            {
                _isPaused = value;
                if (_isSourceSet)
                {
                    if (_isPaused)
                    {
                        MediaPlayer.Pause();
                    }
                    else
                    {
                        MediaPlayer.Play();
                    }
                }
            }
        }

        public bool IsUserControlEnabled
        {
            set
            {
                _isUserControlEnabled = value;
               if (_isSourceSet)
                {
                    MediaPlayer.SystemMediaTransportControls.IsEnabled = _isUserControlEnabled;
                }
            }
        }

        public double Volume
        {
            set
            {
                _volume = value;
                if (_isSourceSet)
                {
                    MediaPlayer.Volume = _volume;
                }
            }
        }

        public double Rate
        {
            set
            {
                _rate = value;
                if (_isSourceSet)
                {
                    MediaPlayer.PlaybackSession.PlaybackRate = _rate;
                }
            }
        }

        public double ProgressUpdateInterval
        {
            set
            {
                _timer.Interval = TimeSpan.FromSeconds(value);
            }
        }

        public void Seek(double seek)
        {
            if (_isSourceSet)
            {
                MediaPlayer.PlaybackSession.Position = TimeSpan.FromSeconds(seek);
            }
        }

        public void Dispose()
        {
            if (_isSourceSet)
            {
                _timer.Tick -= OnTick;
                MediaPlayer.SourceChanged -= OnSourceChanged;
                MediaPlayer.MediaOpened -= OnMediaOpened;
                MediaPlayer.MediaFailed -= OnMediaFailed;
                MediaPlayer.MediaEnded -= OnMediaEnded;
                MediaPlayer.PlaybackSession.BufferingStarted -= OnBufferingStarted;
                MediaPlayer.PlaybackSession.BufferingEnded -= OnBufferingEnded;
                MediaPlayer.PlaybackSession.SeekCompleted -= OnSeekCompleted;
            }

            _timer.Stop();
        }

        private void ApplyModifiers()
        {
            IsLoopingEnabled = _isLoopingEnabled;
            IsMuted = _isMuted;
            IsPaused = _isPaused;
            IsUserControlEnabled = _isUserControlEnabled;
            Volume = _volume;
            Rate = _rate;
        }

        private void SubscribeEvents()
        {
            _timer.Tick += OnTick;
            MediaPlayer.SourceChanged += OnSourceChanged;
            MediaPlayer.MediaOpened += OnMediaOpened;
            MediaPlayer.MediaFailed += OnMediaFailed;
            MediaPlayer.MediaEnded += OnMediaEnded;
            MediaPlayer.PlaybackSession.BufferingStarted += OnBufferingStarted;
            MediaPlayer.PlaybackSession.BufferingEnded += OnBufferingEnded;
            MediaPlayer.PlaybackSession.SeekCompleted += OnSeekCompleted;
        }

        private void OnTick(object sender, object e)
        {
            if (_isSourceSet && !_isCompleted && !_isPaused)
            {
                this.GetReactContext()
                    .GetNativeModule<UIManagerModule>()
                    .EventDispatcher
                    .DispatchEvent(
                        new ReactVideoEvent(
                            ReactVideoEventType.Progress.GetEventName(), 
                            this.GetTag(),
                            new JObject
                            {
                                { "currentTime",  MediaPlayer.PlaybackSession.Position.TotalSeconds },
                                { "playableDuration", 0.0 /* TODO */ }
                            }));
            }
        }

        private void OnSourceChanged(MediaPlayer sender, object args)
        {
            this.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactVideoEvent(
                        ReactVideoEventType.LoadStart.GetEventName(),
                        this.GetTag(),
                        new JObject
                        {
                            { "src", this._uri }
                        }));
        }

        private void OnMediaOpened(MediaPlayer sender, object args)
        {
            RunOnDispatcher(delegate
            {
                var width = MediaPlayer.PlaybackSession.NaturalVideoWidth;
                var height = MediaPlayer.PlaybackSession.NaturalVideoHeight;
                var orientation = (width > height) ? "landscape" : "portrait";
                var size = new JObject
                {
                    { "width", width },
                    { "height", height },
                    { "orientation", orientation }
                };

                this.GetReactContext().GetNativeModule<UIManagerModule>().EventDispatcher.DispatchEvent(new ReactVideoView.ReactVideoEvent(ReactVideoEventType.Load.GetEventName(), this.GetTag(), new JObject
                {
                    { "duration", MediaPlayer.PlaybackSession.NaturalDuration.TotalSeconds },
                    { "currentTime",  MediaPlayer.PlaybackSession.Position.TotalSeconds },
                    { "naturalSize", size },
                    { "canPlayFastForward", false },
                    { "canPlaySlowForward", false },
                    { "canPlaySlow", false },
                    { "canPlayReverse", false },
                    { "canStepBackward", false },
                    { "canStepForward", false }
                }));
            });
        }

        private void OnMediaFailed(MediaPlayer sender, MediaPlayerFailedEventArgs args)
        {
            var errorData = new JObject
            {
                { "what", args.Error.ToString() },
                { "extra", args.ErrorMessage }
            };

            this.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactVideoEvent(
                        ReactVideoEventType.Error.GetEventName(),
                        this.GetTag(), 
                        new JObject
                        {
                            { "error", errorData }
                        }));
        }

        private void OnMediaEnded(MediaPlayer sender, object args)
        {
            _isCompleted = true;
            this.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactVideoEvent(
                        ReactVideoEventType.End.GetEventName(), 
                        this.GetTag(),
                        null));
        }

        private void OnBufferingStarted(MediaPlaybackSession sender, object args)
        {
            this.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactVideoEvent(
                        ReactVideoEventType.Stalled.GetEventName(),
                        this.GetTag(),
                        new JObject()));
        }

        private void OnBufferingEnded(MediaPlaybackSession sender, object args)
        {
            this.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactVideoEvent(
                        ReactVideoEventType.Resume.GetEventName(),
                        this.GetTag(),
                        new JObject()));
        }

        private void OnSeekCompleted(MediaPlaybackSession sender, object args)
        {
            this.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher.DispatchEvent(
                    new ReactVideoEvent(
                        ReactVideoEventType.Seek.GetEventName(), 
                        this.GetTag(),
                        new JObject()));
        }

        private static async void RunOnDispatcher(DispatchedHandler action)
        {
            await CoreApplication.MainView.CoreWindow.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, action).AsTask().ConfigureAwait(false);
        }

        class ReactVideoEvent : Event
        {
            private readonly string _eventName;
            private readonly JObject _eventData;

            public ReactVideoEvent(string eventName, int viewTag, JObject eventData) 
                : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
            {
                _eventName = eventName;
                _eventData = eventData;
            }

            public override string EventName
            {
                get
                {
                    return _eventName;
                }
            }

            public override bool CanCoalesce
            {
                get
                {
                    return false;
                }
            }

            public override void Dispatch(RCTEventEmitter eventEmitter)
            {
                eventEmitter.receiveEvent(ViewTag, EventName, _eventData);
            }
        }
    }
}
