# KReserve — Frontend Documentation

## Overview

The frontend is a **React 19 + Vite 7** single-page application styled with **Tailwind CSS 3**.  
It communicates with the ASP.NET Core backend via Axios, using a Vite dev-proxy to avoid CORS issues during development.

| Item | Value |
|---|---|
| Framework | React 19 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3 (indigo design system) |
| HTTP client | Axios (with JWT interceptor) |
| Routing | React Router DOM v6 |
| Icons | Lucide React |
| Dev port | `5173` |
| API proxy | `/api/*` → `http://localhost:5105` |

---

## Project Structure

```
frontend/
├── index.html                        # App shell — <title>KReserve</title>
├── vite.config.js                    # Vite + proxy configuration
├── tailwind.config.js                # Tailwind content paths
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx                      # React root — mounts <App />
    ├── index.css                     # Tailwind directives (@base / @components / @utilities)
    ├── App.jsx                       # Router, AuthProvider, all route definitions
    │
    ├── api/
    │   └── axios.js                  # Axios instance — base URL, JWT interceptor, 401 handler
    │
    ├── context/
    │   └── AuthContext.jsx           # Global auth state, login/logout, localStorage persistence
    │
    ├── components/
    │   ├── Navbar.jsx                # Top navigation bar (authenticated users only)
    │   └── ProtectedRoute.jsx        # Route guard — redirects unauthenticated / non-admin users
    │
    └── pages/
        ├── Landing.jsx               # Public landing / marketing page
        ├── Login.jsx                 # Sign-in form
        ├── Register.jsx              # Account creation form
        ├── Dashboard.jsx             # Employee home — stats + upcoming bookings
        ├── Resources.jsx             # Browse + filter resources; opens BookingModal
        ├── BookingModal.jsx          # Date/time picker modal for creating a booking
        ├── MyBookings.jsx            # Employee's own bookings list + cancel
        └── admin/
            ├── AdminDashboard.jsx    # Admin home — live stats + quick-action cards
            ├── AdminBookings.jsx     # All bookings table with filters + admin cancel
            ├── AdminResources.jsx    # Resource table + create/edit modal (CRUD)
            └── AdminUsers.jsx        # All users table with search
```

---

## Key Files In Detail

### `vite.config.js`
Configures the dev server and API proxy:
```js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5105',
      changeOrigin: true,
    },
  },
}
```
Every request made to `/api/*` is transparently forwarded to the backend. The React app never makes cross-origin calls — the browser always talks to `localhost:5173`.

---

### `src/api/axios.js`
A pre-configured Axios instance used by every page:

- **Base URL** — `/` (relative, so the Vite proxy handles routing)
- **Request interceptor** — attaches `Authorization: Bearer <token>` from `localStorage` on every outgoing request
- **Response interceptor** — on `401 Unauthorized`, clears `so_token` / `so_user` from `localStorage` and redirects to `/login`

```js
const api = axios.create({ baseURL: '/' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('so_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

---

### `src/context/AuthContext.jsx`
Provides global authentication state to the entire app via React Context:

| Export | Description |
|---|---|
| `AuthProvider` | Wraps the app; reads persisted auth from `localStorage` on mount |
| `useAuth()` | Hook that returns `{ user, login, logout }` |

**localStorage keys**
| Key | Value |
|---|---|
| `so_token` | Raw JWT string |
| `so_user` | JSON-serialized `AuthResponse` object |

**`login(userData)`** — stores `userData.token` and `userData` in localStorage, sets `user` state.  
**`logout()`** — clears both keys and sets `user` to `null`.

---

### `src/components/Navbar.jsx`
Renders only when a user is logged in (`if (!user) return null`).

- **Brand** — "KReserve" logo linking back to `/`
- **Employee links** — Dashboard, Browse Resources, My Bookings
- **Admin links** — Dashboard, All Bookings, Resources, Users
- **Active link** — highlighted with `bg-white/20` on indigo background
- **Logout** — calls `logout()` and navigates to `/`

---

### `src/components/ProtectedRoute.jsx`
Route guard component:
- If **not authenticated** → redirect to `/login`
- If `adminOnly={true}` and user is not Admin → redirect to `/dashboard`
- Otherwise → render `children`

---

## Routing (`src/App.jsx`)

| Path | Component | Auth required | Admin only |
|---|---|---|---|
| `/` | `Landing` | No | No |
| `/login` | `Login` | No (redirects to dashboard if logged in) | No |
| `/register` | `Register` | No (redirects to dashboard if logged in) | No |
| `/dashboard` | `Dashboard` | ✅ | No |
| `/resources` | `Resources` | ✅ | No |
| `/bookings` | `MyBookings` | ✅ | No |
| `/admin` | `AdminDashboard` | ✅ | ✅ |
| `/admin/bookings` | `AdminBookings` | ✅ | ✅ |
| `/admin/resources` | `AdminResources` | ✅ | ✅ |
| `/admin/users` | `AdminUsers` | ✅ | ✅ |
| `*` (catch-all) | redirect | — | — |

**Redirect logic** — logged-out users visiting `/` see the landing page. Attempting any protected route redirects to `/login`. Admins default-redirect to `/admin`; employees to `/dashboard`.

---

## Pages

### `Landing.jsx`
Public marketing page. Does not render the `Navbar` (handled separately).

**Sections**
1. **Sticky header** — KReserve logo + Sign In / Get Started buttons (or "Go to Dashboard" if already logged in)
2. **Hero** — gradient banner, tagline, two CTAs
3. **Stats bar** — "3 Types", "Real-time", "2 Roles"
4. **Feature grid** — 6 cards (Meeting Rooms, Hot Desks, Conflict Prevention, Availability Filter, Admin Dashboard, Role-Based Access)
5. **How it works** — 3-step visual guide
6. **CTA section** — final call-to-action
7. **Footer** — links to login/register

---

### `Login.jsx`
- POST `api/auth/login`
- On success: calls `login(data)` from `AuthContext`, then navigates to `/admin` or `/dashboard` based on role
- Displays demo credentials box: `admin@smartoffice.com / Admin@123`

---

### `Register.jsx`
- POST `api/auth/register`
- Fields: Full Name, Email, Password, Role (Employee / Admin)
- On success: redirects to `/login` after 2 seconds

---

### `Dashboard.jsx` *(Employee)*
- Fetches `GET /api/bookings/my`
- Displays three stat cards: **Upcoming Bookings**, **Today's Bookings**, **Total Active**
- Lists the next 6 upcoming active bookings with resource icon, location, and time
- Quick links: "Book a Resource" → `/resources`, "View All My Bookings" → `/bookings`

---

### `Resources.jsx` *(Employee)*
- Fetches `GET /api/resources` with query params built from filter state
- **Filter bar**: Type, Min. Capacity, Date, From Time, To Time
- Displays resources as cards; each card has a "Book Now" button
- Clicking "Book Now" opens `BookingModal` for that resource
- On successful booking: closes modal, re-fetches resources, shows success toast for 3s

---

### `BookingModal.jsx` *(Employee)*
- Modal overlay for creating a booking on a specific resource
- Fields: Date, Start Time, End Time, Notes (optional)
- POST `api/bookings`
- Calls `onBooked()` callback on success; `onClose()` on cancel

---

### `MyBookings.jsx` *(Employee)*
- Fetches `GET /api/bookings/my`
- Filter tabs: **All** / **Active** / **Cancelled**
- Each booking row shows: resource icon, name, location, type, time range, status badge
- **Cancel** button — DELETE `api/bookings/{id}/cancel` — only shown on Active bookings

---

### `AdminDashboard.jsx` *(Admin)*
- Fetches `GET /api/admin/stats`
- **Primary stat cards**: Bookings Today, Total Active, Cancelled, Desks Available Today
- **Secondary stat cards**: Total Resources, Total Employees, Most Booked Resource
- **Quick action cards**: links to `/admin/bookings`, `/admin/resources`, `/admin/users`

---

### `AdminBookings.jsx` *(Admin)*
- Fetches `GET /api/admin/bookings` with filters
- **Filter controls**: Status dropdown, From Date, To Date
- Renders a full-width table: User, Resource, Time, Status, Notes, Action
- Admin **Cancel** button — DELETE `api/admin/bookings/{id}/cancel`

---

### `AdminResources.jsx` *(Admin)*
- Fetches `GET /api/admin/resources` (includes inactive)
- Table: Name, Type, Capacity, Location, Status, Active/Total bookings, Actions
- **Add Resource** button opens `ResourceFormModal` in create mode
- **Edit** button opens `ResourceFormModal` in edit mode (prefilled)
- **Deactivate / Reactivate** toggles `IsActive` via PUT/DELETE

**`ResourceFormModal`** (inline component)
- Fields: Name, Type (select), Capacity, Location
- POST `api/resources` (create) or PUT `api/resources/{id}` (edit)

---

### `AdminUsers.jsx` *(Admin)*
- Fetches `GET /api/admin/users`
- Client-side search filter by name or email
- Table: Name (with initial avatar), Email, Role badge, Total Bookings, Active Now, Joined date

---

## State Management

There is no external state library. State is handled at two levels:

| Level | Mechanism | Used for |
|---|---|---|
| Global | React Context (`AuthContext`) | Auth token + user object |
| Local | `useState` / `useEffect` per page | API data, loading, filters, modals |

---

## API Calls — Quick Reference

| Page | Method | Endpoint |
|---|---|---|
| Login | POST | `/api/auth/login` |
| Register | POST | `/api/auth/register` |
| Dashboard | GET | `/api/bookings/my` |
| Resources | GET | `/api/resources?type=&capacity=&date=&startTime=&endTime=` |
| BookingModal | POST | `/api/bookings` |
| MyBookings | GET | `/api/bookings/my` |
| MyBookings (cancel) | DELETE | `/api/bookings/{id}/cancel` |
| AdminDashboard | GET | `/api/admin/stats` |
| AdminBookings | GET | `/api/admin/bookings?from=&to=&status=` |
| AdminBookings (cancel) | DELETE | `/api/admin/bookings/{id}/cancel` |
| AdminResources | GET | `/api/admin/resources` |
| AdminResources (create) | POST | `/api/resources` |
| AdminResources (edit) | PUT | `/api/resources/{id}` |
| AdminResources (toggle) | DELETE / PUT | `/api/resources/{id}` |
| AdminUsers | GET | `/api/admin/users` |

---

## Design System

| Token | Value |
|---|---|
| Primary colour | `indigo-600` / `indigo-700` |
| Background | `gray-50` (app), `white` (cards) |
| Border radius | `rounded-xl` (inputs, buttons), `rounded-2xl` (cards, panels) |
| Shadow | `shadow-sm` default, `shadow-md` on hover |
| Font size | `text-sm` for body, `text-2xl font-bold` for page headings |
| Icon library | Lucide React (consistent 14–22 px size) |

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app starts at **`http://localhost:5173`**.  
The backend must also be running at `http://localhost:5105` for API calls to work.

### Install dependencies (first time)
```bash
npm install
npm install axios react-router-dom lucide-react
```
