# RoutineMate MVP1 Architecture Analysis

**Author:** Wishvanath Sah

## Overview
RoutineMate MVP1 is a full-stack web application built with a modern tech stack featuring a React frontend and Node.js/Express backend, both written in TypeScript. The application helps users manage and track their daily habits and routines with features like habit logging, progress tracking, calendar views, and statistics.

---

## 1. Frontend Architecture

### 1.1 Technology Stack
- **React** (v18.3.1): UI framework for building component-based interfaces
- **TypeScript** (v5.5.4): Type-safe development with strict mode enabled
- **Redux Toolkit** (v2.2.7): State management with simplified Redux patterns
- **React Router DOM** (v6.26.1): Client-side routing for navigation
- **Vite** (v5.4.1): Modern build tool and dev server (ESM-first)
- **SCSS/Sass** (v1.77.8): CSS preprocessing with variables and mixins
- **Axios** (v1.7.7): HTTP client with interceptors for API communication
- **Chart.js** (v4.4.4): Data visualization for statistics and analytics
- **Jest** (v29.7.0) + **React Testing Library** (v16.0.0): Testing framework
- **ESLint** (v8.57.0) + **Prettier** (v3.3.3): Code quality and formatting
- **Husky** (v9.1.4) + **lint-staged** (v15.2.9): Git hooks for commit quality

### 1.2 Project Structure

```
src/
├── api/                    # HTTP client and API integration layer
│   ├── httpClient.ts       # Axios instance with JWT interceptors & token refresh logic
│   ├── apiResponse.ts      # ApiEnvelope<T> type and unwrap() utility
│   ├── apiError.ts         # Error handling and API error types
│   ├── tokenStore.ts       # Local storage management for access tokens
│   └── env.ts              # API configuration (base URL, environment)
│
├── app/                    # Global app state and configuration
│   ├── store.ts            # Redux store configuration with all slices
│   ├── router.tsx          # React Router setup with route definitions
│   ├── hooks.ts            # useAppDispatch & useAppSelector typed hooks
│   ├── ThemeSync.tsx       # Theme synchronization logic
│   └── AuthSessionBridge.tsx # Session bootstrap and lifecycle management
│
├── components/             # Reusable UI components
│   ├── Button/             # Primary CTA button component
│   ├── Modal/              # Modal dialog wrapper
│   ├── ProgressRing/       # Circular progress indicator
│   ├── ProtectedRoute/     # Route guard for authenticated pages
│   ├── Sidebar/            # Navigation sidebar
│   ├── Switch/             # Toggle switch component
│   ├── Toast/              # Toast notification system
│   └── Topbar/             # App header/navigation bar
│
├── features/               # Feature-based modules (ducks pattern)
│   ├── auth/               # Authentication feature
│   ├── calendar/           # Calendar view feature
│   ├── dashboard/          # Dashboard/home feature
│   ├── landing/            # Landing page feature
│   ├── profile/            # User profile management
│   ├── routines/           # Routine CRUD and management
│   ├── stats/              # Statistics and analytics
│   └── ui/                 # Global UI state (theme, modals, toasts)
│
├── layouts/
│   └── AppLayout/          # Main app layout wrapper for authenticated pages
│
├── styles/                 # Global styles and design tokens
│   ├── _mixins.scss        # Reusable SCSS mixins
│   ├── _variables.scss     # CSS variables and design tokens
│   └── global.scss         # Global styles and resets
│
├── test/
│   └── setupTests.ts       # Jest test environment setup
│
└── main.tsx               # React app entry point
```

### 1.3 Feature Folder Structure (Ducks Pattern)

Each feature follows the "ducks" pattern for modular Redux organization:

```
features/auth/
├── LoginPage.tsx           # Login UI component
├── RegisterPage.tsx        # Registration UI component
├── auth.api.ts             # API calls (loginRequest, registerRequest, etc.)
├── auth.slice.ts           # Redux slice (reducers + state)
├── auth.thunks.ts          # Async thunks (loginUser, registerUser, etc.)
├── auth.types.ts           # TypeScript interfaces (AuthState, User, etc.)
├── auth.selectors.ts       # Selector functions for accessing state
├── auth.module.scss        # Feature-specific styles
└── __tests__/              # Unit and integration tests
```

**Redux Slices Defined in store.ts:**
- `auth`: User authentication and session state
- `ui`: Global UI state (theme, modal visibility, toasts)
- `routines`: Routines CRUD and list state
- `dashboard`: Dashboard data and summaries
- `stats`: Statistics and progress tracking
- `calendar`: Calendar view state and events
- `profile`: User profile data
- `landing`: Landing page state

### 1.4 Routing Configuration

**Router Setup** ([src/app/router.tsx](src/app/router.tsx)):
- Landing page: `/` (public)
- Auth pages: `/login`, `/register` (public)
- Protected routes wrapped in `<ProtectedRoute>`:
  - `/dashboard` - Main dashboard
  - `/routines` - Routines list
  - `/routines/:id` - Routine detail page
  - `/stats` - Statistics view
  - `/calendar` - Calendar view
  - `/profile` - User profile
- Catch-all: `*` redirects to `/`

**Route Protection:**
- `<ProtectedRoute>` component checks `auth.user` state
- Redirects unauthenticated users to login page
- Guards all routes under `<AppLayout />`

### 1.5 API Integration Patterns

**HTTP Client Setup** ([src/api/httpClient.ts](src/api/httpClient.ts)):

```typescript
httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // For httpOnly refresh-token cookie
  headers: { 'Content-Type': 'application/json' }
})
```

**Request Interceptor:**
- Attaches `Authorization: Bearer <accessToken>` header to all requests
- Token retrieved from localStorage via `getAccessToken()`

**Response Interceptor (Smart Refresh Logic):**
1. Detects 401 responses (token expired)
2. Implements concurrent request batching to prevent multiple refresh calls
3. Calls `/api/auth/refresh` using httpOnly cookie
4. On success: Updates access token and retries original request
5. On failure: Clears token, dispatches `SESSION_EXPIRED_EVENT`
6. Returns refreshed response or error

**API Response Envelope:**
```typescript
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
```

**Usage in Thunks:**
```typescript
export const loginUser = createAsyncThunk<AuthSession, LoginCredentials>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await loginRequest(credentials);  // Returns unwrapped data
    } catch (err) {
      return rejectWithValue(err?.message);
    }
  }
);
```

### 1.6 State Management (Redux Toolkit)

**Store Configuration:**
- Uses `configureStore()` from Redux Toolkit
- No middleware customization (uses defaults: thunk, immutability checks)
- All slices combined in single store

**Redux Slice Pattern:**
```typescript
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedOut(state) { /* sync mutations */ },
    sessionExpired(state) { /* handle session loss */ }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, ...)
      .addCase(loginUser.fulfilled, ...)
      .addCase(loginUser.rejected, ...)
  }
});
```

**Typed Hooks** ([src/app/hooks.ts](src/app/hooks.ts)):
```typescript
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

**Session Bootstrap:**
- `bootstrapSessionThunk` runs on app startup (via `AuthSessionBridge`)
- Attempts to restore session using httpOnly refresh cookie
- Sets `auth.initialized` flag after completion
- Never rejects (swallows failures gracefully)

### 1.7 Key npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:frontend` | Start Vite dev server on :5173 |
| `npm run dev:backend` | Start backend dev server |
| `npm run build` | Type-check + build with Vite |
| `npm run preview` | Preview production build |
| `npm run test` | Run Jest once |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run typecheck` | Run TSC type checking |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Prettier |

### 1.8 Vite Configuration

**Alias Paths:**
```typescript
'@api': 'src/api'
'@app': 'src/app'
'@components': 'src/components'
'@features': 'src/features'
'@layouts': 'src/layouts'
'@styles': 'src/styles'
'@assets': 'src/assets'
```

**SCSS Setup:**
- Modern Dart Sass compiler enabled
- Preprocessor options configured for performance

**Dev Server:**
- Port: 5173
- Auto-open: disabled
- CORS: configured to communicate with backend at :4000

### 1.9 Testing Strategy

**Jest Configuration** ([jest.config.js](jest.config.js)):
- Environment: jsdom (DOM simulation)
- Preset: ts-jest
- Module mapping for CSS (identity-obj-proxy) and path aliases
- Special env.jest.ts mock for import.meta.env
- Coverage collection excludes tests, types, and main.tsx

**Testing Libraries:**
- `@testing-library/react`: Component testing utilities
- `@testing-library/jest-dom`: DOM matchers
- `@testing-library/user-event`: User interaction simulation
- Organized in `__tests__` directories within features

---

## 2. Backend Architecture

### 2.1 Technology Stack
- **Node.js** with **Express.js** (v4.19.2): Web server framework
- **TypeScript** (v5.5.4): Type-safe server-side code
- **Sequelize** (v6.37.3): ORM for MySQL database
- **MySQL2** (v3.11.0): MySQL driver
- **JWT** (jsonwebtoken v9.0.2): Token-based authentication
- **bcryptjs** (v2.4.3): Password hashing
- **Zod** (v3.23.8): Schema validation
- **Helmet** (v7.1.0): HTTP security headers
- **CORS** (v2.8.5): Cross-Origin Resource Sharing
- **Morgan** (v1.10.0): HTTP request logging
- **Sequelize CLI** (v6.6.2): Database migrations and seeds
- **Jest** + **Supertest** (v7.0.0): API testing

### 2.2 Project Structure

```
backend/
├── src/
│   ├── app.ts                  # Express app factory
│   ├── server.ts               # Server bootstrap and entry point
│   │
│   ├── config/
│   │   ├── database.ts         # Sequelize instance and connection setup
│   │   └── env.ts              # Environment variable validation
│   │
│   ├── controllers/            # Request handlers for each resource
│   │   ├── auth.controller.ts
│   │   ├── routines.controller.ts
│   │   ├── calendar.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── stats.controller.ts
│   │   ├── profile.controller.ts
│   │   └── __tests__/
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.ts  # JWT verification and user attachment
│   │   ├── error.middleware.ts # Centralized error handling
│   │   ├── notFound.middleware.ts # 404 handler
│   │   └── validate.middleware.ts # Request body/params validation
│   │
│   ├── models/                 # Sequelize ORM models
│   │   ├── user.model.ts
│   │   ├── routine.model.ts
│   │   ├── habitLog.model.ts
│   │   ├── userPreferences.model.ts
│   │   ├── refreshToken.model.ts
│   │   └── index.ts            # Model exports and associations
│   │
│   ├── routes/                 # Route definitions
│   │   ├── index.ts            # Main router combining all routes
│   │   ├── auth.routes.ts      # Auth endpoints
│   │   ├── routines.routes.ts  # Routines CRUD endpoints
│   │   ├── calendar.routes.ts  # Calendar endpoints
│   │   ├── stats.routes.ts     # Statistics endpoints
│   │   ├── dashboard.routes.ts # Dashboard endpoints
│   │   └── profile.routes.ts   # Profile endpoints
│   │
│   ├── services/               # Business logic layer
│   │   ├── auth.service.ts     # Auth registration, login, token refresh
│   │   ├── routines.service.ts
│   │   ├── calendar.service.ts
│   │   ├── stats.service.ts
│   │   ├── dashboard.service.ts
│   │   └── profile.service.ts
│   │
│   ├── validators/             # Zod schema validation
│   │   └── auth.validator.ts   # RegisterInput, LoginInput schemas
│   │
│   ├── utils/                  # Utility functions
│   │   ├── ApiError.ts         # Custom error class with HTTP status
│   │   ├── ApiResponse.ts      # Standardized API response wrapper
│   │   ├── asyncHandler.ts     # Async/await error wrapper for middleware
│   │   ├── hash.ts             # SHA-256 hashing
│   │   ├── jwt.ts              # JWT signing/verification functions
│   │   ├── password.ts         # Password hashing with bcrypt
│   │   └── logger.ts           # Logging utility
│   │
│   ├── migrations/             # Database schema migrations
│   │   ├── 20260820000001-create-users.js
│   │   ├── 20260820000002-create-user-preferences.js
│   │   ├── 20260820000003-create-refresh-tokens.js
│   │   ├── 20260820000004-create-routines.js
│   │   └── 20260820000005-create-habit-logs.js
│   │
│   ├── seeders/                # Database seed data
│   │
│   └── types/                  # TypeScript type definitions
│       └── express.d.ts        # Augments Express Request with req.user
│
├── config/
│   └── config.js               # Sequelize config for CLI
│
├── scripts/
│   └── bootstrap.js            # Pre-migration bootstrap script
│
└── jest.config.js              # Jest testing configuration
```

### 2.3 Route Structure & API Endpoints

**Main Router** ([backend/src/routes/index.ts](backend/src/routes/index.ts)):
```typescript
router.use('/auth', authRoutes);           // /api/auth/*
router.use('/dashboard', dashboardRoutes); // /api/dashboard/*
router.use('/routines', routinesRoutes);   // /api/routines/*
router.use('/calendar', calendarRoutes);   // /api/calendar/*
router.use('/stats', statsRoutes);         // /api/stats/*
router.use('/profile', profileRoutes);     // /api/profile/*
```

**Authentication Endpoints** (auth.routes.ts):
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke refresh token

**Routines Endpoints** (routines.routes.ts):
- `GET /api/routines` - List user's routines
- `POST /api/routines` - Create new routine
- `GET /api/routines/:id` - Get routine details
- `PUT /api/routines/:id` - Update routine
- `DELETE /api/routines/:id` - Delete routine

**Other Resources:**
- `/api/calendar/*` - Calendar events and views
- `/api/stats/*` - Progress statistics and analytics
- `/api/dashboard/*` - Dashboard summaries
- `/api/profile/*` - User profile CRUD

### 2.4 Database Architecture

**Database: MySQL 8.0+**
- Charset: utf8mb4 (supports 4-byte Unicode including emojis)
- Collation: utf8mb4_unicode_ci

**Core Models:**

**1. Users Table**
```typescript
export class User extends Model {
  id: string (UUID, PK)
  name: string
  email: string (unique)
  passwordHash: string
  avatarUrl: string | null
  emailVerifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null (soft delete - paranoid: true)
}
```

**2. Routines Table** (MVP-1 core)
```typescript
export class Routine extends Model {
  id: string (UUID, PK)
  userId: string (FK -> users)
  name: string
  emoji: string (default: '✅')
  category: enum ('Health' | 'Mindfulness' | 'Learning' | 'Wellness' | 'Productivity')
  frequencyType: enum ('daily' | 'weekdays' | 'specific_days' | 'interval')
  frequencyConfig: JSON (flexible config for frequency)
  reminderType: enum ('time' | 'location')
  reminderTime: time | null
  reminderLocation: string | null
  targetValue: integer | null (quantified goals)
  targetUnit: string | null
  status: enum ('active' | 'paused' | 'archived')
  currentStreak: integer (days)
  longestStreak: integer (days)
  startDate: string
  endDate: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null (soft delete)
}
```

**3. Habit Logs Table**
- Tracks completions per routine
- Links routines to calendar view

**4. User Preferences Table**
- Stores user-specific settings
- Created automatically on signup

**5. Refresh Tokens Table**
- Stores token metadata for revocation
- Contains token hash, expiration, revocation status

**Key Design Features:**
- **Soft Deletes:** paranoid: true on User and Routine (keeps historical data)
- **Timestamps:** All tables have createdAt/updatedAt
- **UUID Primary Keys:** Better distribution than auto-increment
- **ENUM Fields:** Strictly typed frequency/reminder types
- **JSON Storage:** Flexible frequencyConfig for complex scheduling
- **Scopes:** User model has default scope excluding passwordHash

**Migrations:**
- 001: Create users table
- 002: Create user preferences table
- 003: Create refresh tokens table
- 004: Create routines table
- 005: Create habit logs table

### 2.5 Controllers & Services Pattern

**Layered Architecture:**
```
Routes -> Controllers -> Services -> Models -> Database
```

**Controller Example** ([auth.controller.ts](backend/src/controllers/auth.controller.ts)):
```typescript
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } = 
    await authService.register(req.body);
  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
  ApiResponse.created(res, { user, accessToken }, 'Account created');
});
```

**Service Example** ([auth.service.ts](backend/src/services/auth.service.ts)):
```typescript
export async function register(input: RegisterInput) {
  const existing = await User.findOne({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email already registered');
  
  const passwordHash = await hashPassword(input.password);
  const user = await sequelize.transaction(async (transaction) => {
    const created = await User.create({ ...input, passwordHash }, { transaction });
    await UserPreferences.create({ userId: created.id }, { transaction });
    return created;
  });
  
  return { user: toPublicUser(user), ...await issueTokenPair(user) };
}
```

**Key Patterns:**
- Services handle all business logic
- Controllers handle request/response
- `asyncHandler()` wrapper catches async errors
- Transactions for multi-step operations
- Clear separation of concerns

### 2.6 Authentication & Authorization

**JWT Token Strategy:**

1. **Access Token:**
   - Short-lived (default: 15 minutes)
   - Payload: `{ sub: userId, email }`
   - Sent in `Authorization: Bearer <token>` header
   - Stored in memory (frontend)

2. **Refresh Token:**
   - Long-lived (default: 30 days)
   - Payload: `{ sub: userId, tokenId }`
   - Stored in httpOnly, secure cookie
   - Browser sends automatically with CORS credentials

3. **Token Refresh Flow:**
   - Client detects 401 on expired access token
   - Frontend axios interceptor calls `POST /api/auth/refresh`
   - Backend verifies refresh token and issues new access token
   - New token returned in response body
   - Process repeats silently without user interaction

**Authorization:**

```typescript
// Middleware that requires valid access token
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }
  
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}
```

**Route Protection:**
- Protected routes use `requireAuth` middleware
- User ID extracted from token: `req.user.sub`
- Database queries filtered by `req.user.sub` (user isolation)

### 2.7 Middleware Stack

**Order in Express:**
```typescript
app.use(helmet());                    // Security headers
app.use(cors({ credentials: true })); // CORS with cookie support
app.use(express.json());              // JSON body parsing
app.use(express.urlencoded());        // URL-encoded parsing
app.use(cookieParser());              // Cookie parsing
app.use(morgan('dev'));               // HTTP logging (dev only)

app.get('/health', ...);              // Health check
app.use('/api', routes);              // API routes
app.use(notFoundHandler);             // 404 handling
app.use(errorHandler);                // Global error catching
```

**Error Handling Middleware:**
- Catches all thrown errors from async handlers
- Formats into standardized ApiResponse
- Returns appropriate HTTP status codes
- Logs errors in production

### 2.8 Configuration & Environment

**Environment Variables** ([config/env.ts](backend/src/config/env.ts)):
```typescript
NODE_ENV              // 'development' or 'production'
PORT                  // Server port (default: 4000)
DB_HOST               // MySQL hostname
DB_PORT               // MySQL port (default: 3306)
DB_NAME               // Database name (default: 'routinemate')
DB_USER               // MySQL user
DB_PASSWORD           // MySQL password
JWT_ACCESS_SECRET     // Secret for signing access tokens (required)
JWT_ACCESS_EXPIRES_IN // Access token TTL (default: '15m')
JWT_REFRESH_SECRET    // Secret for signing refresh tokens (required)
JWT_REFRESH_EXPIRES_IN// Refresh token TTL (default: '30d')
CORS_ORIGIN           // Allowed origin (default: 'http://localhost:5173')
```

**Validation:**
- `required()` function throws on missing critical env vars
- Fallbacks provided for non-critical vars
- Type-safe access via `env` singleton

**Sequelize Database Configuration:**
- Connection pooling: min=0, max=10
- Acquire timeout: 30s
- Idle timeout: 10s
- UTF8MB4 charset for emoji support

### 2.9 Key npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server with nodemon (watches src/) |
| `npm run build` | TypeScript compilation to dist/ |
| `npm run start` | Run compiled JS from dist/ |
| `npm run test` | Run Jest tests once |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run typecheck` | Run TSC type checking |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:undo` | Rollback last migration |
| `npm run db:seed` | Run all seeders |

### 2.10 Testing Strategy

**Jest Configuration** ([backend/jest.config.js](backend/jest.config.js)):
- Environment: node (not jsdom)
- Preset: ts-jest
- Test discovery: `**/__tests__/**/*.test.ts` or `**/*.test.ts`
- Coverage excludes: server.ts, migrations, seeders, models
- Verbose output enabled

**Testing Libraries:**
- Jest: Test runner and assertions
- Supertest (v7.0.0): HTTP assertion for API testing
- Organized in `__tests__` directories

**Example API Test:**
```typescript
import request from 'supertest';
import app from '../app';

describe('POST /api/auth/login', () => {
  it('should login user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
```

---

## 3. Technology Stack Summary

### Frontend Dependencies
| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| **Core** | react | 18.3.1 | UI framework |
| | react-dom | 18.3.1 | DOM rendering |
| | typescript | 5.5.4 | Type safety |
| **State** | @reduxjs/toolkit | 2.2.7 | Predictable state management |
| | react-redux | 9.1.2 | Redux bindings for React |
| **Routing** | react-router-dom | 6.26.1 | Client-side routing |
| **HTTP** | axios | 1.7.7 | Promise-based HTTP client |
| **Visualization** | chart.js | 4.4.4 | Charts and graphs |
| **Styling** | sass | 1.77.8 | CSS preprocessing |
| **Build** | vite | 5.4.1 | Fast build tool |
| | @vitejs/plugin-react | 4.3.1 | React plugin for Vite |
| **Linting** | eslint | 8.57.0 | Code quality |
| | @typescript-eslint/... | 7.16.1 | TS linting support |
| | prettier | 3.3.3 | Code formatting |
| **Testing** | jest | 29.7.0 | Test runner |
| | @testing-library/react | 16.0.0 | React component testing |
| **Git Hooks** | husky | 9.1.4 | Git lifecycle hooks |
| | lint-staged | 15.2.9 | Run linters on staged files |

### Backend Dependencies
| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| **Core** | express | 4.19.2 | Web server framework |
| | typescript | 5.5.4 | Type safety |
| **Database** | sequelize | 6.37.3 | ORM for MySQL |
| | mysql2 | 3.11.0 | MySQL driver |
| | sequelize-cli | 6.6.2 | Migration/seeding CLI |
| **Authentication** | jsonwebtoken | 9.0.2 | JWT tokens |
| | bcryptjs | 2.4.3 | Password hashing |
| **Security** | helmet | 7.1.0 | HTTP security headers |
| | cors | 2.8.5 | CORS middleware |
| | cookie-parser | 1.4.6 | Cookie parsing |
| **Validation** | zod | 3.23.8 | Schema validation |
| **Logging** | morgan | 1.10.0 | HTTP request logging |
| **Environment** | dotenv | 16.4.5 | .env file loading |
| **Utilities** | uuid | 9.0.1 | UUID generation |
| **Dev** | nodemon | 3.1.4 | Auto-reload on file changes |
| | ts-node | 10.9.2 | Direct TS execution |
| **Testing** | jest | 29.7.0 | Test runner |
| | supertest | 7.0.0 | HTTP testing library |
| | ts-jest | 29.2.3 | Jest + TypeScript |

---

## 4. Key Architectural Patterns & Decisions

### 4.1 Frontend Patterns

1. **Feature-Based Organization (Ducks):**
   - Each feature (auth, routines, etc.) is a self-contained module
   - Contains reducers, actions, API calls, components, types
   - Easy to split into separate bundles or microservices later
   - Clear dependencies between features

2. **Redux Middleware for API Calls:**
   - API calls abstracted into thunks
   - Services layer separate from components
   - Error handling centralized in reducer
   - Optimistic updates possible via action creators

3. **HTTP Interceptor Pattern:**
   - Single axios instance with request/response interceptors
   - Automatic JWT token injection
   - Silent token refresh on 401
   - No manual token management in components

4. **Protected Routes:**
   - Route guard component checks `auth.user` state
   - Unauthenticated users redirected to /login
   - Prevents access to sensitive pages

5. **Typed Redux Hooks:**
   - Custom `useAppDispatch` and `useAppSelector` hooks
   - Provides full type inference
   - No need for manual type annotations in components

### 4.2 Backend Patterns

1. **Service Layer Architecture:**
   - Controllers: Handle HTTP request/response
   - Services: Implement business logic
   - Models: Data access (Sequelize ORM)
   - Clear separation of concerns

2. **Error Handling Strategy:**
   - Custom `ApiError` class with HTTP status codes
   - `asyncHandler()` wrapper catches async errors
   - Centralized error middleware converts to responses
   - Consistent error response format

3. **Validation Pipeline:**
   - Zod schemas for request validation
   - Middleware validation before reaching controllers
   - Type-safe input with proper error messages

4. **JWT Token Strategy:**
   - Short-lived access tokens (in-memory)
   - Long-lived refresh tokens (httpOnly cookie)
   - Automatic token rotation on refresh
   - Database-backed token revocation

5. **Transaction Support:**
   - Multi-step operations wrapped in DB transactions
   - Ensures data consistency (e.g., user + preferences creation)
   - Automatic rollback on errors

6. **Database Modeling:**
   - Soft deletes (paranoid: true) preserve audit trail
   - UUID primary keys for better distribution
   - JSON columns for flexible configuration
   - Model scopes hide sensitive data by default

### 4.3 Full-Stack Patterns

1. **API Response Envelope:**
   - Every response wrapped in `{ success, message, data }`
   - Frontend has single place to unwrap
   - Consistent error format across all endpoints

2. **Type Safety Across Boundary:**
   - Backend generates TypeScript from Sequelize models
   - Frontend uses same types in Redux slices
   - API contracts enforced by types

3. **CORS with Credentials:**
   - Backend: `credentials: true` in CORS config
   - Frontend: `withCredentials: true` in axios
   - Enables httpOnly cookie transmission

4. **Concurrent Request Batching:**
   - Multiple simultaneous 401 responses share single refresh
   - Prevents thundering herd on token expiry
   - Improves performance under load

---

## 5. Development Workflow

### 5.1 Setup

```bash
npm run setup  # Install all dependencies (root + backend)
```

### 5.2 Development

```bash
npm run dev           # Start frontend + backend concurrently
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- API: http://localhost:4000/api

### 5.3 Database

```bash
npm run db:migrate           # Run migrations
npm run db:migrate:undo      # Rollback last migration
npm run db:migrate:undo:all  # Rollback all migrations
npm run db:seed              # Run seeders
```

### 5.4 Testing

```bash
npm run test              # Run all tests once
npm run test:watch       # Watch mode for frontend/backend
npm run test:coverage    # Generate coverage reports
```

### 5.5 Code Quality

```bash
npm run lint         # Check both frontend and backend
npm run lint:fix     # Auto-fix issues
npm run format       # Format code with Prettier
npm run typecheck    # Full type checking
```

### 5.6 Building

```bash
npm run build        # Frontend: TypeScript + Vite
cd backend
npm run build        # Backend: TypeScript compilation
npm run start        # Run compiled backend
```

---

## 6. API Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Account created",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null
}
```

**HTTP Status Codes:**
- 200 OK: Successful GET/PUT/POST
- 201 Created: Resource created
- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing/invalid token
- 404 Not Found: Resource not found
- 409 Conflict: Email already exists
- 500 Internal Server Error: Server error

---

## 7. Security Considerations

### Frontend
1. **Token Storage:** Access tokens in memory (cleared on refresh)
2. **Refresh Token:** httpOnly cookie (inaccessible to JavaScript)
3. **CSRF Protection:** Built into httpOnly cookies
4. **XSS Prevention:** React escapes content by default
5. **Route Guards:** Protected routes check authentication state

### Backend
1. **Password Security:** bcryptjs with salting
2. **Token Signing:** HMAC-SHA256 with strong secrets
3. **Token Revocation:** Refresh tokens tracked in database
4. **Soft Deletes:** User data preserved for audit trails
5. **SQL Injection:** Sequelize parameterized queries
6. **HTTP Security:** Helmet headers, CORS validation
7. **Rate Limiting:** (Future enhancement)

---

## 8. Future Enhancements & Scalability

### Frontend
- [ ] Offline-first with service workers
- [ ] Analytics integration
- [ ] Advanced data visualization
- [ ] Mobile app (React Native)
- [ ] Internationalization (i18n)
- [ ] Code splitting by route

### Backend
- [ ] WebSocket support for real-time updates
- [ ] Caching layer (Redis)
- [ ] File upload handling
- [ ] Email notifications
- [ ] Background jobs (Bull/Agenda)
- [ ] API rate limiting
- [ ] GraphQL option

### Infrastructure
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Load balancing
- [ ] Database replication
- [ ] CDN for static assets
- [ ] Monitoring & logging (APM)

---

## 9. Documentation References

- **Database Design:** [docs/RoutineMate-MVP1-Database-Design.html](docs/RoutineMate-MVP1-Database-Design.html)
- **API Integration Plan:** [docs/RoutineMate-Frontend-Backend-Integration-Plan.md](docs/RoutineMate-Frontend-Backend-Integration-Plan.md)
- **Postman Collection:** [backend/postman/RoutineMate.postman_collection.json](backend/postman/RoutineMate.postman_collection.json)
- **Postman Environment:** [backend/postman/RoutineMate.postman_environment.json](backend/postman/RoutineMate.postman_environment.json)

---

## 10. Summary of Architectural Strengths

✅ **Type Safety:** Full TypeScript across frontend and backend
✅ **Separation of Concerns:** Clean layering (UI → State → API → Services → Database)
✅ **Scalability:** Feature-based organization allows independent scaling
✅ **Security:** JWT tokens, password hashing, soft deletes, CORS
✅ **Developer Experience:** Fast builds (Vite), hot reloading, comprehensive tooling
✅ **Testability:** Jest setup with mocking capabilities on both sides
✅ **Maintainability:** Clear patterns (ducks, services, middleware), consistent naming
✅ **Code Quality:** ESLint, Prettier, Husky, TypeScript strict mode
✅ **API Design:** Consistent response envelopes, meaningful error messages
✅ **Token Strategy:** Secure refresh token rotation with silent failures

---

**Last Updated:** 2026-08-23
**Author:** Wishvanath Sah
