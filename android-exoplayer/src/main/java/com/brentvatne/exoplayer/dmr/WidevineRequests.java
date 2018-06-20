package com.brentvatne.exoplayer.dmr;

import android.util.Base64;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

public class WidevineRequests {

    public WidevineRequests() {
    }

    public byte[] executePostLicenseRequest(String url, byte[] data, Map<String, String> requestProperties, boolean licenseKeyRequest) throws Exception {
        HttpURLConnection httpConnection = null;
        try {
            httpConnection = (HttpURLConnection) new URL(url).openConnection();
            httpConnection.setRequestMethod("POST");
            httpConnection.setRequestProperty("Accept", "*/*");
            httpConnection.setDoOutput(data != null);

            // Write the request body, if there is one.
            if (data != null) {
                writeOutputStream(data, httpConnection);
            }

            // Read and return the response body.
            InputStream in = new BufferedInputStream(httpConnection.getInputStream());
            if (licenseKeyRequest) {
                String result = getStringFromInputStream(in);
                JSONObject jsonResponse = new JSONObject(result);
                String license = jsonResponse.getString("license");
                return Base64.decode(license, Base64.DEFAULT);
            } else {
                return getBytesFromInputStream(in);
            }
        } finally {
            httpConnection.disconnect();
        }
    }

    public byte[] executePostProvisioning(String url, byte[] data, Map<String, String> requestProperties, boolean licenseKeyRequest) throws Exception {
        HttpURLConnection httpConnection = null;
        try {
            httpConnection = (HttpURLConnection) new URL(url).openConnection();
            httpConnection.setRequestMethod("POST");
            httpConnection.setDoOutput(data != null);
            httpConnection.setDoInput(true);

            // Set all Request properties
            if (requestProperties != null) {
                for (Map.Entry<String, String> requestProperty : requestProperties.entrySet()) {
                    httpConnection.setRequestMethod(requestProperty.getKey());
                }
            }

            // Write the request body, if there is one.
            if (data != null) {
                writeOutputStream(data, httpConnection);
            }

            // Read and return the response body.
            InputStream inputStream = httpConnection.getInputStream();
            try {
                return getBytesFromInputStream(inputStream);
            } finally {
                inputStream.close();
            }
        } finally {
            if (httpConnection != null) {
                httpConnection.disconnect();
            }
        }
    }

    private void writeOutputStream(byte[] data, HttpURLConnection httpConnection) throws IOException {
        OutputStream outputStream = httpConnection.getOutputStream();
        try {
            outputStream.write(data);
        } finally {
            outputStream.close();
        }
    }

    private byte[] getBytesFromInputStream(InputStream inputStream) throws IOException {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        byte scratch[] = new byte[1024];
        int bytesRead;
        while ((bytesRead = inputStream.read(scratch)) != -1) {
            byteArrayOutputStream.write(scratch, 0, bytesRead);
        }
        return byteArrayOutputStream.toByteArray();
    }

    private String getStringFromInputStream(InputStream is) {
        String rLine = "";
        StringBuilder answer = new StringBuilder();

        InputStreamReader isr = new InputStreamReader(is);

        BufferedReader rd = new BufferedReader(isr);

        try {
            while ((rLine = rd.readLine()) != null) {
                answer.append(rLine);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return answer.toString();
    }
}
