'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Users, Trophy, FileText, Clock,
  TrendingUp, AlertCircle, CheckCircle2, Quote
} from 'lucide-react'

import { useSearchParams } from 'next/navigation'
import PinSetupModal from '@/components/pin-setup-modal'

export default function AdminDashboard() {
  const searchParams = useSearchParams()
  const [stats, setStats] = useState({
    totalStudents: 0, activeChallenges: 0,
    todaySubmissions: 0, pendingRequests: 0,
  })
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [inactiveStudents, setInactiveStudents] = useState<any[]>([])
  const [wordForm, setWordForm] = useState({ content: '', verse_reference: '' })
  const [todayWord, setTodayWord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [adminId, setAdminId] = useState('')
  const [showPinSetup, setShowPinSetup] = useState(false)

  useEffect(() => {
    if (searchParams.get('setup_pin') === 'true') {
      setShowPinSetup(true)
    }

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAdminId(user.id)
      const today = new Date().toISOString().split('T')[0]
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]

      const [
        { count: students },
        { count: challenges },
        { count: todaySubs },
        { count: pending },
        { data: pendReqs },
        { data: recentSubs },
        { data: word },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('challenges').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('daily_reports').select('*', { count: 'exact', head: true }).eq('report_date', today),
        supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('challenge_participants').select('*, profiles(*), challenges(title)')
          .eq('status', 'pending').order('joined_at', { ascending: false }).limit(5),
        supabase.from('daily_reports').select('*, profiles(full_name), challenges(title)')
          .order('submitted_at', { ascending: false }).limit(6),
        supabase.from('word_of_day').select('*').eq('active_date', today).single(),
      ])

      setStats({
        totalStudents: students || 0,
        activeChallenges: challenges || 0,
        todaySubmissions: todaySubs || 0,
        pendingRequests: pending || 0,
      })
      setPendingRequests(pendReqs || [])
      setRecentSubmissions(recentSubs || [])
      setTodayWord(word)

      // Find students inactive for 3+ days (in active challenges)
      const { data: activeParticipants } = await supabase
        .from('challenge_participants').select('user_id, profiles(full_name)')
        .eq('status', 'approved')
      const uniqueUsers = [...new Map((activeParticipants || []).map((p: any) => [p.user_id, p])).values()]

      const inactive = []
      for (const p of uniqueUsers.slice(0, 20)) {
        const { data: lastReport } = await supabase.from('daily_reports')
          .select('report_date').eq('user_id', p.user_id)
          .order('report_date', { ascending: false }).limit(1).single()
        if (!lastReport || lastReport.report_date < threeDaysAgo) {
          inactive.push({ user_id: p.user_id, full_name: (p as any).profiles?.full_name })
        }
      }
      setInactiveStudents(inactive.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  async function postWordOfDay() {
    if (!wordForm.content.trim()) return
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('word_of_day').upsert({
      content: wordForm.content, verse_reference: wordForm.verse_reference,
      posted_by: adminId, active_date: today,
    }, { onConflict: 'active_date' })
    setTodayWord({ ...wordForm, active_date: today })
    setWordForm({ content: '', verse_reference: '' })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading dashboard...</p></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard 🪷</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Challenges', value: stats.activeChallenges, icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
          { label: "Today's Reports", value: stats.todaySubmissions, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={17} className={color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending requests */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2"><Clock size={14} className="text-orange-500" />Pending Requests</span>
              <Link href="/admin/challenges"><Button variant="ghost" size="sm" className="text-xs h-6 px-2">View all</Button></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {pendingRequests.length === 0
              ? <p className="text-xs text-muted-foreground text-center py-4">No pending requests</p>
              : pendingRequests.map((r: any) => (
                <div key={r.id} className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
                  <div className="h-7 w-7 rounded-full lotus-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.profiles?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{r.profiles?.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.challenges?.title}</p>
                  </div>
                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[9px]">Pending</Badge>
                </div>
              ))
            }
          </CardContent>
        </Card>

        {/* Recent submissions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2"><TrendingUp size={14} className="text-green-500" />Recent Reports</span>
              <Link href="/admin/submissions"><Button variant="ghost" size="sm" className="text-xs h-6 px-2">View all</Button></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {recentSubmissions.length === 0
              ? <p className="text-xs text-muted-foreground text-center py-4">No submissions yet</p>
              : recentSubmissions.map((r: any) => (
                <div key={r.id} className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{r.profiles?.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.challenges?.title}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(r.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            }
          </CardContent>
        </Card>

        {/* Inactive + Word of Day */}
        <div className="space-y-4">
          {/* Inactive students */}
          {inactiveStudents.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="text-orange-500" />Not Submitting (3d+)
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                {inactiveStudents.map((s: any) => (
                  <div key={s.user_id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs font-medium">{s.full_name}</p>
                    <Link href={`/admin/students/${s.user_id}`}>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-primary">Message</Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Word of day */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Quote size={14} className="text-primary" />Word of the Day
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {todayWord ? (
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-xs italic text-foreground leading-relaxed">"{todayWord.content}"</p>
                  {todayWord.verse_reference && (
                    <p className="text-[10px] text-muted-foreground mt-1">— {todayWord.verse_reference}</p>
                  )}
                  <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Posted for today
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea className="w-full text-xs border border-border rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 bg-background"
                    rows={2} placeholder="Today's quote or verse..."
                    value={wordForm.content} onChange={e => setWordForm(f => ({ ...f, content: e.target.value }))} />
                  <input className="w-full text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30 bg-background"
                    placeholder="Reference (e.g. BG 2.47)" value={wordForm.verse_reference}
                    onChange={e => setWordForm(f => ({ ...f, verse_reference: e.target.value }))} />
                  <Button size="sm" className="w-full lotus-gradient text-white border-0 h-7 text-xs" onClick={postWordOfDay}>
                    Post Word of the Day
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
      </div>
      <PinSetupModal open={showPinSetup} onClose={() => setShowPinSetup(false)} userId={adminId || ''} />
    </div>
  )
}