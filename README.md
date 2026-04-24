# Smart Campus Operations Hub

**IT3030 – Programming Applications and Frameworks | 2026 Semester 1**

## Team Contributions

| Member | Module | Branch |
|--------|--------|--------|
| Member 1 | Module A – Facilities & Assets Catalogue | `feature/member1-facilities` |
| Member 2 | Module B – Booking Management | `feature/member2-bookings` |
| Member 3 | Module C – Maintenance & Incident Ticketing | `feature/member3-tickets` |
| Member 4 | Module D+E – Notifications & OAuth2 Auth | `feature/member4-notifications-auth` |

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.2, Spring Security, OAuth2, JWT, Spring Data JPA
- **Frontend**: React 18, Vite, Material UI, React Router v6, Axios
- **Database**: MySQL 8.0
- **CI/CD**: GitHub Actions

## Setup Instructions

### Prerequisites
- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Node.js 18+

### Backend Setup
```bash
cd backend
# Update src/main/resources/application.properties with your MySQL credentials
mvn spring-boot:run
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and the API at `http://localhost:8080`

## API Base URL

```
http://localhost:8080/api
```

## Branch Strategy

```
main            ← stable releases
  └── develop   ← integration branch
        ├── feature/member1-facilities
        ├── feature/member2-bookings
        ├── feature/member3-tickets
        └── feature/member4-notifications-auth
```
