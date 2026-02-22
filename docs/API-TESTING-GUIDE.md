# API Testing Guide

This guide provides cURL examples for testing every API Gateway endpoint.

## Prerequisites

- Gateway running on `http://localhost:3000`
- For protected endpoints, you need a valid JWT token

## Generate a Test JWT

```bash
# Using the private key from your RS256 keypair:
node -e "
const jwt = require('jsonwebtoken');
const fs = require('fs');
const key = fs.readFileSync('private.pem');
const token = jwt.sign(
  { sub: 'admin-123', email: 'admin@test.com', roles: ['admin'], permissions: [] },
  key,
  { algorithm: 'RS256', expiresIn: '1h' }
);
console.log(token);
"
```

Save the token:
```bash
export TOKEN="your-jwt-token-here"
export ADMIN_TOKEN="your-admin-jwt-token-here"
```

---

## Health Endpoints

### Liveness Probe
```bash
curl -s http://localhost:3000/health/live | jq
```

### Readiness Probe
```bash
curl -s http://localhost:3000/health/ready | jq
```

### Prometheus Metrics
```bash
curl -s http://localhost:3000/metrics
```

---

## Auth Endpoints

### Signup
```bash
curl -s -X POST http://localhost:3000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "StrongP@ss1",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City"
  }' | jq
```

### Login
```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "StrongP@ss1"
  }' | jq
```

### Validate Token
```bash
curl -s -X POST http://localhost:3000/v1/auth/validate-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "token": "'$TOKEN'"
  }' | jq
```

### Refresh Token
```bash
curl -s -X POST http://localhost:3000/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your-refresh-token"
  }' | jq
```

### Logout
```bash
curl -s -X POST http://localhost:3000/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## User Endpoints

### Get User Profile
```bash
curl -s http://localhost:3000/v1/users/user-123 \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Update User Profile
```bash
curl -s -X PUT http://localhost:3000/v1/users/user-123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "first_name": "Jane",
    "phone": "+9876543210"
  }' | jq
```

### Delete User (Admin Only)
```bash
curl -s -X DELETE http://localhost:3000/v1/users/user-123 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

## Video Endpoints

### List Videos
```bash
curl -s http://localhost:3000/v1/videos \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Upload Video (Admin Only)
```bash
curl -s -X POST http://localhost:3000/v1/videos/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "My Awesome Video",
    "description": "A great video",
    "source_url": "https://storage.example.com/videos/raw/video.mp4"
  }' | jq
```

### Get Stream URL
```bash
curl -s http://localhost:3000/v1/videos/video-123/stream-url \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Expected Response Format

All responses follow the `ApiResponse<T>` format:

```json
{
  "success": true,
  "message": "OK",
  "data": { ... },
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null,
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Postman

Import the Swagger spec from `http://localhost:3000/api-docs-json` into Postman for a ready-made collection.
