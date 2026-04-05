# Finance Data Processing and Access Control Backend

A Node.js/Express RESTful API backend for a finance dashboard system with role-based access control, financial records management, and dashboard analytics.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Rate Limiting:** express-rate-limit
- **Testing:** Jest

## Project Structure

```
finance-backend/
├── backend/
│   ├── server.js                  # Entry point - server setup & route mounting
│   ├── app.js                     # Express app instance
│   ├── .env                       # Environment variables
│   └── src/
│       ├── config/
│       │   └── db.js              # MongoDB connection
│       ├── controllers/
│       │   ├── auth.controller.js # Register & Login logic
│       │   ├── record.controller.js # Financial records CRUD + pagination + search
│       │   ├── summary.controller.js # Dashboard summary & analytics
│       │   └── user.controller.js # User management (admin)
│       ├── middleware/
│       │   ├── auth.js            # JWT authentication middleware
│       │   ├── role.js            # Role-based authorization middleware
│       │   └── rateLimiter.js     # Rate limiting middleware
│       ├── models/
│       │   ├── user.model.js      # User schema (with soft delete)
│       │   └── record.model.js    # Record schema (with soft delete)
│       └── routes/
│           ├── auth.routes.js     # POST /register, /login
│           ├── record.routes.js   # CRUD for financial records
│           ├── summary.routes.js  # Dashboard analytics endpoints
│           └── user.routes.js     # Admin user management endpoints
├── tests/
│   ├── auth.test.js               # Auth middleware unit tests
│   ├── role.test.js               # Role middleware unit tests
│   ├── record.test.js             # Record controller unit tests
│   └── user.test.js               # User controller unit tests
└── package.json
```

## Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB instance)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd finance-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Edit `backend/.env` with your values:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

5. The server will start at `http://localhost:5000`

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

### 1. Auth Routes (`/api/auth`)

| Method | Endpoint    | Access | Description         |
|--------|-------------|--------|---------------------|
| POST   | `/register` | Public | Register a new user |
| POST   | `/login`    | Public | Login & get JWT     |

**POST `/api/auth/register`**
```json
{
  "name": "Tanmay",
  "email": "tanmay@example.com",
  "password": "password123",
  "role": "admin"
}
```
> `role` is optional. Defaults to `"viewer"`. Valid values: `viewer`, `analyst`, `admin`

**POST `/api/auth/login`**
```json
{
  "email": "tanmay@example.com",
  "password": "password123"
}
```
> Returns a JWT token and user info on success.

---

### 2. Financial Records (`/api/records`)

| Method | Endpoint          | Access         | Description                  |
|--------|-------------------|----------------|------------------------------|
| POST   | `/create`         | Admin          | Create a new financial record|
| GET    | `/`               | Admin, Analyst | Get all records (with filters)|
| GET    | `/:id`            | Admin, Analyst | Get a single record by ID    |
| PUT    | `/:id`            | Admin          | Update a record              |
| DELETE | `/:id`            | Admin          | Delete a record              |

**POST `/api/records/create`**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "salary",
  "date": "2026-04-01",
  "note": "April salary"
}
```

**GET `/api/records` — with Pagination, Filtering & Search**
```
GET /api/records?type=income&category=salary&page=1&limit=10
GET /api/records?search=food&page=2&limit=5
GET /api/records?startDate=2026-01-01&endDate=2026-12-31
```
> Supports: `type`, `category`, `startDate`, `endDate`, `search` (searches category & note), `page` (default: 1), `limit` (default: 10)

Paginated response example:
```json
{
  "count": 5,
  "total": 25,
  "page": 1,
  "totalPages": 3,
  "data": [ ... ]
}
```

---

### 3. Dashboard Summary (`/api/summary`)

| Method | Endpoint    | Access              | Description                       |
|--------|-------------|---------------------|-----------------------------------|
| GET    | `/income`   | Admin, Analyst, Viewer | Total income                    |
| GET    | `/expense`  | Admin, Analyst, Viewer | Total expenses                  |
| GET    | `/balance`  | Admin, Analyst, Viewer | Net balance (income - expense)  |
| GET    | `/category` | Admin, Analyst, Viewer | Category-wise breakdown         |
| GET    | `/recent`   | Admin, Analyst, Viewer | Last 10 recent transactions     |
| GET    | `/trends`   | Admin, Analyst, Viewer | Monthly income vs expense trends|

---

### 4. User Management (`/api/users`)

| Method | Endpoint | Access | Description              |
|--------|----------|--------|--------------------------|
| GET    | `/`      | Admin  | Get all users            |
| GET    | `/:id`   | Admin  | Get a single user by ID  |
| PUT    | `/:id`   | Admin  | Update user role/status  |
| DELETE | `/:id`   | Admin  | Delete a user            |

**PUT `/api/users/:id`**
```json
{
  "role": "analyst",
  "status": "inactive"
}
```

---

## Role-Based Access Control

The system enforces three roles with different permission levels:

| Feature                | Viewer | Analyst | Admin |
|------------------------|--------|---------|-------|
| View Dashboard Summary | ✅     | ✅      | ✅    |
| View Financial Records | ❌     | ✅      | ✅    |
| Create/Edit/Delete Records | ❌ | ❌      | ✅    |
| Manage Users           | ❌     | ❌      | ✅    |

- **Viewer:** Can only view dashboard summaries (income, expense, balance, trends)
- **Analyst:** Can view summaries + access detailed financial records
- **Admin:** Full access — manage records, users, roles, and view everything

### Additional Security
- Inactive users (`status: "inactive"`) are automatically blocked from accessing any route, even with a valid token.
- Passwords are hashed using bcryptjs before storage.
- JWT tokens expire after 24 hours.
- **Rate Limiting:** General API endpoints allow 100 requests per 15 minutes per IP. Auth endpoints (login/register) are stricter at 20 requests per 15 minutes to prevent brute-force attacks.
- **Soft Delete:** Users and records are never permanently deleted. Instead, they are marked with `isDeleted: true` and excluded from all queries and aggregations.

---

## Validation & Error Handling

The API validates all inputs and returns consistent error responses:

- **400** — Bad Request (missing fields, invalid values)
- **401** — Unauthorized (missing or invalid token)
- **403** — Forbidden (insufficient role or inactive account)
- **404** — Not Found (record/user doesn't exist)
- **500** — Internal Server Error

Example error response:
```json
{
  "message": "Invalid type. Must be 'income' or 'expense'"
}
```

---

## Assumptions & Design Decisions

1. **User registration is public** — any user can register with a default role of `viewer`. An admin can later upgrade their role.
2. **Financial records are global** — all records belong to the organization, not individual users. The `createdBy` field tracks who created each record.
3. **MongoDB Atlas** is used for cloud-hosted persistence. Can be swapped for a local MongoDB instance.
4. **Token-based auth** — JWT tokens are sent in the `Authorization` header. No session/cookie management needed.
5. **Soft delete** — records and users are never permanently removed from the database; they are marked as deleted and hidden from all API responses and aggregations.
6. **Pagination defaults** — page defaults to 1, limit defaults to 10 records per page.

---

## Running Tests

```bash
npm test
```

The test suite includes **34 unit tests** covering:
- Auth middleware (JWT validation, inactive user blocking, Bearer token parsing)
- Role middleware (role-based access allow/deny)
- Record controller (CRUD, validation, pagination, search, soft delete)
- User controller (CRUD, validation, soft delete)

---

## Implemented Optional Enhancements

- [x] Authentication using JWT tokens
- [x] Pagination for record listing (`?page=1&limit=10`)
- [x] Search support (`?search=keyword` searches category & note)
- [x] Soft delete for records and users
- [x] Rate limiting (100 req/15min general, 20 req/15min for auth)
- [x] Unit tests (34 tests with Jest)
- [x] API documentation (this README)

## Future Enhancements

- [ ] Swagger/OpenAPI interactive documentation
- [ ] Email verification on registration
- [ ] Integration tests with real database
