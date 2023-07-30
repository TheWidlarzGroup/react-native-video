package com.brentvatne.exoplayer;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import java.io.ByteArrayOutputStream;

import javax.annotation.Nullable;

public class ImageUtil
{
    // public static Bitmap convert(String base64Str) throws IllegalArgumentException
    // {
    //     byte[] decodedBytes = Base64.decode(
    //             base64Str.substring(base64Str.indexOf(",")  + 1),
    //             Base64.DEFAULT
    //     );

    //     return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
    // }

    // public static String convert(Bitmap bitmap) {
    //     return convert(bitmap, 100);
    // }

    public static String convert(Bitmap bitmap, Integer quality)
    {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream);

        return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT);
    }

}