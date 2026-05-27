# Harnexis Enterprise REST API Documentation

This document describes the routing layout, parameters, and models supporting the social media lead acquisition and AI outreach engine.

---

## 🔐 1. Authentication Layer

All endpoints outside of registration and login necessitate a JWT Access Token inside the headers:

`Authorization: Bearer <jwt_token>`

### POST `/api/auth/register`
Creates a teammate or administrator membership.
* **Payload**:
  ```json
  {
    "email": "teammate@harnexis.co",
    "password": "secure_password_string",
    "name": "Alex Rivera",
    "role": "TEAM_MEMBER"
  }
  ```
* **Success (201 Created)**:
  ```json
  {
    "id": "user-uuid-123",
    "email": "teammate@harnexis.co",
    "name": "Alex Rivera",
    "role": "TEAM_MEMBER"
  }
  ```

### POST `/api/auth/login`
Validates credentials and issues session pairs.
* **Payload**:
  ```json
  {
    "email": "teammate@harnexis.co",
    "password": "secure_password_string"
  }
  ```
* **Success (200 OK)**:
  ```json
  {
    "user": {
      "id": "user-uuid-123",
      "email": "teammate@harnexis.co",
      "name": "Alex Rivera",
      "role": "TEAM_MEMBER"
    },
    "accessToken": "ey...",
    "refreshToken": "ey..."
  }
  ```

---

## 👥 2. CRM Leads Management

### GET `/api/leads`
Retrieves lead records matching query tags.
* **Filters (Query Params)**:
  * `search`: Matches characters in name, company, bio, handle
  * `platform`: `linkedin` or `instagram`
  * `status`: `new`, `contacted`, `nurturing`, `converted`, `disqualified`

### POST `/api/leads`
Imports a prospects profile.
* **Payload**:
  ```json
  {
    "name": "Sarah Jenkins",
    "title": "Co-Founder",
    "company": "SaaSify",
    "platform": "linkedin",
    "handle": "sarah-jenkins-link",
    "email": "sarah@saasify.io",
    "bio": "Building AI-assisted widgets",
    "notes": "Met at SaaS-Con",
    "tags": ["SaaS", "Series A"]
  }
  ```

---

## 🤖 3. Cognitive AI Engine Services

### POST `/api/ai/generate-message`
Compiles highly personalized connection invitations or pitches with context-aware references.
* **Payload**:
  ```json
  {
    "name": "Sarah Jenkins",
    "title": "Co-Founder",
    "company": "SaaSify",
    "bio": "Building AI-assisted widgets",
    "platform": "linkedin",
    "type": "connection",
    "tone": "Casual",
    "instructions": "Mention our mutual connections"
  }
  ```
* **Success (200 OK)**:
  ```json
  {
    "text": "Hey Sarah, absolutely love your progress building SaaSify! Since you are focused on customer solutions, I wanted to connect..."
  }
  ```

### POST `/api/ai/generate-content`
Generates high-performing, copy-ready social publications with visual image suggestions.
* **Payload**:
  ```json
  {
    "topic": "Automating social pipeline mapping",
    "platform": "linkedin",
    "format": "Regular Post",
    "audience": "SaaS Founders"
  }
  ```
