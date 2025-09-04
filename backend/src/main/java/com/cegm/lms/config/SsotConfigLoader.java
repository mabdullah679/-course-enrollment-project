package com.cegm.lms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@Configuration
public class SsotConfigLoader {

    private Map<String, Object> ssotConfig;

    @Bean(name = "cegmSsotConfig")
    public Map<String, Object> loadSsotConfig() {
        if (ssotConfig == null) {
            try {
                // Resolve relative to project root or backend
                String path = Files.exists(Paths.get("ssot/ssot.dev.yaml"))
                        ? "ssot/ssot.dev.yaml"
                        : "../ssot/ssot.dev.yaml";

                try (InputStream in = Files.newInputStream(Paths.get(path))) {
                    Yaml yaml = new Yaml();
                    Map<String, Object> loaded = yaml.load(in);

                    // unwrap if nested under "ssotConfig"
                    if (loaded.size() == 1 && loaded.containsKey("ssotConfig")) {
                        loaded = (Map<String, Object>) loaded.get("ssotConfig");
                    }

                    this.ssotConfig = loaded;
                    System.out.println("✅ SSoT config loaded, top-level keys: " + loaded.keySet());
                }
            } catch (Exception e) {
                throw new IllegalStateException("Failed to load SSoT YAML config", e);
            }
        }
        return this.ssotConfig;
    }
}