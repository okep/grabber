package org.okep.grabber.registry;

import java.util.Date;

public abstract class GrabberStatistics {
    private Date started;

    protected GrabberStatistics(Date started) {
        this.started = started;
    }

    public Date getStarted() {
        return started;
    }

    public abstract String getStringRepresentation();
}
