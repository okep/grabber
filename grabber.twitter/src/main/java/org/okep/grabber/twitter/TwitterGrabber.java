package org.okep.grabber.twitter;

import org.okep.grabber.persistence.MongoClient;
import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.GrabberStatistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import twitter4j.FilterQuery;
import twitter4j.TwitterStream;
import twitter4j.TwitterStreamFactory;
import twitter4j.conf.ConfigurationBuilder;

import java.util.*;

public class TwitterGrabber implements Grabber {

    private static final String TRACK_PARAM = "twitter.track";
    private static final String NAME = "twitter_grabber";
    private static final String DISPLAY_NAME = "Twitter Grabber";

    private static final Logger log = LoggerFactory.getLogger(TwitterGrabber.class);

    private MongoClient mongoClient;
    private List<String> track;
    private MongoStatusListener mongoStatusListener;
    private String consumerKey;
    private String consumerSecret;
    private String token;
    private String tokenSecret;
    private String user;
    private TwitterStream twitterStream;
    TwitterStatistics twitterStatistics;

    @Override
    public GrabberStatistics getStatistic() {
        return twitterStatistics;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public String getDisplayName() {
        return DISPLAY_NAME;
    }

    public void serviceRegistered(TwitterGrabber grabber, Map params) {
        String t = (String) params.get(TRACK_PARAM);
        if(t != null) {
            String[] split = t.split(",");
            this.track = Arrays.asList(split);
        }
        log.info("Starting TwitterGrabber with track: " + track);

        start();

    }

    public void start() {
        twitterStatistics = new TwitterStatistics(new Date());
        ConfigurationBuilder cb = new ConfigurationBuilder();
        cb.setJSONStoreEnabled(true)
                .setOAuthConsumerKey(consumerKey)
                .setOAuthConsumerSecret(consumerSecret)
                .setOAuthAccessToken(token)
                .setOAuthAccessTokenSecret(tokenSecret);

        twitterStream = new TwitterStreamFactory(cb.build()).getInstance();

        twitterStream.addListener(mongoStatusListener);
        log.debug("Tracking {}", track);
        String[] trackArray = track.toArray(new String[track.size()]);
        twitterStream.filter(new FilterQuery(0, new long[0], trackArray));
    }

    public void stop() {
        twitterStream.shutdown();
    }

    public void serviceUnregisterd(TwitterGrabber grabber, Map params) {
        log.info("TwitterGrabber is about to finish.");
    }

    public MongoClient getMongoClient() {
        return mongoClient;
    }

    public void setMongoClient(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    public List<String> getTrack() {
        return track;
    }

    public void setTrack(List<String> track) {
        this.track = track;
    }

    public MongoStatusListener getMongoStatusListener() {
        return mongoStatusListener;
    }

    public void setMongoStatusListener(MongoStatusListener mongoStatusListener) {
        this.mongoStatusListener = mongoStatusListener;
    }

    public String getConsumerKey() {
        return consumerKey;
    }

    public void setConsumerKey(String consumerKey) {
        this.consumerKey = consumerKey;
    }

    public String getConsumerSecret() {
        return consumerSecret;
    }

    public void setConsumerSecret(String consumerSecret) {
        this.consumerSecret = consumerSecret;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenSecret() {
        return tokenSecret;
    }

    public void setTokenSecret(String tokenSecret) {
        this.tokenSecret = tokenSecret;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    private class TwitterStatistics extends GrabberStatistics  {
        private TwitterStatistics(Date started) {
            super(started);
        }

        @Override
        public String getStringRepresentation() {
            return getDisplayName() + " started " + getStarted() + " go " + mongoStatusListener.getCounter() + " statuses";
        }
    }
}
