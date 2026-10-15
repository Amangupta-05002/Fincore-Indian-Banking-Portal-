export const SPRING_BOOT_POM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>
    <groupId>com.fincore</groupId>
    <artifactId>fincore-banking-service</artifactId>
    <version>1.0.0</version>
    <name>fincore-banking-service</name>
    <description>FinCore - Authoritative Java 21 Banking & Transaction Management Backend</description>

    <properties>
        <java.version>21</java.version>
        <jjwt.version>0.12.6</jjwt.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web & REST -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Data JPA & Hibernate -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Spring Security & JWT -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- Spring Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- MySQL Connector -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- JJWT for modern JWT creation & validation -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>\${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>\${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>\${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Actuator for Health Monitoring -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;

export const APPLICATION_YML = `server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: fincore-banking-service

  datasource:
    url: jdbc:mysql://localhost:3306/fincore_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect

# JWT & Security Properties
fincore:
  security:
    jwt:
      secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
      expiration-ms: 86400000 # 24 hours
  cors:
    allowed-origins: "http://localhost:3000,http://localhost:5173,https://ais-dev-gtfxawli6zjf7m4xpzwgcl-467039202640.asia-southeast1.run.app"

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
`;

export const MYSQL_SCHEMA_SQL = `-- ========================================================
-- FinCore Indian Banking & Transaction Management System
-- Authoritative MySQL 8.0+ Database Schema (InnoDB)
-- ========================================================

CREATE DATABASE IF NOT EXISTS fincore_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fincore_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    cif_number VARCHAR(20) NOT NULL UNIQUE,
    pan_number VARCHAR(10),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_username (username),
    INDEX idx_user_cif (cif_number)
) ENGINE=InnoDB;

-- 2. Bank Accounts Table (Savings, Current, Fixed Deposit)
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_type ENUM('SAVINGS', 'CURRENT', 'SALARY', 'FIXED_DEPOSIT') NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    available_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('ACTIVE', 'DORMANT', 'FROZEN') NOT NULL DEFAULT 'ACTIVE',
    ifsc_code VARCHAR(11) NOT NULL DEFAULT 'FINC0001004',
    micr_code VARCHAR(9) DEFAULT '110992004',
    branch_name VARCHAR(100) DEFAULT 'Connaught Place Branch, New Delhi',
    interest_rate DECIMAL(5, 2) DEFAULT 3.50,
    overdraft_limit DECIMAL(15, 2) DEFAULT 0.00,
    nickname VARCHAR(100),
    nominee_registered BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_acc_user (user_id),
    INDEX idx_acc_number (account_number)
) ENGINE=InnoDB;

-- 3. Beneficiaries Table (Indian NetBanking)
CREATE TABLE IF NOT EXISTS beneficiaries (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    branch_name VARCHAR(100),
    account_type ENUM('SAVINGS', 'CURRENT') DEFAULT 'SAVINGS',
    transfer_limit DECIMAL(15, 2) DEFAULT 200000.00,
    nickname VARCHAR(60),
    status ENUM('ACTIVE', 'COOLING_OFF', 'PENDING') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ben_user (user_id)
) ENGINE=InnoDB;

-- 4. Transactions Ledger Table (IMPS, NEFT, RTGS)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    transaction_reference VARCHAR(50) NOT NULL UNIQUE, -- UTR or Bank Ref
    source_account_id VARCHAR(36) NOT NULL,
    source_account_number VARCHAR(20) NOT NULL,
    destination_account_number VARCHAR(30) NOT NULL,
    beneficiary_name VARCHAR(100) NOT NULL,
    beneficiary_bank VARCHAR(100),
    beneficiary_ifsc VARCHAR(11),
    transfer_mode ENUM('IMPS', 'NEFT', 'RTGS', 'INTERNAL') NOT NULL DEFAULT 'IMPS',
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    type ENUM('TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'BILL_PAYMENT', 'INTEREST_CREDIT') NOT NULL,
    status ENUM('COMPLETED', 'PENDING', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'COMPLETED',
    description VARCHAR(255),
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    balance_after DECIMAL(15, 2),
    channel VARCHAR(30) DEFAULT 'NET_BANKING',
    idempotency_key VARCHAR(64) UNIQUE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    INDEX idx_tx_source_acc (source_account_id),
    INDEX idx_tx_reference (transaction_reference),
    INDEX idx_tx_timestamp (timestamp)
) ENGINE=InnoDB;

-- 5. Seed Customer (Rohan Sharma) & Accounts (Password: password123)
INSERT INTO users (id, username, email, password_hash, full_name, phone, cif_number, pan_number, role)
VALUES (
    'usr_fincore_in_01',
    'rohan.sharma',
    'rohan.sharma@example.in',
    '$2a$10$7vU0y5R70N0h6F9rM4s8..W62uD3jB2mQpC4uV9iK8xR4yL2zP1iG', -- BCrypt for 'password123'
    'Rohan Sharma',
    '+91 98765 43210',
    'CIF88390192',
    'ABCPS1234K',
    'CUSTOMER'
) ON DUPLICATE KEY UPDATE username=username;

INSERT INTO accounts (id, user_id, account_number, account_type, currency, balance, available_balance, status, ifsc_code, micr_code, branch_name, nickname)
VALUES 
    ('acc_sav_001', 'usr_fincore_in_01', '501004928172', 'SAVINGS', 'INR', 184520.50, 182520.50, 'ACTIVE', 'FINC0001004', '110992004', 'Connaught Place Branch, New Delhi', 'Primary Savings Account'),
    ('acc_cur_002', 'usr_fincore_in_01', '502008491024', 'CURRENT', 'INR', 492300.00, 485300.00, 'ACTIVE', 'FINC0001004', '110992004', 'Connaught Place Branch, New Delhi', 'Business Operations Current A/c'),
    ('acc_fd_003', 'usr_fincore_in_01', '503001928475', 'FIXED_DEPOSIT', 'INR', 1000000.00, 1000000.00, 'ACTIVE', 'FINC0001004', '110992004', 'Connaught Place Branch, New Delhi', 'Tax Saver Fixed Deposit (5 Yrs)')
ON DUPLICATE KEY UPDATE account_number=account_number;
`;

export const SPRING_SECURITY_CONFIG = `package com.fincore.config;

import com.fincore.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/health", "/actuator/**", "/api/v1/auth/health", "/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
`;

export const SPRING_TRANSFER_CONTROLLER = `package com.fincore.controller;

import com.fincore.dto.TransferRequestDTO;
import com.fincore.dto.TransferResponseDTO;
import com.fincore.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public ResponseEntity<TransferResponseDTO> executeTransfer(
            @Valid @RequestBody TransferRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        TransferResponseDTO response = transferService.processTransfer(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
`;

export function generatePostmanCollection(): string {
  const collection = {
    info: {
      _postman_id: "fincore-banking-v1-api",
      name: "FinCore Banking REST API (Spring Boot 3 + Java 21)",
      description: "Complete Postman testing suite for FinCore Banking & Transaction Management System. Authoritative backend running on Spring Boot with MySQL persistence.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
      {
        key: "baseUrl",
        value: "http://localhost:8080/api/v1",
        type: "string"
      },
      {
        key: "authToken",
        value: "",
        type: "string"
      }
    ],
    item: [
      {
        name: "1. Health & Status",
        item: [
          {
            name: "Backend Health Check",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/health",
                host: ["{{baseUrl}}"],
                path: ["health"]
              }
            }
          },
          {
            name: "Spring Boot Actuator Health",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "http://localhost:8080/actuator/health",
                protocol: "http",
                host: ["localhost:8080"],
                path: ["actuator", "health"]
              }
            }
          }
        ]
      },
      {
        name: "2. Authentication",
        item: [
          {
            name: "Login (Rohan Sharma)",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.token) {",
                    "    pm.collectionVariables.set('authToken', jsonData.token);",
                    "    console.log('JWT Token saved to collection variable');",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  username: "rohan.sharma",
                  password: "password123"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/auth/login",
                host: ["{{baseUrl}}"],
                path: ["auth", "login"]
              }
            }
          },
          {
            name: "Get Current User Profile",
            request: {
              method: "GET",
              header: [
                { key: "Authorization", value: "Bearer {{authToken}}" }
              ],
              url: {
                raw: "{{baseUrl}}/auth/me",
                host: ["{{baseUrl}}"],
                path: ["auth", "me"]
              }
            }
          }
        ]
      },
      {
        name: "3. Accounts Management",
        item: [
          {
            name: "Get All Customer Accounts",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
              url: {
                raw: "{{baseUrl}}/accounts",
                host: ["{{baseUrl}}"],
                path: ["accounts"]
              }
            }
          },
          {
            name: "Get Account Details By ID",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
              url: {
                raw: "{{baseUrl}}/accounts/acc_sav_001",
                host: ["{{baseUrl}}"],
                path: ["accounts", "acc_sav_001"]
              }
            }
          },
          {
            name: "Open New Bank Account",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{authToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  accountType: "SAVINGS",
                  currency: "INR",
                  initialDeposit: 25000.00,
                  nickname: "Emergency Liquidity Reserve"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/accounts",
                host: ["{{baseUrl}}"],
                path: ["accounts"]
              }
            }
          },
          {
            name: "Freeze / Unfreeze Account",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{authToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  status: "ACTIVE"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/accounts/acc_sav_001/status",
                host: ["{{baseUrl}}"],
                path: ["accounts", "acc_sav_001", "status"]
              }
            }
          }
        ]
      },
      {
        name: "4. Fund Transfers (IMPS / NEFT / RTGS)",
        item: [
          {
            name: "Execute Fund Transfer (IMPS)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{authToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  sourceAccountId: "acc_sav_001",
                  destinationAccountNumber: "301928471920",
                  beneficiaryName: "Ananya Verma",
                  beneficiaryIfsc: "SBIN0000691",
                  beneficiaryBankCode: "State Bank of India",
                  transferMode: "IMPS",
                  amount: 15000.00,
                  description: "Family allowance",
                  idempotencyKey: "utr_" + Date.now()
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/transfers",
                host: ["{{baseUrl}}"],
                path: ["transfers"]
              }
            }
          }
        ]
      },
      {
        name: "5. Transaction History & Audit",
        item: [
          {
            name: "List Transactions with Filters",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
              url: {
                raw: "{{baseUrl}}/transactions?type=ALL&status=ALL&page=0&size=20",
                host: ["{{baseUrl}}"],
                path: ["transactions"],
                query: [
                  { key: "type", value: "ALL" },
                  { key: "status", value: "ALL" },
                  { key: "page", value: "0" },
                  { key: "size", value: "20" }
                ]
              }
            }
          },
          {
            name: "Get Account Statement",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
              url: {
                raw: "{{baseUrl}}/accounts/acc_chk_001/statement?startDate=2026-09-01&endDate=2026-10-15",
                host: ["{{baseUrl}}"],
                path: ["accounts", "acc_chk_001", "statement"],
                query: [
                  { key: "startDate", value: "2026-09-01" },
                  { key: "endDate", value: "2026-10-15" }
                ]
              }
            }
          }
        ]
      }
    ]
  };

  return JSON.stringify(collection, null, 2);
}
