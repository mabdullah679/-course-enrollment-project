package com.mabdullah.courseapp.gradeapp;

import com.mabdullah.courseapp.gradeapp.config.AsyncSyncConfiguration;
import com.mabdullah.courseapp.gradeapp.config.EmbeddedSQL;
import com.mabdullah.courseapp.gradeapp.config.JacksonConfiguration;
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
@SpringBootTest(classes = { GradeApp.class, JacksonConfiguration.class, AsyncSyncConfiguration.class })
@EmbeddedSQL
public @interface IntegrationTest {
}
