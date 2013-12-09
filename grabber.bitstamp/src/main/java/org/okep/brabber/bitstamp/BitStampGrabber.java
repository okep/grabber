package org.okep.brabber.bitstamp;

import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.GrabberStatistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.Map;

public class BitStampGrabber implements Grabber {

    private static final Logger log = LoggerFactory.getLogger(BitStampGrabber.class);

    private static final String NAME = "BITSTAMP_GRABBER";

    private static final String DISPLAY_NAME = "Bitstamp Grabber";

    private BitStampStatistics statistics;

    @Override
    public GrabberStatistics getStatistic() {
        return statistics;
    }

    public void serviceRegistered(BitStampGrabber grabber, Map properties) {
        log.info(getDisplayName() + " registered");
        statistics = new BitStampStatistics(new Date());
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
