package org.okep.grabber.restclient.internal;


import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.okep.grabber.restclient.RestClient;

import java.io.*;

public class RestClientImpl implements RestClient {
    public static final String APPLICATION_JSON = "application/json";
    public static final String ACCEPT = "Accept";
    public static final int BUFFER_SIZE = 1024;
    private HttpClient httpClient = new DefaultHttpClient();


    @Override
    public String doGetJson(String url) throws IOException {
        HttpGet httpGet = new HttpGet(url);
        httpGet.setHeader(ACCEPT, APPLICATION_JSON);
        HttpEntity entity = httpClient.execute(httpGet).getEntity();
        return slurp(entity.getContent(), BUFFER_SIZE);
    }


    public static String slurp(final InputStream is, final int bufferSize) throws IOException {
        final char[] buffer = new char[bufferSize];
        final StringBuilder out = new StringBuilder();
        final Reader in = new InputStreamReader(is, "UTF-8");
        try {
            while (true) {
                int rsz = in.read(buffer, 0, buffer.length);
                if (rsz < 0)
                    break;
                out.append(buffer, 0, rsz);
            }
        }
        finally {
            in.close();
        }
        return out.toString();
    }
}
