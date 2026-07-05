'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChallengeParticipant } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Flame, CheckCircle2, Clock, BookOpen } from 'lucide-react'

export default function MyChallengesPage() {
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([])
  const [todayDone, setTodayDone] = useState<string[]>([])
  const [streaks, setStreaks] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: parts } = await supabase
        .from('challenge_participants').select('*, challenges(*)')
        .eq('user_id', user.id).eq('status', 'approved')

      setParticipants(parts || [])

      if (parts && parts.length > 0) {
        const ids = parts.map((p: ChallengeParticipant) => p.challenge_id)
        const today = new Date().toISOString().split('T')[0]

        const { data: reports } = await supabase.from('daily_reports')
          .select('challenge_id, report_date').eq('user_id', user.id)
          .in('challenge_id', ids).order('report_date', { ascending: false })

        setTodayDone((reports || []).filter((r: any) => r.report_date === today).map((r: any) => r.challenge_id))

        const streakMap: Record<string, number> = {}
        for (const id of ids) {
          const dates = (reports || []).filter((r: any) => r.challenge_id === id).map((r: any) => r.report_date)
          let streak = 0
          let check = new Date()
          for (const date of dates) {
            const d = new Date(check)
            d.setDate(d.getDate() - (streak === 0 ? 0 : 1))
            if (date === d.toISOString().split('T')[0]) { streak++; check = d } else break
          }
          streakMap[id] = streak
        }
        setStreaks(streakMap)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div><p className="text-sm text-muted-foreground">Loading your sadhana...</p></div>
    </div>
  )

  const active = participants.filter(p => (p.challenges as any)?.status === 'active')
  const past = participants.filter(p => (p.challenges as any)?.status !== 'active')

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="text-primary" size={22} /> My Sadhana
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your active challenges and daily practice</p>
      </div>

      {participants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <BookOpen size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No challenges yet.</p>
            <Link href="/challenges">
              <Button size="sm" className="mt-3 lotus-gradient text-white border-0">Browse Challenges</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active</h2>
              {active.map(p => {
                const c = p.challenges as any
                const done = todayDone.includes(p.challenge_id)
                const streak = streaks[p.challenge_id] || 0
                return (
                  <Card key={p.id} className="hover:shadow-[0_10px_30px_hsl(35_22%_50%/0.12)] transition-all duration-300 border-border/60 hover:-translate-y-1">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm">{c?.title}</h3>
                            {done
                              ? <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] gap-1"><CheckCircle2 size={10} />Done today</Badge>
                              : <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] gap-1"><Clock size={10} />Pending</Badge>
                            }
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{c?.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                            <span className="text-xs text-accent flex items-center gap-1 font-medium">
                              <Flame size={11} /> {streak} day streak
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Ends {new Date(c?.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <Link href={`/my-challenges/${p.challenge_id}`} className="w-full sm:w-auto">
                          <Button size="sm" className={done ? '' : 'lotus-gradient text-white border-0'} variant={done ? 'outline' : 'default'}>
                            {done ? 'View' : 'Submit'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed / Past</h2>
              {past.map(p => {
                const c = p.challenges as any
                return (
                  <Card key={p.id} className="opacity-70">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm">{c?.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Ended {new Date(c?.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <Link href={`/my-challenges/${p.challenge_id}`} className="w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">View</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
