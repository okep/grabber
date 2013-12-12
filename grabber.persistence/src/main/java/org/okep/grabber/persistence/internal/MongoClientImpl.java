package org.okep.grabber.persistence.internal;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.Mongo;
import com.mongodb.util.JSON;
import org.okep.grabber.persistence.MongoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.UnknownHostException;
import java.util.Map;

public class MongoClientImpl implements MongoClient {

    private static final String DEFAULT_HOST = "localhost";
    private static final int DEFAULT_PORT = 27017;
    private static final Logger log = LoggerFactory.getLogger(MongoClientImpl.class);
    public static final String MONGO_HOST = "mongo.host";
    public static final String MONGO_PORT = "mongo.port";
    public static final String DEFAULT_DATABASE_NAME = "grabber";
    public static final String MONGO_DATABASE_NAME = "mongo.databaseName";

    private Mongo mongo;
    private String databaseName = DEFAULT_DATABASE_NAME;

    @Override
    public DBCollection getCollection(String name) {
        return getDB().getCollection(name);
    }

    @Override
    public DB getDB() {
        return mongo.getDB(databaseName);
    }

    @Override
    public BasicDBObject parse(String json) {
        return (BasicDBObject) JSON.parse(json);
    }

    @Override
    public BasicDBObject addTime(BasicDBObject object) {
        object.append("machineTime", Long.toString(System.currentTimeMillis()));
        return  object;
    }

    @Override
    public BasicDBObject parseAndAddTime(String json) {
        return addTime(parse(json));
    }

    public void registration(MongoClient mongoClient, Map properties) {
        try {
            String host = (String) properties.get(MONGO_HOST);
            String mongoPort = (String) properties.get(MONGO_PORT);
            open((host != null) ? host : DEFAULT_HOST, (mongoPort != null) ? Integer.parseInt(mongoPort) : DEFAULT_PORT);
            String databaseName = (String) properties.get(MONGO_DATABASE_NAME);
            setDatabaseName((databaseName != null) ? databaseName : DEFAULT_DATABASE_NAME);
        } catch (UnknownHostException e) {
            log.error("MongoDB connection failed", e);
        }
    }

    public void unregistration(MongoClient mongoClient, Map properties) {
        close();
    }

    @Override
    public void open(String host, int port) throws UnknownHostException {
        log.info("Connection to {} on port {} MongoDB", host, port);
        mongo = new Mongo(host, port);
    }

    @Override
    public void close() {
        if(mongo != null) {
            mongo.close();
        }
    }

    public String getDatabaseName() {
        return databaseName;
    }

    public void setDatabaseName(String databaseName) {
        this.databaseName = databaseName;
    }
}
