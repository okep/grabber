package org.okep.grabber.twitter;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.okep.grabber.persistence.MongoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import twitter4j.StallWarning;
import twitter4j.Status;
import twitter4j.StatusDeletionNotice;
import twitter4j.StatusListener;
import twitter4j.json.DataObjectFactory;

public class MongoStatusListener implements StatusListener {

    private static final Logger log = LoggerFactory.getLogger(MongoStatusListener.class);

    private MongoClient mongoClient;
    private static final String GRABBER_TWITTER_COLLECTION = "grabber_twitter";
    private static final String GRABBER_TWITTER_DELETE_COLLECTION = "grabber_delete_twitter";
    private volatile int counter = 0;

    @Override
    public void onStatus(Status status) {
        String rawJSON = DataObjectFactory.getRawJSON(status);
        mongoClient.getCollection(GRABBER_TWITTER_COLLECTION).insert(mongoClient.addTime((BasicDBObject) JSON.parse(rawJSON)));
        counter++;
    }

    @Override
    public void onDeletionNotice(StatusDeletionNotice statusDeletionNotice) {
        log.debug("Deleting status {}", statusDeletionNotice.getStatusId());
        BasicDBObject delete = new BasicDBObject();
        delete.append("statusId", statusDeletionNotice.getStatusId());
        delete.append("userId", statusDeletionNotice.getUserId());
        mongoClient.getCollection(GRABBER_TWITTER_DELETE_COLLECTION).insert(mongoClient.addTime(delete));
    }

    @Override
    public void onTrackLimitationNotice(int numberOfLimitedStatuses) {
        log.error("Track limitation notice, number of limited statuses {}", numberOfLimitedStatuses);
    }

    @Override
    public void onScrubGeo(long l, long l2) {
        log.info("onScrubGeo");
    }

    @Override
    public void onStallWarning(StallWarning stallWarning) {
        log.warn(stallWarning.toString());
    }

    @Override
    public void onException(Exception e) {
        log.error("Streem exception", e);
    }

    public MongoClient getMongoClient() {
        return mongoClient;
    }

    public void setMongoClient(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    public int getCounter() {
        return counter;
    }
}
