# ISKCON Youth Forum Sadhana Tracker

A web app for IYF Guwahati students and admins to manage spiritual practice challenges, daily reports, notifications, and guidance messages.

## Overview

The app has two role-based experiences:

- **Students** can browse challenges, request to join, submit daily sadhana reports, view notifications, message admins, and manage their profile.
- **Admins** can manage students, create challenges, review join requests, inspect submissions, send messages, post Word of the Day, and monitor dashboard activity.

## Features

- **Role-based dashboards** for students and admins.
- **Challenge management** with custom daily report form fields.
- **Join request workflow** with admin approval/rejection and optional admin message.
- **Daily report submissions** with recent activity and streak tracking.
- **Notifications** for messages, challenge status changes, new challenges, and reports.
- **Student-admin messaging** with direct notification links into the correct conversation.
- **Word of the Day** for daily inspiration.
- **Responsive mobile-first UI** for challenge browsing, forms, dialogs, reports, requests, and admin workflows.
- **Calm visual theme** using sage/teal primary colors, soft blue accents, and gentle neutral backgrounds.
- **Admin sign out** from desktop and mobile admin navigation.

## Tech Stack

- **Framework:** Next.js 16 App Router
- **React:** React 19
- **Styling:** Tailwind CSS v4
- **UI:** Local custom components inspired by shadcn/ui and built with `@base-ui/react`
- **Icons:** `lucide-react`
- **Backend:** Supabase Auth and Database
- **Language:** TypeScript

## Important Development Note

This project uses Next.js 16. Before changing routing, server/client boundaries, middleware/proxy behavior, or App Router APIs, read the relevant guide in:

```text
node_modules/next/dist/docs/
```

The repo also includes `AGENTS.md` with this same warning for coding agents.

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` with Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If port `3000` is already in use, Next.js may choose another local port.

## Scripts

```bash
npm run dev
```

Starts the Next.js development server.

```bash
npm run build
```

Creates a production build and runs TypeScript checks.

```bash
npm run start
```

Starts the production server after a successful build.

```bash
npm run lint
```

Runs ESLint.

## Auth Notes

- Student login may use PIN convenience flows after setup.
- Admin login should stay email/password only.
- Admin accounts have broader permissions, so admin PIN login should be disabled or ignored.
- Admin sign out now calls Supabase `signOut()` and redirects to `/login`.

## Main Routes

### Student

- `/dashboard` - student overview and pending reports
- `/challenges` - browse available challenges
- `/my-challenges` - active and past joined challenges
- `/my-challenges/[id]` - daily report submission
- `/messages` - student-admin messaging
- `/notifications` - student notifications
- `/profile` - student profile and PIN setup

### Admin

- `/admin/dashboard` - admin overview, pending requests, recent reports, inactive students, Word of the Day
- `/admin/students` - student directory
- `/admin/students/[id]` - student details and direct message
- `/admin/challenges` - challenge creation, editing, requests, form builder
- `/admin/submissions` - report submissions
- `/admin/messages` - admin messaging
- `/admin/notifications` - admin notifications

## Recent Updates

- Added a dedicated student Messages page and fixed message notification routing.
- Fixed old message notifications that linked back to notifications instead of messages.
- Improved challenge creation/editing, request review, and report form responsiveness on smartphone sizes.
- Moved dialogs into a `document.body` portal so modals are no longer trapped by transformed page containers.
- Added a calmer color palette and removed most gold/orange visual emphasis.
- Added real admin Sign Out in desktop and mobile admin navigation.
- Fixed production build issues related to `Profile.pin_hash` typing and `useSearchParams()` Suspense requirements.

For a detailed history, see [CHANGELOG.md](./CHANGELOG.md).

## Verification Status

Current production build status:

```bash
npm run build
```

Passes.

Known lint status:

```bash
npm run lint
```

There are still broader lint issues in the codebase, mostly strict `no-explicit-any`, unescaped entity rules, and React lint rules around state updates in effects. These do not currently block production builds.
