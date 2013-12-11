package org.okep.brabber.bitstamp;

import com.mongodb.DB;
import com.mongodb.Mongo;
import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.GrabberStatistics;
import org.okep.grabber.restclient.RestClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;

import java.util.Date;
import java.util.Map;

public class BitStampGrabber implements Grabber, Runnable {

    private static final Logger log = LoggerFactory.getLogger(BitStampGrabber.class);

    private static final String NAME = "BITSTAMP_GRABBER";
    private static final String DISPLAY_NAME = "Bitstamp Grabber";
    private static final long BITSTAMP_REST_PERIOD = 1200;              // ban period is 1000
    private static final long BITSTAMP_REQUESTS_PER_TICK = 1;

    private TaskScheduler taskScheduler;

    private Mongo mongo;
    private DB bitStampDb;

    private BitStampStatistics statistics;
    private RestClient restClient;

    @Override
    public void run() {
        System.err.println("sdfasd");
    }

    @Override
    public GrabberStatistics getStatistic() {
        return statistics;
    }

    public void serviceRegistered(BitStampGrabber grabber, Map properties) {
        log.info(getDisplayName() + " registered");
        statistics = new BitStampStatistics(new Date());
        getTaskScheduler().scheduleAtFixedRate(this, BITSTAMP_REQUESTS_PER_TICK * BITSTAMP_REST_PERIOD);

        // initialize database
        bitStampDb = mongo.getDB(NAME);
    }

    public void serviceUnregisterd(BitStampGrabber grabber, Map properties)  {
        log.info(getDisplayName() + " un-registered");
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

    public Mongo getMongo() {
        return mongo;
    }

    public void setMongo(Mongo mongo) {
        this.mongo = mongo;
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
            return getDisplayName() + " started " + getStarted();
        }
    }
}
