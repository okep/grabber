package org.okep.grabber.registry.internal;

import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.Registry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ScheduledFuture;

public class RegistryImpl implements Registry, Runnable {

    private static final Logger log = LoggerFactory.getLogger(RegistryImpl.class);

    private static final int DEFAULT_MONITORING_PERIOD = 10*1000;
    private static final String MONITORING_PERIOD = "registry.monitoring.period";

    private TaskScheduler taskScheduler;
    private ScheduledFuture scheduledFuture;
    Set<Grabber> grabbers;

    @Override
    public void run() {
        for(Grabber grabber : getGrabbers()) {
            log.info(grabber.getDisplayName() + ": " + grabber.getStatistic().getStringRepresentation());
        }
    }

    public void serviceRegistered(Registry registry, Map properties) {
        log.info("Registry started");
        String configPeriod = (String) properties.get(MONITORING_PERIOD);
        long period = (configPeriod == null) ? DEFAULT_MONITORING_PERIOD : Long.parseLong(configPeriod);
        scheduledFuture = taskScheduler.scheduleWithFixedDelay(this, period);
    }

    public void serviceUnregisterd(Registry registry, Map properties)  {
        log.info("Registry stopped");
        scheduledFuture.cancel(false);
    }


    public Set<Grabber> getGrabbers() {
        return grabbers;
    }

    public void setGrabbers(Set<Grabber> grabbers) {
        this.grabbers = grabbers;
    }

    public TaskScheduler getTaskScheduler() {
        return taskScheduler;
    }

    public void setTaskScheduler(TaskScheduler taskScheduler) {
        this.taskScheduler = taskScheduler;
    }
}
