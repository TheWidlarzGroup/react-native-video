using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Threading;

namespace ReactNativeVideo
{
    class ReactVideoView : Border, IDisposable
    {
        public const string EVENT_PROP_SEEK_TIME = "seekTime";

        private readonly DispatcherTimer _timer;

        private bool _isLoopingEnabled;
        private bool _isPaused;
        private bool _isMuted;
        private bool _isCompleted;
        private double _volume;
        private double _rate;

        private MediaPlayer _player;
        private VideoDrawing _drawing;
        private MediaTimeline _timeline;
        private MediaClock _clock;
        private DrawingBrush _brush;

        public ReactVideoView()
        {
            _timer = new DispatcherTimer();
            _timer.Interval = TimeSpan.FromMilliseconds(250.0);
            _timer.Start();
            _player = new MediaPlayer();
            _drawing = new VideoDrawing();
            _drawing.Rect = new Rect(0, 0, 100, 100); // Set the initial viewing area
            _drawing.Player = _player;
            _brush = new DrawingBrush(_drawing);
            this.Background = _brush;
        }

        public string Source
        {
            set
            {
                var uri = new Uri(value);
                
                _player.Open(uri);

                this.GetReactContext()
                    .GetNativeModule<UIManagerModule>()
                    .EventDispatcher
                    .DispatchEvent(
                        new ReactVideoEvent(
                            ReactVideoEventType.LoadStart.GetEventName(),
                            this.GetTag(),
                            new JObject
                            {
                                {"src", uri}
                            }));

                ApplyModifiers();
                SubscribeEvents();
            }
        }

        public bool IsLoopingEnabled
        {
            set
            {
                _isLoopingEnabled = value;
            }
        }

        public bool IsMuted
        {
            set
            {
                _isMuted = value;
                if (_player != null)
                {
                    _player.IsMuted = _isMuted;
                }
            }
        }

        public bool IsPaused
        {
            set
            {
                _isPaused = value;
                if (_player != null)
                {
                    if (_isPaused)
                    {
                        _player.Pause();
                    }
                    else
                    {
                        _player.Play();
                    }
                }
            }
        }

        public double Volume
        {
            set
            {
                _volume = value;
                if (_player != null)
                {
                    _player.Volume = _volume;
                }
            }
        }

        public double Rate
        {
            set
            {
                _rate = value;
                if (_player != null)
                {
                    _player.SpeedRatio = _rate;
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
            if (_player != null)
            {
                _player.Position = TimeSpan.FromSeconds(seek);
            }
        }

        public void Dispose()
        {
            if (_player != null)
            {
                _timer.Tick -= OnTick;
                _player.MediaOpened -= OnMediaOpened;
                _player.MediaFailed -= OnMediaFailed;
                _player.MediaEnded -= OnMediaEnded;
                _player.BufferingStarted -= OnBufferingStarted;
                _player.BufferingEnded -= OnBufferingEnded;
                // _player.SeekCompleted -= OnSeekCompleted;
            }

            _timer.Stop();
        }

        private void ApplyModifiers()
        {
            IsLoopingEnabled = _isLoopingEnabled;
            IsMuted = _isMuted;
            IsPaused = _isPaused;
            Volume = _volume;
            Rate = _rate;
        }

        private void SubscribeEvents()
        {
            _timer.Tick += OnTick;
            _player.MediaOpened += OnMediaOpened;
            _player.MediaFailed += OnMediaFailed;
            _player.MediaEnded += OnMediaEnded;
            _player.BufferingStarted += OnBufferingStarted;
            _player.BufferingEnded += OnBufferingEnded;
            //_player.SeekCompleted += OnSeekCompleted;
        }

        private void OnTick(object sender, object e)
        {
            if (_player != null && !_isCompleted && !_isPaused)
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
                                { "currentTime",  _player.Position.TotalSeconds },
                                { "playableDuration", 0.0 /* TODO */ }
                            }));
            }
        }

        private void OnMediaOpened(object sender, EventArgs args)
        {
            RunOnDispatcher(delegate
            {
                var width = _player.NaturalVideoWidth;
                var height = _player.NaturalVideoHeight;
                var orientation = (width > height) ? "landscape" : "portrait";
                var size = new JObject
                {
                    { "width", width },
                    { "height", height },
                    { "orientation", orientation }
                };

                _drawing.Rect = new Rect(new Size(width, height));

                this.GetReactContext()
                    .GetNativeModule<UIManagerModule>()
                    .EventDispatcher
                    .DispatchEvent(
                        new ReactVideoEvent(
                            ReactVideoEventType.Load.GetEventName(),
                            this.GetTag(),
                            new JObject
                            {
                                { "duration", _player.NaturalDuration.TimeSpan.TotalSeconds },
                                { "currentTime", _player.Position.TotalSeconds },
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

        private void OnMediaFailed(object sender, ExceptionEventArgs args)
        {
            var errorData = new JObject
            {
                { "what", args.ErrorException.HResult.ToString() },
                { "extra", args.ErrorException.Message }
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

        private void OnMediaEnded(object sender, EventArgs args)
        {
            if (_isLoopingEnabled)
            {
                _player.Position = TimeSpan.Zero;
                _player.Play();
            }
            else
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
        }

        private void OnBufferingStarted(object sender, EventArgs args)
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

        private void OnBufferingEnded(object sender, EventArgs args)
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

        private void OnSeekCompleted(object sender, EventArgs args)
        {
            this.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher.DispatchEvent(
                    new ReactVideoEvent(
                        ReactVideoEventType.Seek.GetEventName(),
                        this.GetTag(),
                        new JObject()));
        }

        private static async void RunOnDispatcher(Action action)
        {
            await Application.Current.Dispatcher.InvokeAsync(action).Task.ConfigureAwait(false);
        }

        class ReactVideoEvent : Event
        {
            private readonly string _eventName;
            private readonly JObject _eventData;

            public ReactVideoEvent(string eventName, int viewTag, JObject eventData)
                : base(viewTag)
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
