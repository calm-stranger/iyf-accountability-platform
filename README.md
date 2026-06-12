# ISKCON Youth Forum — Sadhana Tracker 🪷

A platform for youth to track their sadhana, join challenges, and grow spiritually.

## Features

- **Role-based Dashboards:** Separate experiences for Students and Admins.
- **Sadhana Tracking:** Students can submit daily reports for various challenges.
- **Challenge Management:** Admins can create and manage challenges, including custom report forms.
- **Notifications & Messages:** Built-in communication system.
- **Word of the Day:** Daily spiritual inspiration.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **UI Components:** Custom components inspired by shadcn/ui and built with `@base-ui/react`
- **Icons:** `lucide-react`
- **Backend & Database:** Supabase

## Getting Started

First, install dependencies:

```bash
npm install
```

Set up your `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Recent Updates

- Migrated to **Tailwind CSS v4** setup.
- Replaced missing radix-ui components with custom accessible implementations (Select, Dialog, Tabs, Toaster, Badge, Card, Input, Label, Textarea).
- Implemented lightweight custom `use-toast` hook.
