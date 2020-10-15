package com.brentvatne.exoplayer;

public enum ControlState {
    HIDDEN("HIDDEN"),
    INACTIVE("INACTIVE"),
    ACTIVE("ACTIVE"),
    UNKNOWN("UNKNOWN");

    private final String text;

    ControlState(final String text) {
        this.text = text;
    }

    @Override
    public String toString() {
        return text;
    }

    public static ControlState make(String state) {
        switch (state) {
            case "HIDDEN":
                return HIDDEN;
            case "INACTIVE":
                return INACTIVE;
            case "ACTIVE":
                return ACTIVE;
            default:
                return UNKNOWN;
        }
    }
}
