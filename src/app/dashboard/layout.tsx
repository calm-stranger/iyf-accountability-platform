import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signout } from './actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Verify if the user is logged in
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // 2. Render the layout if authenticated
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* TOP NAVIGATION */}
      <header className="bg-white border-b border-stone-200 py-4 px-6 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-semibold text-amber-700 tracking-tight">
          Sadhana Tracker
        </h1>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-stone-600 hover:text-amber-600 transition-colors">
            Overview
          </Link>
          <Link href="/dashboard/challenges" className="text-sm font-medium text-stone-600 hover:text-amber-600 transition-colors">
            Challenges
          </Link>
          <form action={signout}>
            <Button variant="outline" size="sm" className="text-stone-600 border-stone-300 hover:bg-stone-100">
              Sign Out
            </Button>
          </form>
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}