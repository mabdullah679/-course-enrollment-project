package com.mabdullah.courseapp.gateway.config;

import org.springframework.context.annotation.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
@Profile("dev")
public class MockMailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        return new JavaMailSenderImpl(); // do-nothing mock sender for dev
    }
}
