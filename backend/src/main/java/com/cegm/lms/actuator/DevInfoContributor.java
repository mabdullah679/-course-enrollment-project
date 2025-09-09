// src/main/java/com/cegm/lms/actuator/DevInfoContributor.java
package com.cegm.lms.actuator;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.info.Info;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevInfoContributor implements InfoContributor {

    @Value("${service.name:service}")
    private String serviceName;

    @Override
    public void contribute(Info.Builder builder) {
        builder.withDetail("message", serviceName + " not available in dev profile.");
    }
}
