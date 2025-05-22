# API Documentation

## Authentication

All API endpoints require authentication using the `profile_id` header. The profile ID must be a valid user ID in the system.

```http
GET /api/endpoint
profile_id: 1
```

## Endpoints

### Contracts

#### Get Contract by ID
```http
GET /contracts/:id
```

Returns a specific contract if it belongs to the authenticated user.

**Response**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "ClientId": 1,
    "ContractorId": 5
  }
}
```

#### Get All Contracts
```http
GET /contracts
```

Returns a list of non-terminated contracts belonging to the authenticated user.

**Response**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "terms": "bla bla bla",
      "status": "in_progress",
      "ClientId": 1,
      "ContractorId": 5
    }
  ]
}
```

### Jobs

#### Get Unpaid Jobs
```http
GET /jobs/unpaid
```

Returns all unpaid jobs for active contracts belonging to the authenticated user.

**Response**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "description": "work",
      "price": 200,
      "paid": false,
      "ContractId": 1
    }
  ]
}
```

#### Pay for a Job
```http
POST /jobs/:job_id/pay
```

Pays for a job if the client has sufficient balance.

**Response**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "description": "work",
    "price": 200,
    "paid": true,
    "paymentDate": "2024-03-20T12:00:00.000Z",
    "ContractId": 1
  }
}
```

### Profile

#### Deposit Balance
```http
POST /balances/deposit/:userId
```

Deposits money into a client's balance. Cannot exceed 25% of total unpaid jobs.

**Request Body**
```json
{
  "amount": 100
}
```

**Response**
```json
{
  "status": "success",
  "message": "Deposit successful",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "balance": 1100,
    "type": "client"
  }
}
```

### Admin Endpoints

#### Get Best Profession
```http
GET /admin/best-profession?start=<date>&end=<date>
```

Returns the profession that earned the most money in the given date range.

**Query Parameters**
- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)

**Response**
```json
{
  "status": "success",
  "data": {
    "profession": "Programmer",
    "totalEarnings": 1000
  }
}
```

#### Get Best Clients
```http
GET /admin/best-clients?start=<date>&end=<date>&limit=<number>
```

Returns the best clients by payment amount in the given date range.

**Query Parameters**
- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)
- `limit`: Number of clients to return (default: 2)

**Response**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "fullName": "John Doe",
      "paid": 1000
    }
  ]
}
```

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "status": "error",
  "message": "Error message",
  "data": null
}
```

### Common Error Codes

- `400 Bad Request`: Invalid input or business rule violation
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP address.

## Response Headers

All responses include the following headers:
- `X-Request-ID`: Unique request identifier
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets 