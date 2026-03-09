# KReserve — Backend Documentation

## Overview

The backend is an **ASP.NET Core 8 Web API** that powers the KReserve workspace booking system.  
It provides JWT-authenticated REST endpoints for managing users, resources (meeting rooms, desks, equipment), and bookings.

| Item | Value |
|---|---|
| Runtime | .NET 8 |
| Database | SQLite via Entity Framework Core 8 |
| Auth | JWT Bearer — HS256, 24-hour expiry |
| Password hashing | BCrypt.Net-Next |
| API docs | Swagger UI at `http://localhost:5105/` |
| Default port | `5105` |

---

## Project Structure

```
SmartOfficeAPI/
├── Controllers/
│   ├── AuthController.cs       # Register / Login / Profile
│   ├── ResourceController.cs   # Resource CRUD + availability filter
│   ├── BookingController.cs    # Booking create / view / update / cancel
│   └── AdminController.cs      # Admin-only stats, all bookings, all users
├── Models/
│   ├── User.cs                 # Users table
│   ├── Resource.cs             # Resources table
│   └── Booking.cs              # Bookings table
├── DTOs/
│   ├── AuthDTOs.cs             # RegisterRequest, LoginRequest, AuthResponse
│   ├── ResourceDTOs.cs         # Create/UpdateResourceRequest, ResourceResponse
│   └── BookingDTOs.cs          # Create/UpdateBookingRequest, BookingResponse
├── Data/
│   └── AppDbContext.cs         # EF Core DbContext
├── Services/
│   ├── IAuthService.cs         # Auth interface
│   ├── AuthService.cs          # Register, Login, JWT generation
│   ├── IBookingService.cs      # Booking interface
│   └── BookingService.cs       # Create, cancel, update, conflict detection
├── Migrations/                 # EF Core migration files
├── Program.cs                  # DI setup, middleware pipeline, auto-seed
├── appsettings.json            # Connection string + JWT settings
└── SmartOffice.db              # SQLite database file (auto-created)
```

---

## Configuration (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=SmartOffice.db"
  },
  "JwtSettings": {
    "SecretKey": "SmartOfficeJwtSecretKey2026!KPMG@Secure#256BitToken",
    "Issuer":    "SmartOfficeAPI",
    "Audience":  "SmartOfficeClient",
    "ExpiryInHours": "24"
  }
}
```

---

## Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `Id` | int | PK, auto-increment |
| `Name` | string | Full name |
| `Email` | string | Unique, stored lowercase |
| `PasswordHash` | string | BCrypt hash |
| `Role` | string | `"Employee"` or `"Admin"` |
| `CreatedAt` | DateTime | UTC |

### Resource
| Field | Type | Notes |
|---|---|---|
| `Id` | int | PK, auto-increment |
| `Name` | string | e.g. "Board Room A" |
| `Type` | string | `"MeetingRoom"`, `"Desk"`, or `"Equipment"` |
| `Capacity` | int | Max occupancy |
| `Location` | string | e.g. "Floor 2" |
| `IsActive` | bool | Soft-delete flag |

### Booking
| Field | Type | Notes |
|---|---|---|
| `Id` | int | PK, auto-increment |
| `UserId` | int | FK → User |
| `ResourceId` | int | FK → Resource |
| `StartTime` | DateTime | UTC |
| `EndTime` | DateTime | UTC |
| `Status` | string | `"Active"` or `"Cancelled"` |
| `Notes` | string? | Optional freetext |
| `CreatedAt` | DateTime | UTC |

---

## Auto-Seed (on every startup)

If the database is empty, `Program.cs` seeds:

- **Admin account** — `admin@smartoffice.com` / `Admin@123`
- **9 sample resources**:
  - Board Room A (MeetingRoom, cap 20, Floor 1)
  - Meeting Room B (MeetingRoom, cap 10, Floor 2)
  - Meeting Room C (MeetingRoom, cap 6, Floor 3)
  - Desk D01, D02 (Desk, cap 1, Floor 1 – Open Space)
  - Desk D03 (Desk, cap 1, Floor 2 – Quiet Zone)
  - Projector P1 (Equipment, Floor 1 – Storage)
  - Projector P2 (Equipment, Floor 2 – Storage)
  - Video Conference Kit (Equipment, Reception)

---

## Authentication

All protected endpoints require the header:
```
Authorization: Bearer <JWT_TOKEN>
```

The token is obtained from `POST /api/auth/login` or `POST /api/auth/register`.  
Tokens expire after **24 hours**.

### Roles
| Role | Access |
|---|---|
| `Employee` | Own bookings only; browse resources |
| `Admin` | Full access — all bookings, all users, resource management |

---

## API Reference

### Auth — `POST /api/auth/...`

---

#### `POST /api/auth/register`
Create a new user account.

**Request body**
```json
{
  "name":     "Jane Smith",
  "email":    "jane@company.com",
  "password": "Secret123",
  "role":     "Employee"
}
```
> `role` accepts `"Employee"` (default) or `"Admin"`.

**Success — `201 Created`**
```json
{
  "id":    2,
  "name":  "Jane Smith",
  "email": "jane@company.com",
  "role":  "Employee",
  "token": "<JWT>"
}
```

**Error — `409 Conflict`**
```json
{ "message": "An account with this email already exists." }
```

---

#### `POST /api/auth/login`
Authenticate and receive a JWT.

**Request body**
```json
{
  "email":    "admin@smartoffice.com",
  "password": "Admin@123"
}
```

**Success — `200 OK`**
```json
{
  "id":    1,
  "name":  "Admin",
  "email": "admin@smartoffice.com",
  "role":  "Admin",
  "token": "<JWT>"
}
```

**Error — `401 Unauthorized`**
```json
{ "message": "Invalid email or password." }
```

---

#### `GET /api/auth/me` 🔒
Returns the currently authenticated user's profile (decoded from JWT).

**Success — `200 OK`**
```json
{
  "id":    "1",
  "name":  "Admin",
  "email": "admin@smartoffice.com",
  "role":  "Admin"
}
```

---

### Resources — `api/resources`

All resource endpoints require authentication (`🔒`).  
Create / Update / Delete additionally require the `Admin` role (`🛡`).

---

#### `GET /api/resources` 🔒
Return all **active** resources. Supports optional query-string filters.

**Query parameters**
| Param | Type | Description |
|---|---|---|
| `type` | string | Filter by resource type — `MeetingRoom`, `Desk`, or `Equipment` |
| `capacity` | int | Minimum capacity (inclusive) |
| `date` | date | Availability date — `YYYY-MM-DD` |
| `startTime` | time | Availability window start — `HH:mm` |
| `endTime` | time | Availability window end — `HH:mm` |

> When `date` + `startTime` + `endTime` are all provided, the endpoint excludes resources that have an active booking overlapping that window (conflict-aware availability filter).

**Success — `200 OK`**
```json
[
  {
    "id":       1,
    "name":     "Board Room A",
    "type":     "MeetingRoom",
    "capacity": 20,
    "location": "Floor 1",
    "isActive": true
  }
]
```

---

#### `GET /api/resources/{id}` 🔒
Return a single resource by ID.

**Success — `200 OK`** — same shape as the array item above.  
**Error — `404 Not Found`**

---

#### `POST /api/resources` 🔒🛡 *(Admin only)*
Create a new resource.

**Request body**
```json
{
  "name":     "Huddle Room D",
  "type":     "MeetingRoom",
  "capacity": 4,
  "location": "Floor 4"
}
```

**Success — `201 Created`** — returns the created `ResourceResponse`.  
**Error — `400 Bad Request`** if `name` or `type` is missing.

---

#### `PUT /api/resources/{id}` 🔒🛡 *(Admin only)*
Partial update — only supplied fields are changed.

**Request body** (all optional)
```json
{
  "name":     "Huddle Room D (Renamed)",
  "capacity": 6,
  "isActive": true
}
```

**Success — `200 OK`** — returns the updated `ResourceResponse`.  
**Error — `404 Not Found`**

---

#### `DELETE /api/resources/{id}` 🔒🛡 *(Admin only)*
**Soft delete** — sets `IsActive = false`. Existing bookings are preserved.

**Success — `200 OK`**
```json
{ "message": "'Board Room A' has been deactivated." }
```

---

### Bookings — `api/bookings`

All booking endpoints require authentication (`🔒`).

---

#### `POST /api/bookings` 🔒
Create a new booking. Includes **conflict detection** — returns an error if the resource is already booked for any overlapping time window.

**Request body**
```json
{
  "resourceId": 1,
  "startTime":  "2026-03-15T09:00:00Z",
  "endTime":    "2026-03-15T10:30:00Z",
  "notes":      "Quarterly review"
}
```

**Success — `201 Created`**
```json
{
  "id":               42,
  "userId":           3,
  "userName":         "Jane Smith",
  "userEmail":        "jane@company.com",
  "resourceId":       1,
  "resourceName":     "Board Room A",
  "resourceType":     "MeetingRoom",
  "resourceLocation": "Floor 1",
  "startTime":        "2026-03-15T09:00:00Z",
  "endTime":          "2026-03-15T10:30:00Z",
  "status":           "Active",
  "notes":            "Quarterly review",
  "createdAt":        "2026-03-09T08:00:00Z"
}
```

**Error — `400 Bad Request`**
```json
{ "message": "This resource is already booked for the selected time slot. Please choose a different time." }
```

Other validation errors: start ≥ end, booking in the past, inactive resource.

---

#### `GET /api/bookings/my` 🔒
Return all bookings belonging to the currently authenticated user, newest first.

**Success — `200 OK`** — array of `BookingResponse` objects.

---

#### `GET /api/bookings/{id}` 🔒
Return a single booking by ID.  
Employees can only retrieve their own bookings. Admins can retrieve any.

**Success — `200 OK`** — single `BookingResponse`.  
**Error — `403 Forbidden`** if an Employee tries to read another user's booking.  
**Error — `404 Not Found`**

---

#### `PUT /api/bookings/{id}` 🔒
Update the time window or notes of an **Active** booking owned by the caller. Includes conflict detection for the new time slot.

**Request body** (all optional)
```json
{
  "startTime": "2026-03-15T10:00:00Z",
  "endTime":   "2026-03-15T11:00:00Z",
  "notes":     "Updated agenda"
}
```

**Success — `200 OK`** — updated `BookingResponse`.  
**Error — `400 Bad Request`** for conflicts, cancelled bookings, or time validation failures.

---

#### `DELETE /api/bookings/{id}/cancel` 🔒
Cancel a booking. Employees can only cancel their own. Status changes to `"Cancelled"`.

**Success — `200 OK`**
```json
{ "message": "Booking cancelled successfully." }
```

**Error — `400 Bad Request`** if already cancelled or not authorised.

---

### Admin — `api/admin` 🔒🛡 *(Admin only)*

All endpoints under this prefix require the `Admin` role.

---

#### `GET /api/admin/stats`
Returns live system statistics for the admin dashboard.

**Success — `200 OK`**
```json
{
  "bookingsToday":          3,
  "totalActiveBookings":    12,
  "totalCancelledBookings": 4,
  "totalResources":         9,
  "totalEmployees":         5,
  "availableDesksToday":    2,
  "mostBookedResource":     "Board Room A",
  "mostBookedCount":        8
}
```

---

#### `GET /api/admin/bookings`
Return all bookings in the system, with optional filters.

**Query parameters**
| Param | Type | Description |
|---|---|---|
| `from` | DateTime | Filter bookings starting on or after this date/time |
| `to` | DateTime | Filter bookings starting on or before this date/time |
| `status` | string | `"Active"` or `"Cancelled"` |
| `userId` | int | Filter by user ID |
| `resourceId` | int | Filter by resource ID |

**Success — `200 OK`** — array of `BookingResponse`.

---

#### `DELETE /api/admin/bookings/{id}/cancel`
Force-cancel any booking regardless of owner.

**Success — `200 OK`**
```json
{ "message": "Booking cancelled successfully." }
```

---

#### `GET /api/admin/users`
Return all registered users with booking counts.

**Success — `200 OK`**
```json
[
  {
    "id":             2,
    "name":           "Jane Smith",
    "email":          "jane@company.com",
    "role":           "Employee",
    "createdAt":      "2026-03-01T00:00:00Z",
    "totalBookings":  5,
    "activeBookings": 2
  }
]
```

---

#### `GET /api/admin/resources`
Return all resources including **inactive** ones, with booking counts.

**Success — `200 OK`**
```json
[
  {
    "id":             1,
    "name":           "Board Room A",
    "type":           "MeetingRoom",
    "capacity":       20,
    "location":       "Floor 1",
    "isActive":       true,
    "totalBookings":  8,
    "activeBookings": 2
  }
]
```

---

## Error Response Shape

All error responses follow the same envelope:
```json
{ "message": "Human-readable error description." }
```

## HTTP Status Code Summary

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Validation / business logic error |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but insufficient role/ownership |
| `404` | Resource / booking not found |
| `409` | Conflict (e.g. duplicate email on register) |

---

## Running the Backend

```bash
cd SmartOfficeAPI
dotnet run
```

The API starts on **`http://localhost:5105`**.  
Swagger UI is available at the root: **`http://localhost:5105/`**

### First-time setup (migrations already applied)
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

The database file `SmartOffice.db` is created automatically in the project directory.
