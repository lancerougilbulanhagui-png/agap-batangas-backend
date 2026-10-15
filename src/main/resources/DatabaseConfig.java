package com.example.demo; // Change to match your actual application package

import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.jdbc.DataSourceBuilder;

@Configuration
public class DatabaseConfig {

    @Bean
    public DataSource dataSource() {
        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url("jdbc:postgresql://://supabase.com")
                .username("postgres.vdypwgfzfczqxcbkxjns")
                .password("AGAPBatangas3")
                .build();
    }
}
