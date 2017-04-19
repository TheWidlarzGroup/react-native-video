using System;
using static System.FormattableString;

namespace ReactNativeVideo
{
    static class ReactVideoEventTypeExtensions
    {
        public static string GetEventName(this ReactVideoEventType eventType)
        {
            switch (eventType)
            {
                case ReactVideoEventType.LoadStart:
                    return "onVideoLoadStart";
                case ReactVideoEventType.Load:
                    return "onVideoLoad";
                case ReactVideoEventType.Error:
                    return "onVideoError";
                case ReactVideoEventType.Progress:
                    return "onVideoProgress";
                case ReactVideoEventType.Seek:
                    return "onVideoSeek";
                case ReactVideoEventType.End:
                    return "onVideoEnd";
                case ReactVideoEventType.Stalled:
                    return "onPlaybackStalled";
                case ReactVideoEventType.Resume:
                    return "onPlaybackResume";
                case ReactVideoEventType.ReadyForDisplay:
                    return "onReadyForDisplay";
                default:
                    throw new NotSupportedException(
                        Invariant($"No event name added for event type '{eventType}'."));
            }
        }
    }
}
