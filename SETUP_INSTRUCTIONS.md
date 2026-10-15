# FinCore — Indian Banking & Transaction Management System

A clean, modern, professional Indian internet banking and transaction management system designed for enterprise stability and domestic clearing standards.

## Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Line Icons, Vite.
- **Authoritative Backend**: Java 21 (LTS), Spring Boot 3.3.x, Spring MVC, Spring Data JPA, Hibernate, Spring Security 6 (Stateless JWT), Maven.
- **Database**: MySQL 8.0+ (InnoDB engine with `@Transactional` ACID compliance and `DECIMAL(15,2)` precision).
- **API Testing**: Postman Collection v2.1 (includes automated token extraction and test scripts for Indian banking endpoints).

---

## 1. Indian Banking Features

- **Domestic Payment Methods**:
  - **IMPS (Immediate Payment Service)**: Instant 24x7 real-time settlement up to ₹5,00,000 per transaction.
  - **NEFT (National Electronic Funds Transfer)**: 24x7 batch processing, no minimum or maximum limit.
  - **RTGS (Real Time Gross Settlement)**: High-value instant gross settlement (minimum ₹2,00,000).
- **Institutional Identifiers**:
  - **IFSC Code**: 11-character Indian Financial System Code format validator (e.g., `FINC0001004`, `SBIN0000691`, `HDFC0000060`).
  - **MICR Code & Branch**: Branch details for Connaught Place (New Delhi), Nariman Point (Mumbai), MG Road (Bengaluru).
  - **CIF (Customer Information File)**: Unique customer identification (`CIF88390192`).
- **Account Types**:
  - Savings Bank Account (3.50% p.a.)
  - Current Account (Business operations with overdraft buffer)
  - Term / Fixed Deposit Account (7.10% p.a.)
  - Corporate Salary Account
- **Currency & Formatting**:
  - Indian Rupee (₹) with Indian numbering format (e.g., `₹1,84,520.50`, `₹10,00,000.00`).
  - Date format: `DD Mon YYYY` (e.g., `15 Oct 2026`).
  - Masked account numbers by default (`XXXX-XXXX-8172`).

---

## 2. Running the Java Spring Boot Backend

### Prerequisites
- Java 21 JDK (`java -version`)
- Maven 3.9+ (`mvn -version`)
- MySQL 8.0+ running on `localhost:3306`

### Step 1: Database Setup
Run the MySQL script from the in-app **Java Backend Hub > Spring Boot Code & MySQL DDL > schema.sql**:
```bash
mysql -u root -p < schema.sql
```
This creates the `fincore_db` database and seeds default demonstration credentials:
- **Username / User ID**: `rohan.sharma`
- **Password**: `password123`
- **Customer CIF**: `CIF88390192`

### Step 2: Configure `application.yml`
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/fincore_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: YOUR_MYSQL_PASSWORD
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

fincore:
  security:
    jwt:
      secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
      expiration-ms: 86400000 # 24 hours
```

### Step 3: Launch Spring Boot
```bash
mvn clean install
mvn spring-boot:run
```
The frontend automatically detects when your Spring Boot server on `http://localhost:8080/api/v1` is online!

---

## 3. Postman API Testing

1. Open the FinCore app and click **"Java Backend"** in the top navigation bar.
2. Select the **Postman Collection Export** tab.
3. Click **"Download .postman_collection.json"**.
4. In Postman, click **Import** and select the downloaded file.
5. Run **Login (Rohan Sharma)**. The collection script automatically stores the Bearer JWT token in the `authToken` collection variable for all subsequent requests!
