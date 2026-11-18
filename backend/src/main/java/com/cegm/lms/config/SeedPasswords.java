package com.cegm.lms.config;

import org.slf4j.Logger;
import org.springframework.core.env.Environment;

import java.util.Optional;

/** Reads seeded dev passwords from the environment. No defaults: unset/blank means "do not seed". */
final class SeedPasswords {

    static final String ADMIN_VAR = "SEED_ADMIN_PASSWORD";
    static final String STUDENT_VAR = "SEED_STUDENT_PASSWORD";

    private SeedPasswords() {}

    /** Returns the value, or empty after logging a WARN that names the variable (never a value). */
    static Optional<String> resolve(Environment env, String var, String skipped, Logger log) {
        String v = env.getProperty(var);
        if (v == null || v.isBlank()) {
            log.warn("{} is not set; NOT creating the seeded {} user", var, skipped);
            return Optional.empty();
        }
        return Optional.of(v);
    }
}
