package org.okep.grabber.registry.internal;

import org.okep.grabber.registry.Grabber;
import org.okep.grabber.registry.Registry;

import java.util.Set;

public class RegistryImpl implements Registry {


    Set<Grabber> grabbers;

    public Set<Grabber> getGrabbers() {
        return grabbers;
    }

    public void setGrabbers(Set<Grabber> grabbers) {
        this.grabbers = grabbers;
    }
}
