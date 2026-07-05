import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify that this user is actually an ADMIN
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') {
    redirect('/dashboard') // Send them back to student view if not an admin
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* ADMIN NAVIGATION */}
      <header className="bg-stone-900 border-b border-stone-800 py-4 px-6 flex justify-between items-center shadow-md print:hidden">
        <h1 className="text-xl font-semibold text-amber-500 tracking-tight">
          Admin Portal
        </h1>
        <nav className="flex items-center gap-6">
          <Link href="/admin/challenges" className="text-sm font-medium text-stone-300 hover:text-white transition-colors">
            Challenges
          </Link>
          <Link href="/admin/requests" className="text-sm font-medium text-stone-300 hover:text-white transition-colors">
            Requests
          </Link>
          <Link href="/admin/reports" className="text-sm font-medium text-stone-300 hover:text-white transition-colors">
            Reports
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-amber-600 hover:text-amber-400 transition-colors">
            Switch to Student View
          </Link>
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}