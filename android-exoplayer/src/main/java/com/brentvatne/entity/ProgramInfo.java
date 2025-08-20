package com.brentvatne.entity;

import java.util.Objects;

public class ProgramInfo {

    public static final ProgramInfo EMPTY = new ProgramInfo();

    private String title;
    private long startDate;
    private long endDate;
    private String dateFormat;
    private String channelLogoUrl;

    private ProgramInfo() {}

    public ProgramInfo(
            String title,
            long startDate,
            long endDate,
            String dateFormat,
            String channelLogoUrl) {

        this(title, startDate, endDate, channelLogoUrl);
        this.dateFormat = dateFormat;
    }

    public ProgramInfo(
            String title,
            long startDate,
            long endDate,
            String channelLogoUrl) {

        this.title = title;
        this.startDate = startDate;
        this.endDate = endDate;
        this.channelLogoUrl = channelLogoUrl;
    }

    public String getTitle() {
        return title;
    }

    public long getStartDate() {
        return startDate;
    }

    public long getEndDate() {
        return endDate;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public String getChannelLogoUrl() {
        return channelLogoUrl;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProgramInfo that = (ProgramInfo) o;
        return startDate == that.startDate
                && endDate == that.endDate
                && Objects.equals(title, that.title)
                && Objects.equals(dateFormat, that.dateFormat)
                && Objects.equals(channelLogoUrl, that.channelLogoUrl);
    }

    @Override
    public int hashCode() {
        return Objects.hash(title, startDate, endDate, dateFormat, channelLogoUrl);
    }

    @Override
    public String toString() {
        return "ProgramInfo{" +
                "title='" + title + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", dateFormat=" + dateFormat +
                ", channelLogoUrl='" + channelLogoUrl + '\'' +
                '}';
    }
}
