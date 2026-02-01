# Calendar App

A modern React application that unifies your **Google Calendar** and **Google Tasks** in a clean, focused 14-day view. Sign in with Google to sync your schedule and tasks, or use the built-in demo mode without authentication.

![Tech Stack](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## Features

- **Google Integration** — Sign in with Google to sync your calendar events and tasks
- **14-Day View** — See today plus the next 13 days at a glance
- **Events & Tasks** — Calendar events (with class/event distinction) and tasks displayed per day
- **Undated Tasks** — Tasks without a due date shown in a dedicated "No date" section at the top
- **Task Completion** — Mark tasks complete directly in the app; changes sync to Google Tasks
- **Smart Sidebar** — Navigate by day with density indicators (dots) showing how busy each day is
- **Scroll Sync** — Main content and sidebar stay in sync; scroll or click to navigate
- **Session Persistence** — Stay signed in across tabs; token stored with expiry handling
- **Demo Mode** — When not signed in, explore the UI with sample data

## Tech Stack

| Category     | Technologies                                  |
| ------------ | --------------------------------------------- |
| Framework    | React 19, TypeScript                          |
| Build        | Vite 7                                        |
| Styling      | Tailwind CSS 4 (custom theme)                 |
| Data Fetching| TanStack React Query                          |
| Auth         | @react-oauth/google                           |
| Animation    | Motion (Framer Motion)                        |
| Date Handling| date-fns                                      |

## Project Structure

```
src/
├── App.tsx                 # Main app, auth flow, layout
├── main.tsx                # Entry point, providers
├── types.ts                # TypeScript interfaces
├── data.ts                 # Dummy data for demo mode
├── globals.css             # Tailwind theme, utilities
├── components/
│   ├── Day.tsx             # Day view (events + tasks)
│   ├── EventCard.tsx       # Calendar event card
│   ├── Task.tsx            # Task card (expand, complete)
│   ├── Sidebar.tsx         # Day navigation sidebar
│   └── UndatedTasksSection.tsx
├── hooks/
│   └── useGoogleData.ts    # TanStack Query hooks
├── logic/
│   └── googleService.ts    # Google Calendar & Tasks API
└── providers/
    └── QueryProvider.tsx   # TanStack Query client
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### 1. Clone and install

```bash
git clone <your-repo-url>
cd CalendarApp
npm install
```

### 2. Google Cloud setup

To enable Google sign-in and API access:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable **Google Calendar API** and **Google Tasks API**
4. Go to **APIs & Services → OAuth consent screen**
   - Configure the consent screen (User type, App name, etc.)
   - Under **Scopes**, add: `calendar.readonly` and `tasks` (or add these full URIs: `https://www.googleapis.com/auth/calendar.readonly` and `https://www.googleapis.com/auth/tasks`)
5. Go to **APIs & Services → Credentials**
6. Create an **OAuth 2.0 Client ID** (type: Web application)
7. Add authorized JavaScript origins (e.g. `http://localhost:5173`)
8. Add authorized redirect URIs (e.g. `http://localhost:5173`)
9. Copy the **Client ID**

### 3. Environment variables

Copy the example env file and add your Google Client ID:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You can use the app with dummy data without signing in, or sign in with Google to sync your real data.

## Scripts

| Command       | Description                    |
| ------------- | ------------------------------ |
| `npm run dev` | Start dev server               |
| `npm run build` | Build for production         |
| `npm run preview` | Preview production build    |
| `npm run lint` | Run ESLint                     |

## Configuration

### Class calendars

By default, the app fetches events from your primary calendar. To treat specific calendars as "classes" (styled differently), edit `src/logic/googleService.ts`:

```typescript
const CLASS_CALENDAR_IDS = [
  "your-calendar-id@group.calendar.google.com",
  // Add more calendar IDs
];
```

You can find calendar IDs in **Google Calendar → Settings → [Calendar] → Integrate calendar**.

### API scopes

The app requests:

- `https://www.googleapis.com/auth/calendar.readonly` — Read calendar events
- `https://www.googleapis.com/auth/tasks` — Read and update Google Tasks

## Data flow

1. **Auth** — User signs in with Google; access token stored in `localStorage` with expiry
2. **Fetch** — TanStack Query calls `fetchGoogleData`, which fetches calendar events and tasks in parallel
3. **Transform** — Raw API data is mapped into `DayData` (events + tasks per day) and `undatedTasks`
4. **Display** — Sidebar shows days with density dots; main content shows events and tasks per day
5. **Complete** — Task completion uses `completeTask` and `findTaskListForTask`, then invalidates the query to refetch

## License

Private / Unlicensed
