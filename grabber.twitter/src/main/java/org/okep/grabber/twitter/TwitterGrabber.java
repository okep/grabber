package org.okep.grabber.twitter;

import org.okep.grabber.persistence.MongoClient;
import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.GrabberStatistics;

import java.util.Set;

public class TwitterGrabber implements Grabber {

    private MongoClient mongoClient;
    private Set<String> track;

    @Override
    public GrabberStatistics getStatistic() {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public String getName() {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public String getDisplayName() {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    public MongoClient getMongoClient() {
        return mongoClient;
    }

    public void setMongoClient(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    public Set<String> getTrack() {
        return track;
    }

    public void setTrack(Set<String> track) {
        this.track = track;
    }
}
