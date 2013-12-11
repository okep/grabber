package org.okep.brabber.bitstamp;

import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.GrabberStatistics;
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

    private BitStampStatistics statistics;

    @Override
    public void run() {

        //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public GrabberStatistics getStatistic() {
        return statistics;
    }

    public void serviceRegistered(BitStampGrabber grabber, Map properties) {
        log.info(getDisplayName() + " registered");
        statistics = new BitStampStatistics(new Date());
        getTaskScheduler().scheduleAtFixedRate(this, BITSTAMP_REQUESTS_PER_TICK * BITSTAMP_REST_PERIOD);
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
