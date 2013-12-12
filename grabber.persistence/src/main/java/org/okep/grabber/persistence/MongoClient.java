package org.okep.grabber.persistence;

import com.mongodb.DB;
import com.mongodb.DBCollection;

import java.net.UnknownHostException;

public interface MongoClient {
    DBCollection getCollection(String name);
    DB getDB();
    void open(String host, int port) throws UnknownHostException;
    void close();
}
