package org.okep.grabber.registry.internal;

import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.Registry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;

import java.util.Set;

public class RegistryImpl implements Registry {

    private static final Logger log = LoggerFactory.getLogger(RegistryImpl.class);

    private TaskScheduler taskScheduler;

    Set<Grabber> grabbers;

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
