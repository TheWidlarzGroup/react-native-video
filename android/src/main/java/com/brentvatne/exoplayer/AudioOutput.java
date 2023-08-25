package com.brentvatne.exoplayer;

@SuppressLint("InlinedApi")
public enum AudioOutput {
    SPEAKER("speaker", C.STREAM_TYPE_MUSIC),
    EARPIECE("earpiece", C.STREAM_TYPE_VOICE_CALL);

    private final int streamType;
    private final String mName;

    AudioOutput(final String name, int stream) {
        mName = name;
        streamType = stream;
    }

    public static AudioOutput get(String name) {
        for (AudioOutput d : values()) {
            if (d.mName.equalsIgnoreCase(name))
                return d;
        }
        return SPEAKER;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "(" + this.mName + ", " + streamType + ")";
    }
}