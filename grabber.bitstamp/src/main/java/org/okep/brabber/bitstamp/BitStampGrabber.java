package org.okep.brabber.bitstamp;

import com.mongodb.*;
import com.mongodb.util.JSON;
import org.bson.BSON;
import org.bson.BSONObject;
import org.okep.grabber.persistence.MongoClient;
import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.GrabberStatistics;
import org.okep.grabber.restclient.RestClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;

import java.io.IOException;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;

public class BitStampGrabber implements Grabber, Runnable {

    private static final Logger log = LoggerFactory.getLogger(BitStampGrabber.class);

    private static final String NAME = "BITSTAMP_GRABBER";
    private static final String DISPLAY_NAME = "Bitstamp Grabber";
    private static final long BITSTAMP_REST_PERIOD = 1200;              // ban period is 1000
    private static final long BITSTAMP_REQUESTS_PER_TICK = 3;

    private static final String DEFAULT_TICKER_URL = "https://www.bitstamp.net/api/ticker/";
    private static final String DEFAULT_ORDER_BOOK_URL = "https://www.bitstamp.net/api/order_book/";
    private static final String DEFAULT_TRANSACTION_URL = "https://www.bitstamp.net/api/transactions/";
    public static final String TICKER_COLLECTION = "ticker";
    public static final String ORDER_BOOK_COLLECTION = "orderBook";
    public static final String TRANSACTION_COLLECTION = "transaction";

    private TaskScheduler taskScheduler;
    private MongoClient mongoClient;

    private BitStampStatistics statistics;
    private RestClient restClient;
    private DBCollection collection;
    private ScheduledFuture scheduledFuture;
    private int invocationCount = 0;

    // todo make it initalizable from configuration
    private String tickerUrl = DEFAULT_TICKER_URL;
    private String orderBookUrl = DEFAULT_ORDER_BOOK_URL;
    private String transactionUrl = DEFAULT_TRANSACTION_URL;

    @Override
    public void run() {
        try {
            String ticker = restClient.doGetJson(tickerUrl);
            mongoClient.getCollection(TICKER_COLLECTION).insert(mongoClient.parseAndAddTime(ticker));

            String orderBook = restClient.doGetJson(orderBookUrl);
            mongoClient.getCollection(ORDER_BOOK_COLLECTION).insert(mongoClient.parseAndAddTime(orderBook));

            String transactions = restClient.doGetJson(orderBookUrl);
            mongoClient.getCollection(TRANSACTION_COLLECTION).insert((DBObject) mongoClient.parseAndAddTime(transactions));
            synchronized (this) {
                invocationCount++;
            }
        } catch (Throwable e) {
            log.error("Problem in communication with BITSTAMP", e);
        }
    }

    @Override
    public GrabberStatistics getStatistic() {
        return statistics;
    }

    public void serviceRegistered(BitStampGrabber grabber, Map properties) {
        log.info(getDisplayName() + " registered");
        statistics = new BitStampStatistics(new Date());
        scheduledFuture = getTaskScheduler().scheduleAtFixedRate(this, BITSTAMP_REQUESTS_PER_TICK * BITSTAMP_REST_PERIOD);

        // initialize database
        collection = mongoClient.getCollection(getName());
    }

    public void serviceUnregisterd(BitStampGrabber grabber, Map properties)  {
        log.info(getDisplayName() + " un-registered");
        scheduledFuture.cancel(false);
    }

    public String getTickerUrl() {
        return tickerUrl;
    }

    public void setTickerUrl(String tickerUrl) {
        this.tickerUrl = tickerUrl;
    }

    public String getOrderBookUrl() {
        return orderBookUrl;
    }

    public void setOrderBookUrl(String orderBookUrl) {
        this.orderBookUrl = orderBookUrl;
    }

    public String getTransactionUrl() {
        return transactionUrl;
    }

    public void setTransactionUrl(String transactionUrl) {
        this.transactionUrl = transactionUrl;
    }

    public MongoClient getMongoClient() {
        return mongoClient;
    }

    public void setMongoClient(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public String getDisplayName() {
        return DISPLAY_NAME;
    }

    public TaskScheduler getTaskScheduler() {
        return taskScheduler;
    }

    public void setTaskScheduler(TaskScheduler taskScheduler) {
        this.taskScheduler = taskScheduler;
    }


    public RestClient getRestClient() {
        return restClient;
    }

    public void setRestClient(RestClient restClient) {
        this.restClient = restClient;
    }

    private class BitStampStatistics extends GrabberStatistics {
        protected BitStampStatistics(Date started) {
            super(started);
        }

        @Override
        public String getStringRepresentation() {
            String ret;
            synchronized (BitStampGrabber.this) {
                ret = getDisplayName() + " did " + invocationCount + " iterations sice " + getStarted();
            }
            return ret;
        }
    }
}
