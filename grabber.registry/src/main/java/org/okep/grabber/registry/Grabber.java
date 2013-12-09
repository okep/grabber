package org.okep.grabber.registry;

public interface Grabber {

    GrabberStatistics getStatistic();

    String getName();

    String getDisplayName();
}
