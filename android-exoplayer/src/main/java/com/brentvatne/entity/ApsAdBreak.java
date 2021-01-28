package com.brentvatne.entity;

import androidx.annotation.Nullable;

public class ApsAdBreak {

    private final String adLayoutName;
    private final String slotId;

    public ApsAdBreak(@Nullable String adLayoutName, @Nullable String slotId) {
        this.adLayoutName = adLayoutName;
        this.slotId = slotId;
    }

    @Nullable
    public String getAdLayoutName() {
        return adLayoutName;
    }

    @Nullable
    public String getSlotId() {
        return slotId;
    }
}
