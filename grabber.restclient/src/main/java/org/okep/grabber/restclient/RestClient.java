package org.okep.grabber.restclient;

import java.io.IOException;

public interface RestClient {

    String doGetJson(String url) throws IOException;

}
