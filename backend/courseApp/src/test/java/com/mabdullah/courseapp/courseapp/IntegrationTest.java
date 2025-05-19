package com.mabdullah.courseapp.courseapp;

import com.mabdullah.courseapp.courseapp.config.AsyncSyncConfiguration;
import com.mabdullah.courseapp.courseapp.config.EmbeddedSQL;
import com.mabdullah.courseapp.courseapp.config.JacksonConfiguration;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Base composite annotation for integration tests.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(classes = { CourseApp.class, JacksonConfiguration.class, AsyncSyncConfiguration.class })
@EmbeddedSQL
public @interface IntegrationTest {
}
