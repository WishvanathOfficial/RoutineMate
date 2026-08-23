# RoutineMate — MVP-1 (Full-Stack Application)

[![Node.js](https://img.shields.io/badge/Node.js-v16%2B-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

> A full-stack habit tracking and routine management application built with React, TypeScript, Redux Toolkit, Express.js, and MySQL. This MVP demonstrates a modern, scalable architecture with comprehensive API integration, state management, and authentication.

**📚 Documentation:** For detailed architecture overview, see [ARCHITECTURE.md](docs/ARCHITECTURE.md). Feature specifications: [RoutineMate-Feature-Analysis.md](docs/RoutineMate-Product-Feature-Analysis.md) | [Prototype](docs/RoutineMate-MVP1-Prototype.html)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [API Integration](#api-integration)
- [Authentication & Security](#authentication--security)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Development Workflow](#development-workflow)
- [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Known Limitations](#known-limitations)
- [Future Roadmap](#future-roadmap)
- [License](#license)

---

## 📖 Overview

**RoutineMate** is a habit tracking and routine management application that helps users build and maintain healthy routines. The MVP-1 implements:

- **User Authentication**: Secure JWT-based authentication with token refresh
- **Routine Management**: Create, update, and track daily routines
- **Habit Logging**: Log daily habit completion with visual progress tracking
- **Dashboard**: Real-time overview of routine status and habit streaks
- **Statistics**: Analytics and charts for habit completion rates
- **Calendar View**: Visual representation of habit completion history
- **User Profiles**: Customizable user preferences and settings

This is a **full-stack monorepo** containing:
- 📱 **Frontend**: React + TypeScript + Redux Toolkit + Vite
- 🔌 **Backend**: Express.js + TypeScript + MySQL + Sequelize ORM

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Redux Toolkit | 1.9+ | State management |
| React Router | 6+ | Client-side routing |
| Axios | 1+ | HTTP client with interceptors |
| Vite | 4+ | Build tool & dev server |
| SCSS/CSS Modules | Latest | Styling with scoping |
| Jest | 29+ | Unit testing |
| React Testing Library | 14+ | Component testing |
| Chart.js | 4+ | Data visualization |
| Husky | 8+ | Git hooks |
| ESLint | 8+ | Code linting |
| Prettier | 3+ | Code formatting |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 16+ | JavaScript runtime |
| Express.js | 4.18+ | Web framework |
| TypeScript | 5 | Type safety |
| MySQL | 8+ | Relational database |
| Sequelize | 6+ | ORM & migrations |
| JWT | Latest | Token-based auth |
| Zod | 3+ | Schema validation |
| Bcryptjs | 2.4+ | Password hashing |
| Morgan | 1.10+ | HTTP logging |
| CORS | 2.8+ | Cross-origin requests |
| Jest | 29+ | Unit testing |

---

## ✅ Prerequisites

- **Node.js** v16.0.0 or higher
- **npm** v8.0.0 or higher (or yarn/pnpm)
- **MySQL** v8.0 or higher (for backend development)
- **Git** v2.0 or higher

**Verify installation:**
```bash
node --version    # Should be v16+
npm --version     # Should be v8+
mysql --version   # Should be v8+
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd RoutineMate-MVP1
```

### 2. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend Setup
Create `.env` file in root directory:
```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_ENV=development
```

#### Backend Setup
Create `.env` file in `backend/` directory:
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=routinemate_db
DB_USER=root
DB_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your_access_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### 4. Database Setup

#### Create MySQL Database
```bash
mysql -u root
CREATE DATABASE routinemate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Run Migrations
```bash
cd backend
npm run migrate
npm run seed  # Optional: Load seed data
```

### 5. Start Development Servers

**Terminal 1 - Frontend** (Vite dev server on port 5173):
```bash
npm run dev
```

**Terminal 2 - Backend** (Express server on port 5000):
```bash
cd backend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📁 Project Structure

### Root Level
```
RoutineMate-MVP1/
├── frontend files (index.html, vite.config.ts, tsconfig.json)
├── backend/              # Backend Express.js application
├── public/               # Static assets
├── src/                  # Frontend source code
├── docs/                 # Documentation
├── coverage/             # Test coverage reports
├── .husky/               # Git hooks
└── package.json          # Root workspace config
```

---

## 🎨 Frontend Architecture

### Directory Structure
```
src/
├── main.tsx                    # React root entry point
├── vite-env.d.ts               # Vite type definitions
├── api/                        # HTTP client layer
│   ├── httpClient.ts           # Axios instance with interceptors
│   ├── tokenStore.ts           # JWT token management
│   ├── apiResponse.ts          # Response wrapper types
│   └── apiError.ts             # Error handling
├── app/                        # Redux store & router
│   ├── store.ts                # Redux store configuration
│   ├── hooks.ts                # useAppDispatch, useAppSelector
│   ├── router.tsx              # React Router v6 config
│   ├── AuthSessionBridge.tsx    # Auth session initialization
│   └── ThemeSync.tsx            # Theme synchronization
├── layouts/
│   └── AppLayout/              # Main layout wrapper
├── components/                 # Shared UI components
│   ├── Button/
│   ├── Modal/
│   ├── Toast/
│   ├── Sidebar/
│   ├── Topbar/
│   ├── ProtectedRoute/         # Route guard component
│   └── ...
├── features/                   # Feature-based modules
│   ├── auth/                   # Authentication (login, register, logout)
│   ├── routines/               # Routine management
│   ├── dashboard/              # Dashboard overview
│   ├── stats/                  # Statistics & analytics
│   ├── calendar/               # Calendar view
│   ├── profile/                # User profile settings
│   ├── landing/                # Landing page
│   └── ui/                     # Cross-cutting UI state (theme, toasts, modals)
├── styles/                     # Global styles
│   ├── _variables.scss         # SCSS variables
│   ├── _mixins.scss            # SCSS mixins
│   └── global.scss             # Global styles
└── test/
    └── setupTests.ts           # Jest configuration
```

### Feature Module Pattern
Each feature (e.g., `auth`, `routines`) follows the "ducks" pattern:
```
src/features/<name>/
├── <name>.types.ts             # TypeScript interfaces & types
├── <name>.api.ts               # API layer with simulated delays
├── <name>.thunks.ts            # Redux async thunks
├── <name>.slice.ts             # Redux reducer + actions
├── <name>.selectors.ts         # Memoized selectors
├── <name>.module.scss           # Scoped styles
├── <Name>Page.tsx              # Route-level page component
├── components/                 # Feature-local components
└── __tests__/                  # Unit & integration tests
```

### State Management
- **Redux Toolkit** with 8 feature slices: `auth`, `ui`, `routines`, `dashboard`, `stats`, `calendar`, `profile`, `landing`
- **Typed Selectors**: Custom hooks `useAppDispatch` and `useAppSelector` with full TypeScript support
- **Async Thunks**: Async operations wrapped in Redux thunks with error handling
- **Normalized State**: Efficient state structure with selectors for derived data

---

## 🔌 Backend Architecture

### Directory Structure
```
backend/
├── src/
│   ├── app.ts                  # Express app configuration
│   ├── server.ts               # Server entry point
│   ├── config/
│   │   ├── database.ts         # Sequelize configuration
│   │   └── env.ts              # Environment variables
│   ├── models/                 # Sequelize models
│   │   ├── user.model.ts
│   │   ├── routine.model.ts
│   │   ├── habitLog.model.ts
│   │   ├── refreshToken.model.ts
│   │   └── index.ts
│   ├── migrations/             # Database migrations
│   ├── seeders/                # Database seeders
│   ├── routes/                 # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── routines.routes.ts
│   │   ├── calendar.routes.ts
│   │   └── ...
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── routines.controller.ts
│   │   └── ...
│   ├── services/               # Business logic
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── error.middleware.ts
│   ├── validators/             # Zod schemas
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utility functions
├── package.json
└── tsconfig.json
```

### Layered Architecture
```
HTTP Request
    ↓
Routes (auth.routes.ts)
    ↓
Middleware (auth, validation, CORS)
    ↓
Controllers (auth.controller.ts)
    ↓
Services (business logic)
    ↓
Models (Sequelize)
    ↓
MySQL Database
```

### Key Components

**Controllers** - Request/response handling
**Services** - Business logic, validations, transactions
**Models** - Sequelize ORM models with relationships
**Middleware** - Authentication, validation, error handling
**Routes** - HTTP endpoint definitions

---

## 🔐 Authentication & Security

### JWT Token Strategy
- **Access Token**: 15-minute expiration, used for API requests
- **Refresh Token**: 30-day expiration, stored in httpOnly cookies
- **Silent Refresh**: Automatic token refresh on expiration
- **Token Revocation**: Refresh tokens stored in database for invalidation

### Security Features
- ✅ bcryptjs password hashing (salted & rehashed)
- ✅ CORS enabled with specific origin whitelisting
- ✅ HttpOnly cookies prevent XSS attacks
- ✅ JWT signed with strong secrets
- ✅ Request validation with Zod schemas
- ✅ Error messages sanitized (no sensitive data leaked)
- ✅ SQL injection prevention via Sequelize ORM

### Protected Routes
Frontend `ProtectedRoute` component guards routes:
```typescript
<Route element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} path="/dashboard" />
```

Backend middleware validates JWT on protected endpoints:
```typescript
router.get('/profile', authMiddleware, profileController.getProfile);
```

---

## 📊 Database Schema

### Entity Relationship Diagram
```
Users (1)
├── (1:N) Routines
│   └── (1:N) Habit Logs
├── (1:1) User Preferences
└── (1:N) Refresh Tokens
```

### Core Tables

**users**
- PK: id (UUID)
- email (unique)
- password (hashed with bcrypt)
- name, created_at, updated_at, deleted_at (soft delete)

**routines**
- PK: id (UUID)
- FK: userId
- name, description, frequency
- created_at, updated_at, deleted_at

**habit_logs**
- PK: id (UUID)
- FK: routineId
- completed (boolean)
- logged_date
- created_at, updated_at

**user_preferences**
- PK: id (UUID)
- FK: userId (unique)
- theme, language, notifications_enabled
- created_at, updated_at

**refresh_tokens**
- PK: id (UUID)
- FK: userId
- token (hashed)
- expires_at
- created_at

---

## 🧪 Testing

### Frontend Testing

**Run tests:**
```bash
npm test                 # Run all tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

**Test Files:**
- Redux slice reducers: `features/<name>/__tests__/<name>.slice.test.ts`
- React components: `features/<name>/__tests__/<Name>Page.test.tsx`
- Selectors: Feature-specific selector tests

**Framework:** Jest + React Testing Library (RTL) on jsdom

**Note:** Chart.js canvases aren't fully testable in jsdom; those tests remain reducer-only.

### Backend Testing

**Run tests:**
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

**Test Structure:**
- Controller tests: `controllers/__tests__/`
- Integration tests for routes and middleware
- Mock database responses

**Framework:** Jest on Node.js environment

---

## 🎯 Available Scripts

### Frontend (Root Directory)

| Script | Command | Purpose |
|---|---|---|
| **dev** | `npm run dev` | Start Vite dev server (HMR enabled) |
| **build** | `npm run build` | TypeCheck + production build |
| **preview** | `npm run preview` | Preview production build locally |
| **lint** | `npm run lint` | Run ESLint |
| **lint:fix** | `npm run lint:fix` | Auto-fix linting issues |
| **format** | `npm run format` | Format code with Prettier |
| **format:check** | `npm run format:check` | Check formatting without changes |
| **test** | `npm test` | Run Jest tests |
| **test:watch** | `npm run test:watch` | Jest in watch mode |
| **test:coverage** | `npm run test:coverage` | Generate coverage report |
| **typecheck** | `npm run typecheck` | TypeScript type checking |

### Backend (`backend/` directory)

| Script | Command | Purpose |
|---|---|---|
| **dev** | `npm run dev` | Start dev server with hot reload |
| **start** | `npm start` | Start production server |
| **build** | `npm run build` | TypeScript compilation |
| **migrate** | `npm run migrate` | Run pending migrations |
| **seed** | `npm run seed` | Load seed data |
| **lint** | `npm run lint` | Run ESLint |
| **test** | `npm test` | Run Jest tests |
| **test:watch** | `npm run test:watch` | Jest in watch mode |

---

## 🔌 API Integration

### HTTP Client Setup
- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable
- **Axios Interceptors**: 
  - Request interceptor adds Authorization header
  - Response interceptor handles token refresh on 401
  - Error interceptor standardizes error responses

### Request/Response Format

**Success Response:**
```json
{
  "status": "success",
  "data": { /* payload */ },
  "message": "Operation completed"
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {}
  }
}
```

### API Endpoints

**Auth**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

**Routines**
- `GET /api/routines` - Get all routines
- `POST /api/routines` - Create routine
- `GET /api/routines/:id` - Get routine details
- `PUT /api/routines/:id` - Update routine
- `DELETE /api/routines/:id` - Delete routine

**Habit Logs**
- `GET /api/habits/logs` - Get logs for date range
- `POST /api/habits/logs` - Log habit completion
- `PUT /api/habits/logs/:id` - Update log

**Dashboard**
- `GET /api/dashboard` - Get dashboard data

**Statistics**
- `GET /api/stats` - Get habit statistics
- `GET /api/stats/trends` - Get trend data

**Profile**
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `GET /api/profile/preferences` - Get preferences
- `PUT /api/profile/preferences` - Update preferences

---

## ⚙️ Configuration

### Path Aliases
Configured in `tsconfig.json`, `vite.config.ts`, and `jest.config.js`:

```
@app/*       → src/app/
@components/* → src/components/
@features/*  → src/features/
@layouts/*   → src/layouts/
@styles/*    → src/styles/
@assets/*    → src/assets/
```

### Environment Variables

**Frontend (`.env` in root)**
- `VITE_API_BASE_URL` - Backend API endpoint
- `VITE_APP_ENV` - Environment name (development/staging/production)

**Backend (`backend/.env`)**
- `PORT` - Server port
- `NODE_ENV` - Environment
- `DB_*` - Database credentials
- `JWT_*` - JWT configuration
- `CORS_ORIGIN` - Frontend URL for CORS

---

## 👨‍💻 Development Workflow

### Typical Development Cycle

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Start Dev Servers**
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   cd backend && npm run dev
   ```

3. **Make Changes**
   - Frontend: Edit files in `src/`
   - Backend: Edit files in `backend/src/`
   - HMR (Hot Module Replacement) enabled on both

4. **Test Your Changes**
   ```bash
   npm test           # Frontend
   cd backend && npm test  # Backend
   ```

5. **Lint & Format**
   ```bash
   npm run lint:fix
   npm run format
   
   cd backend && npm run lint:fix
   ```

6. **Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   - **Husky** pre-commit hook automatically lints and formats staged files
   - **Commit Message Format**: Follow conventional commits

7. **Push & Create PR**
   ```bash
   git push origin feature/new-feature
   ```

---

## 🔍 Code Quality

### TypeScript
- Strict mode enabled
- No implicit any types
- Non-null assertions required
- Both frontend and backend use strict configuration

### Linting
- **ESLint** with React & TypeScript plugins
- Run: `npm run lint` or `npm run lint:fix`

### Formatting
- **Prettier** auto-formatting
- Run: `npm run format` or check with `npm run format:check`

### Pre-commit Hooks
- **Husky** + **lint-staged**: Automatically run linting and formatting on staged files
- Prevents commits with linting/formatting errors

### Testing
- **Jest** configured for both frontend and backend
- **React Testing Library** for component tests
- **Minimum Coverage Goal**: 70% statements, 60% branches

---

## 🚢 Deployment

### Frontend Build

```bash
npm run build
```

Creates optimized production bundle in `dist/`. Suitable for:
- Static hosting (Vercel, Netlify, AWS S3)
- Docker container
- CDN distribution

### Backend Deployment

```bash
cd backend
npm run build
npm start
```

Requirements:
- Node.js 16+ runtime
- MySQL database access
- Environment variables configured
- Port exposure (default 5000)

---

## 🔧 Troubleshooting

### Frontend Issues

**Port 5173 already in use:**
```bash
npm run dev -- --port 5174
```

**Module not found errors:**
- Clear cache: `rm -rf node_modules .vite && npm install`
- Check path aliases in `tsconfig.json`

**CORS errors:**
- Ensure `VITE_API_BASE_URL` matches backend URL
- Check backend `CORS_ORIGIN` env var

**TypeScript errors:**
```bash
npm run typecheck
```

### Backend Issues

**Database connection errors:**
- Verify MySQL is running: `mysql -u root`
- Check `DB_*` environment variables
- Ensure database exists: `CREATE DATABASE routinemate_db;`

**Port 5000 already in use:**
```bash
lsof -i :5000  # Find process
kill -9 <PID>  # Kill process
```

**JWT token issues:**
- Clear browser cookies
- Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set (min 32 chars)

---

## 🤝 Contributing

### Code Style Guide

1. **Naming Conventions**
   - Components: PascalCase (`UserProfile.tsx`)
   - Functions: camelCase (`handleUserUpdate()`)
   - Constants: UPPER_SNAKE_CASE (`JWT_EXPIRY`)
   - Types: PascalCase (`UserProfile`, `AuthState`)

2. **File Organization**
   - One component per file
   - Keep files under 300 lines
   - Co-locate tests next to implementation

3. **React Best Practices**
   - Functional components only
   - Use hooks for state management
   - Memoize expensive operations with `useMemo`/`useCallback`
   - Extract custom hooks for reusable logic

4. **TypeScript Best Practices**
   - No `any` types without explicit comment
   - Use `unknown` when type is truly unknown
   - Export interfaces from type files
   - Use discriminated unions for error types

### Pull Request Process

1. Fork and create feature branch
2. Make changes following code style guide
3. Add/update tests
4. Run full test suite: `npm test && cd backend && npm test`
5. Ensure all linting passes: `npm run lint`
6. Commit with conventional commits
7. Push and create pull request
8. Address review feedback

---

## ⚠️ Known Limitations

1. **Frontend API Mocking**: All backend calls currently use mocked API layer with simulated latency (`*.api.ts` files). Swap these for real HTTP calls when backend is ready.

2. **Dark Mode**: Dark mode toggles a `dark` class on `<html>`. Full per-component theming is not yet implemented.

3. **Chart.js Testing**: Statistics canvases aren't covered by React Testing Library tests (jsdom limitation). Tests remain reducer-only.

4. **Git Hooks**: Husky hooks configured but need to be tested end-to-end with `node_modules` present after first clone.

5. **Session Persistence**: Currently using in-memory seed data. No real backend persistence yet.

---

## 🗺️ Future Roadmap

### Phase 2 (MVP-2)
- [ ] Real backend integration (replace mock APIs)
- [ ] WebSocket support for real-time updates
- [ ] Offline-first PWA functionality
- [ ] Multi-device sync with conflict resolution
- [ ] Social features (share routines, friend routines)

### Phase 3 (MVP-3)
- [ ] Advanced analytics and insights
- [ ] AI-powered habit recommendations
- [ ] Mobile native apps (React Native)
- [ ] Routine templates and library
- [ ] Integration with external health apps

### Technical Improvements
- [ ] E2E testing (Playwright/Cypress)
- [ ] Performance monitoring (Sentry)
- [ ] Advanced caching strategies
- [ ] GraphQL API layer
- [ ] Kubernetes deployment configs

---

## 👤 Demo Credentials

**For Testing:**
- Email: `jane@example.com`
- Password: `password123`

Note: Uses in-memory seed data. Registration also works and persists for the session.

---

## 📚 Additional Resources

- [Detailed Architecture](docs/ARCHITECTURE.md)
- [Feature Specifications](docs/RoutineMate-Product-Feature-Analysis.md)
- [Prototype](docs/RoutineMate-MVP1-Prototype.html)
- [Database Design](docs/RoutineMate-MVP1-Database-Design.html)

---

## 📄 License

MIT License — see LICENSE file for details

---

## ✉️ Support

For issues, questions, or suggestions:
1. Check existing GitHub issues
2. Create a new issue with clear description
3. Contact: [team email or contact info]

---

**Last Updated**: August 23, 2026
**Version**: 1.0.0 (MVP-1)
**Maintainers**: RoutineMate Development Team
