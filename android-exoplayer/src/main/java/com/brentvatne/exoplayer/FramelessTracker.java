package com.brentvatne.exoplayer;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

public class FramelessTracker {

    public int bounce_cnt = 0;
    public int rotation_cnt = 0;
    public int max_degree = 0;
    public int videoId;

    private int last_orientation = 0, orient_th = 15;

    public void reset_count() {
        bounce_cnt = 0;
        max_degree = 0;
        rotation_cnt = 0;
    }

    private void check_rotated(double degree) {
        if (-orient_th < degree && degree < orient_th && last_orientation != 0) {
            last_orientation = 0;
            rotation_cnt ++;
        }
        else if (90-orient_th < degree && degree < 90+orient_th && last_orientation != 1) {
            last_orientation = 1;
            rotation_cnt ++;
        }
        else if (180-orient_th < degree && degree < -180+orient_th && last_orientation != 2) {
            last_orientation = 2;
            rotation_cnt ++;
        }
        else if (-90-orient_th < degree && degree < -90+orient_th && last_orientation != 3) {
            last_orientation = 3;
            rotation_cnt ++;
        }
    }

    public void record(double display_rotation_degree) {
        max_degree = (int)Math.abs(display_rotation_degree) > max_degree ? (int)Math.abs(display_rotation_degree) : max_degree;
        check_rotated(display_rotation_degree);
        //Log.v("rotato", "videoId: " + videoId + ", max_degree: " + max_degree + ", rotation cnt: " + rotation_cnt + ", bounce cnt: " + bounce_cnt);
    }

    public void to_bounce() {
        bounce_cnt++;
    }

    public JSONObject buildTrackingProperties() {
        JSONObject properties = new JSONObject();
        try {
            properties.put("Video_id", String.valueOf(videoId));
            properties.put("Maximum Degree", String.valueOf(max_degree));
            properties.put("Flipped_Count", String.valueOf(rotation_cnt));
            properties.put("Bounced_Count", String.valueOf(bounce_cnt));
        }
        catch (JSONException e) {
            return null;
        }
        reset_count();  // reset after submitting stats
        return properties;
    }
}
