# Personal OS — Full-Stack Productivity App

A MERN-stack personal productivity platform.  
**Three surfaces share one MongoDB Atlas database and one Express REST API.**

| Surface | Tech | Folder | Deploy |
|---------|------|--------|--------|
| Backend API | Express + Mongoose | `server/` | Render — `https://personal-os-c6lc.onrender.com` ✅ LIVE |
| Web Dashboard | React 18 + Vite + TailwindCSS | `client/` | Vercel (deploy pending) |
| iPhone App | Expo React Native | `app-frontend/` | Expo Go / expo publish |
| Database | MongoDB Atlas M0 | — | Shared by all surfaces |

---

## 📁 Repository Structure

```
/expense-tracker
  /server           Express + Mongoose backend
  /client           React + Vite web dashboard
  /app-frontend     Expo React Native iPhone app
  render.yaml       Render auto-deploy config
  HOSTING.md        Step-by-step deployment guide
  reference.md      Auto-generated Mongoose model reference
  README.md         ← You are here (primary AI reference)
```

---

## ⚙️ Environment Variables

### `server/.env`
```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb+srv://raghavbagdi:raghavbagdi@cluster0.kw23fnl.mongodb.net/personal-os?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=sFmYHlt/Y/Ki772xq1GrX7GmUVCGr6q2ICdIEr8Wilm7BfAt8S5f35DwKJi+ltIfkxqlm07JIOK+PkFIeievaw==
JWT_REFRESH_SECRET=5UMyNo/qnbxBTrkA+4bLgMi6dXVFngjCOesq9paxvJK/JVkhMmDzRXkGGXwXLlb7A3qYujOTe3i+qZE9NaypmQ==
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173
BCRYPT_ROUNDS=12
VAPID_EMAIL=mailto:raghavbagdi@example.com
VAPID_PUBLIC_KEY=<generate with web-push>
VAPID_PRIVATE_KEY=<generate with web-push>
```
> **Production (Render):** All secrets already set in Render Dashboard → Environment. Never commit `.env`.

### `client/.env.local`
```env
VITE_API_URL=http://localhost:8000/api/v1
```
`client/.env.production` points to the Render URL. Vercel auto-picks it up on deploy.

### `app-frontend` (Expo)
```bash
# Local dev — use Mac LAN IP so iPhone can reach backend
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api/v1 npx expo start
# Production: falls back to app.config.js → 'https://personal-os-c6lc.onrender.com/api/v1'
```

---

## 🛠 Running Locally

```bash
# 1. Backend
cd server && npm install && npm run dev        # :8000

# 2. Web Frontend
cd client && npm install && npm run dev        # :5173

# 3. iPhone App (same Wi-Fi as Mac)
cd app-frontend && npm install
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api/v1 npx expo start
```

---

## 🗄 Database Models

All models live in `server/src/models/`. See `reference.md` for field-level detail.

| Model | File | Purpose |
|-------|------|---------|
| `User` | `User.js` | Auth, profile (name, email, password hash, currency=INR, timezone=Asia/Kolkata, monthlyBudget, refreshToken) |
| `Expense` | `Expense.js` | Expenses / income / investments. Types: `expense`, `income`, `investment`. Supports recurring, split, reimbursement, sub-items |
| `Budget` | `Budget.js` | Monthly per-category budget limits. One doc per user+month+year (unique index) |
| `Goal` | `Goal.js` | Savings goals with `savedAmount`, `targetAmount`, `progressPercent` virtual |
| `HabitLog` | `HabitLog.js` | Daily/weekly habits. Tracks `currentStreak`, `longestStreak`, `completedDates[]` |
| `Note` | `Note.js` | Rich-text notes, pinnable, optionally linked to a `PlacementTopic` |
| `PlacementTopic` | `PlacementTopic.js` | DSA/OOPS/DBMS/CN/OS/SystemDesign study topics. Tracks mastery, revision, Striver/Blind75/NeetCode sheets |
| `PlacementProgress` | `PlacementProgress.js` | Per-question status (`todo`/`solving`/`done`/`revise`) for placement sheets |
| `PomodoroSession` | `PomodoroSession.js` | Focus/break timer sessions. Types: `focus`, `short-break`, `long-break` |
| `TodoTask` | `TodoTask.js` | Tasks. Priority P1–P4, statuses `todo`/`inprogress`/`blocked`/`done`, segments `work`/`student`, sub-tasks, reminder |
| `CalendarEvent` | `CalendarEvent.js` | Calendar events with type (standup/1on1/meeting/call/deadline/personal/other), reminders[] |
| `SleepLog` | `SleepLog.js` | One sleep log per day per user. `sleepTime`, `wakeTime`, `durationMinutes`, `quality` (1–5) |
| `DailyReview` | `DailyReview.js` | End-of-day review. Fields: `intention`, `accomplishments`, `improvements`, `dayRating` (1–5). One per day |
| `InternshipConfig` | `InternshipConfig.js` | Stores internship `companyName`, `role`, `startDate`, `endDate` — used on Today dashboard |
| `PushSubscription` | `PushSubscription.js` | Web Push API subscription objects per user (for browser notifications) |

---

## 🔌 API Routes

Base URL: `/api/v1`  
All routes (except `/auth/...`) require `Authorization: Bearer <accessToken>` header.

### Auth — `/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register user |
| POST | `/login` | Login → returns `accessToken` (cookie) + `refreshToken` (cookie) |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout (clear cookies) |
| GET  | `/me` | Get current user profile |
| PATCH | `/me` | Update profile (name, currency, timezone, monthlyBudget, avatar) |
| PATCH | `/me/password` | Change password |

### Expenses — `/expenses`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create expense/income/investment |
| GET  | `/` | List (query: `type`, `category`, `startDate`, `endDate`, `search`, `page`, `limit`) |
| GET  | `/dashboard` | Monthly summary: total income/expenses/investments, top categories, recent |
| GET  | `/analytics/monthly` | Monthly breakdown by category (query: `year`, `month`) |
| GET  | `/analytics/yearly` | Yearly breakdown (query: `year`) |
| PATCH | `/:id` | Update |
| DELETE | `/:id` | Delete |
| POST | `/recurring/process` | Trigger recurring expense generation (cron-safe) |

### Budgets — `/budgets`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get budget for month/year (query: `month`, `year`) |
| PUT | `/` | Upsert budget |

### Goals — `/goals`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create goal |
| GET | `/` | List goals |
| PATCH | `/:id` | Update goal (also to add contribution: send `savedAmount`) |
| DELETE | `/:id` | Delete goal |

### Placement — `/placement`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create topic |
| GET | `/` | List topics (query: `subject`, `mastery`, `sheet`, `search`) |
| GET | `/stats` | Subject-wise mastery stats |
| PATCH | `/:id` | Update topic |
| PATCH | `/:id/revise` | Mark as revised (increments `revisionCount`, updates `lastRevisedAt`) |
| DELETE | `/:id` | Delete topic |

### Notes — `/notes`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create note |
| GET | `/` | List notes (query: `search`, `isPinned`) |
| PATCH | `/:id` | Update note |
| DELETE | `/:id` | Delete note |

### Habits — `/habits`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create habit |
| GET | `/` | List habits |
| POST | `/:id/checkin` | Check in for today (updates streak + completedDates) |
| PATCH | `/:id` | Update habit |
| DELETE | `/:id` | Delete habit |

### Pomodoro — `/pomodoro`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Log session (`type`, `duration`, `taskName`, `subject`, `wasCompleted`) |
| GET | `/` | List sessions (query: `limit`) |
| GET | `/stats` | Stats: `totalFocus`, `totalBreaks`, `totalMinutes`, per-day chart data |

### Placement Progress — `/progress`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get all progress entries |
| PUT | `/` | Upsert progress entry |
| GET | `/stats` | Sheet-wise completion stats |

### Tasks (Todo) — `/tasks`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create task |
| GET | `/` | List (query: `segment`, `status`, `priority`, `category`, `search`, `filter`=today/week/overdue, `page`, `limit`) |
| GET | `/today` | Tasks due today (incomplete, max 10) |
| PATCH | `/:id` | Update task |
| PATCH | `/:id/complete` | Toggle complete (flips `isCompleted`, sets `completedAt`) |
| DELETE | `/:id` | Delete task |

### Calendar Events — `/events`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create event |
| GET | `/` | List (query: `startDate`, `endDate`) |
| GET | `/:id` | Get single event |
| PATCH | `/:id` | Update event |
| DELETE | `/:id` | Delete event |

### Sleep — `/sleep`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Log sleep (`sleepTime`, `wakeTime`, `quality`, `notes`). Upserts one per day |
| GET | `/` | List logs (query: `days`=30) |
| GET | `/insights` | 30-day stats: avg duration, best day, weekday avg, last-7 chart |

### Notifications — `/notifications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/vapid-key` | Get VAPID public key for push subscription |
| POST | `/subscribe` | Save push subscription |
| POST | `/test` | Send test push notification |
| GET | `/pending` | List pending event/task reminders |

### Daily Review — `/review`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Upsert review for date |
| GET | `/` | Get review (query: `date`=YYYY-MM-DD, defaults to today) |

### Internship Config — `/internship`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Save/update internship config |
| GET | `/` | Get internship config |

### Todo Dashboard — `/dashboard`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/today` | Aggregated: tasks due today (max 5), next upcoming event, last night's sleep, today's focus minutes, internship day counter |

---

## 🖥 Web Frontend — `/client`

**Stack:** React 18, Vite, TailwindCSS, React Router v6, React Query (TanStack), Framer Motion, Axios, Lucide icons, Recharts, react-hot-toast

### Directory
```
client/src/
  api/                 API layer (Axios wrappers)
    client.js          Axios instance (base URL from VITE_API_URL, token refresh interceptor)
    auth.api.js        Auth endpoints
    expenses.api.js    Expense endpoints
    index.js           All other API objects exported (budgetApi, goalApi, placementApi, noteApi, habitApi, pomodoroApi, progressApi, taskApi, eventApi, sleepApi, notificationApi, reviewApi, internshipApi, todoDashboardApi)
  components/
    PomodoroTimer.jsx  Global floating Pomodoro overlay (triggered via PomodoroContext)
    CommandPalette.jsx Global ⌘K command palette for quick navigation
    charts/            Recharts wrappers
    layout/            Sidebar, Navbar, ProtectedRoute
    ui/                Reusable UI primitives (Button, Modal, etc.)
  constants/index.js   All enums, colour maps, ROUTES, QUERY_KEYS, category lists
  context/
    AuthContext.jsx    User auth state + login/logout helpers
    PomodoroContext.jsx Global Pomodoro visibility state
  hooks/               Custom hooks (useExpenses, useGoals, etc.)
  pages/
    auth/              Login.jsx, Register.jsx
    Dashboard.jsx      Main financial dashboard
    Expenses.jsx       Expense list, filters, add/edit modal
    Analytics.jsx      Monthly/yearly charts (Recharts)
    Budget.jsx         Budget per category management
    Goals.jsx          Savings goals with progress bars
    Placement.jsx      DSA/placement topic tracker
    Notes.jsx          Notes with pin + color
    Habits.jsx         Daily habit checklist with streaks
    NotFound.jsx       404 page
    todo/              Todo module (sub-router at /todo/*)
      TodoModule.jsx   Layout with bottom nav (Today / Tasks / Calendar / Sleep / Focus)
      TodayTab.jsx     Daily intention, events timeline, priority tasks, EOD review form
      TasksTab.jsx     Task list with filters, add/edit sheet, subtask support
      CalendarTab.jsx  Month calendar + event list, add event sheet, push notification subscribe
      SleepTab.jsx     Sleep log form, 7-day bar chart, insights
      FocusTab.jsx     ✅ Pomodoro timer with mode selector, custom durations, stats, session history
      components/
        AddEventSheet.jsx  Bottom sheet for creating calendar events
  utils/
    cn.js              Tailwind class merger (clsx + tailwind-merge)
    formatters.js      formatCurrency, formatDate helpers
```

### Routes
```
/              → redirects to /dashboard
/login
/register
/dashboard
/expenses
/analytics
/budget
/goals
/placement
/notes
/habits
/todo          → redirects to /todo/today
/todo/today
/todo/tasks
/todo/calendar
/todo/sleep
/todo/focus    ← FocusTab (Pomodoro)
*              → NotFound
```

### Key Design Decisions
- Dark theme (#0a0a0a background, #111 cards, #1e1e1e borders, #6c63ff primary)
- All pages use React Query for server state; mutations invalidate related query keys
- Token stored in HTTP-only cookies; `client.js` auto-refreshes on 401 via interceptor
- `CommandPalette.jsx` opened globally with ⌘K / Ctrl+K
- `PomodoroTimer.jsx` is a floating overlay; `FocusTab.jsx` is a full-page Pomodoro in the Todo module
- Todo module is a nested router — `TodoModule` wraps all `/todo/*` sub-routes

---

## 📱 iPhone App — `/app-frontend`

**Stack:** Expo SDK 56, React Native, React Navigation v6, Axios, expo-secure-store

### Directory
```
app-frontend/src/
  api/client.js        Axios instance (reads EXPO_PUBLIC_API_URL → app.config.js PROD URL)
  context/             Auth context, token storage via expo-secure-store
  navigation/          Tab + stack navigators
  screens/
    auth/              LoginScreen, RegisterScreen
    main/
      DashboardScreen.js   Greeting, budget bar, income/expense/investment cards, recent transactions
      ExpensesScreen.js    Grouped expense list, filter by type, add expense modal
      GoalsScreen.js       Progress bars, add goal, add contribution
      HabitsScreen.js      Daily checklist with streaks, add habit
      MoreScreen.js        Links to Notes, Placement Tracker, Pomodoro, Profile
      ProfileScreen.js     User profile, logout
  theme/               Colours, typography, spacing
  utils/               Formatters, date helpers
```

### API URL Resolution
```
EXPO_PUBLIC_API_URL (env var, local dev only)
  ↓ not set? falls back to:
Constants.expoConfig.extra.apiUrl  (app.config.js)
  ↓
'https://personal-os-c6lc.onrender.com/api/v1'  ← baked into published bundle
```

---

## 🔧 Backend — `/server`

**Stack:** Node.js, Express, Mongoose, JWT (access + refresh cookies), bcrypt, Helmet, Morgan, cors, cookie-parser, node-cron, web-push

### Directory
```
server/src/
  app.js               Express app setup (CORS, Helmet, Morgan, routes)
  config/env.js        Zod-validated env config
  controllers/         One file per feature domain
  middleware/
    auth.middleware.js      protect() — validates JWT, attaches req.user
    error.middleware.js     Global error handler + 404
    rateLimiter.middleware.js  express-rate-limit global limiter
  models/              Mongoose schemas (see Database Models section)
  routes/
    index.js           Mounts all routers under /api/v1
    *.routes.js        Per-domain route files
  services/
    reminderCron.js    node-cron job: fires every minute, sends push notifications for due event reminders
  utils/
    dateHelpers.js     startOfDay, endOfDay, startOfWeek, endOfWeek helpers
    response.js        success(res, data, msg, status), error(res, msg, status), paginated(res, items, meta)
server.js              Entry point — connects MongoDB, starts cron, listens on PORT
```

### Auth Flow
1. `POST /api/v1/auth/login` → sets `accessToken` (15m) and `refreshToken` (7d) as **httpOnly cookies**
2. Client sends cookies automatically with `withCredentials: true`
3. On 401 → `client.js` interceptor hits `/auth/refresh` → retries original request
4. Logout clears both cookies

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Card bg | `#111` |
| Card border | `#1e1e1e` |
| Primary | `#6c63ff` (purple) |
| Success | `#22c55e` (green) |
| Warning | `#f59e0b` (amber) |
| Danger | `#ef4444` (red) |
| Muted text | `#444` → `#555` |
| Body text | `#ccc` → `#e0e0e0` |
| Heading text | `#f0f0f0` |

---

## ☁️ Deployment

### Backend → Render ✅ LIVE
URL: `https://personal-os-c6lc.onrender.com`  
Health check: `https://personal-os-c6lc.onrender.com/health` → `{"status":"ok"}`  
See `HOSTING.md` → Part 1 for full setup.

**Still to do:**
- [ ] Set up UptimeRobot to ping `/health` every 5 min (keeps free tier awake)
- [ ] Update `CLIENT_URL` in Render → after Vercel deploy

### Web Frontend → Vercel (pending)
1. Import repo → Root Directory: `client`
2. Add env var: `VITE_API_URL=https://personal-os-c6lc.onrender.com/api/v1`
3. Deploy → update `CLIENT_URL` in Render  
See `HOSTING.md` → Part 2.

### iPhone App → Expo Go (pending)
```bash
cd app-frontend
npx expo login      # expo.dev account
npx expo publish    # bakes Render URL, uploads to CDN
```
After publish: open Expo Go on iPhone → your account → Personal OS  
See `HOSTING.md` → Part 3.

---

## 📦 Tech Stack Summary

| Layer | Libraries |
|-------|-----------|
| Backend | Node.js, Express, Mongoose, JWT, bcrypt, Helmet, Morgan, cors, cookie-parser, web-push, node-cron, Zod, date-fns |
| Web | React 18, Vite, TailwindCSS, React Router v6, TanStack Query v5, Framer Motion, Axios, Recharts, Lucide React, react-hot-toast |
| Mobile | Expo SDK 56, React Native, React Navigation v6, Axios, expo-secure-store, expo-constants |
| Database | MongoDB Atlas M0 (free) |

---

## ✅ Implementation Status

### Backend
- [x] Auth (JWT cookies, refresh, bcrypt)
- [x] Expenses CRUD + analytics + recurring
- [x] Budgets (monthly per-category)
- [x] Goals
- [x] Placement topics + progress tracking
- [x] Notes
- [x] Habits + check-in + streaks
- [x] Pomodoro sessions + stats
- [x] Todo Tasks (priority, status, sub-tasks, reminders)
- [x] Calendar Events + reminders
- [x] Sleep logging + insights
- [x] Daily Review (intention + EOD)
- [x] Internship config
- [x] Push notifications (web-push VAPID)
- [x] Todo dashboard aggregate endpoint
- [x] Reminder cron job (fires push notifications)
- [x] Rate limiting, error handling middleware

### Web Frontend
- [x] Auth (Login / Register)
- [x] Dashboard (financial overview)
- [x] Expenses page (list, filter, add, edit, delete)
- [x] Analytics page (monthly/yearly charts)
- [x] Budget page
- [x] Goals page
- [x] Placement tracker
- [x] Notes page
- [x] Habits page
- [x] Command Palette (⌘K)
- [x] Global Pomodoro overlay (floating)
- [x] Todo module shell + bottom nav
- [x] Todo → Today tab (intention, events timeline, tasks, EOD review)
- [x] Todo → Tasks tab (full CRUD, segments, filters, add sheet)
- [x] Todo → Calendar tab (month view, events, push notification subscribe)
- [x] Todo → Sleep tab (log form, bar chart, insights)
- [x] Todo → Focus tab (Pomodoro timer, modes, stats, session history)

### iPhone App
- [x] Auth screens
- [x] Dashboard screen
- [x] Expenses screen
- [x] Goals screen
- [x] Habits screen
- [x] More screen (links to Notes, Placement, Pomodoro, Profile)
- [x] Profile screen

### Deployment
- [x] Backend live on Render
- [x] MongoDB Atlas configured
- [x] Vercel web frontend — `https://client-j4m3tigbb-raghavbagdi87-7337s-projects.vercel.app`
- [ ] Expo publish (pending — run `npx expo publish` from `app-frontend/`)
- [ ] UptimeRobot keep-alive (pending — ping `https://personal-os-c6lc.onrender.com/health` every 5min)

---

## 🐛 Fixes Applied (2026-06-08)

| Issue | Fix |
|-------|-----|
| `client.js` 401 interceptor sent empty body to `/auth/refresh` | Now sends `{ refreshToken }` from `localStorage` |
| Missing `addDays` export in `dateHelpers.js` | Added `addDays(date, days)` helper |
| `date-fns` not installed on server | `npm install date-fns` |
| Duplicate Mongoose index warning on `InternshipConfig.user` | Removed redundant `index: true` (unique already indexes) |
| Missing PWA icons (`/icons/icon-192.png`, `/icons/icon-512.png`) | Generated and added to `client/public/icons/` |
