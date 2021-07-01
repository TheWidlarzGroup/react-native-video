package com.brentvatne.util;

import android.content.Context;

import androidx.annotation.NonNull;

import com.diceplatform.doris.ext.imadai.entity.AdTagParameters;
import com.diceplatform.doris.ext.imadai.entity.AdTagParametersBuilder;

import java.util.Map;

public final class AdTagParametersHelper {

    private static final String KEY_IU = "iu";
    private static final String KEY_CUST_PARAMS = "cust_params";
    private static final String KEY_OUTPUT = "output";
    private static final String KEY_VPA = "vpa";
    private static final String KEY_AN = "an";
    private static final String KEY_DESCRIPTION_URL = "description_url";
    private static final String KEY_URL = "url";
    private static final String KEY_TFCD = "tfcd";

    // Prevents instantiation
    private AdTagParametersHelper() {
    }

    @NonNull
    public static AdTagParameters createAdTagParameters(
            Context context,
            Map<String, Object> adTagParametersMap) {
        if (adTagParametersMap == null || adTagParametersMap.isEmpty()) {
            return new AdTagParametersBuilder().build();
        }

        String iu = (String) adTagParametersMap.get(KEY_IU);
        String custParams = (String) adTagParametersMap.get(KEY_CUST_PARAMS);
        String output = (String) adTagParametersMap.get(KEY_OUTPUT);
        String vpa = (String) adTagParametersMap.get(KEY_VPA);
        String an = (String) adTagParametersMap.get(KEY_AN);
        String descriptionUrl = (String) adTagParametersMap.get(KEY_DESCRIPTION_URL);
        String url = (String) adTagParametersMap.get(KEY_URL);
        String tfcd = (String) adTagParametersMap.get(KEY_TFCD);

        String msid = context.getPackageName();
        String isLat = "0"; // Todo: Remove this hard-coded value once we ask the user if they want to enable/disable limited ad tracking

        return new AdTagParametersBuilder()
                .setIu(iu)
                .setCustParams(custParams)
                .setOutput(output)
                .setVpa(vpa)
                .setMsid(msid)
                .setAn(an)
                .setIsLat(isLat)
                .setDescriptionUrl(descriptionUrl)
                .setUrl(url)
                .setTfcd(tfcd)
                .build();
    }
}
