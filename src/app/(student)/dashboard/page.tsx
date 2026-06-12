'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile, Challenge, ChallengeParticipant, DailyReport, WordOfDay } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Flame, Trophy, BookOpen, CheckCircle2, Clock, Quote } from 'lucide-react'

import { useSearchParams } from 'next/navigation'
import PinSetupModal from '@/components/pin-setup-modal'

export default function StudentDashboard() {
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeChallenges, setActiveChallenges] = useState<ChallengeParticipant[]>([])
  const [todayReports, setTodayReports] = useState<string[]>([])
  const [streaks, setStreaks] = useState<Record<string, number>>({})
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPinSetup, setShowPinSetup] = useState(false)

  useEffect(() => {
    if (searchParams.get('setup_pin') === 'true') {
      setShowPinSetup(true)
    }
    
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: participants }, { data: word }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('challenge_participants').select('*, challenges(*)')
          .eq('user_id', user.id).eq('status', 'approved'),
        supabase.from('word_of_day').select('*').eq('active_date', new Date().toISOString().split('T')[0]).single(),
      ])

      setProfile(prof)
      setWordOfDay(word)
      setActiveChallenges(participants || [])

      if (participants && participants.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const challengeIds = participants.map((p: ChallengeParticipant) => p.challenge_id)

        const { data: reports } = await supabase.from('daily_reports')
          .select('challenge_id, report_date')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds)
          .order('report_date', { ascending: false })

        const submittedToday = (reports || [])
          .filter((r: any) => r.report_date === today)
          .map((r: any) => r.challenge_id)
        setTodayReports(submittedToday)

        // Calculate streaks per challenge
        const streakMap: Record<string, number> = {}
        for (const id of challengeIds) {
          const dates = (reports || [])
            .filter((r: any) => r.challenge_id === id)
            .map((r: any) => r.report_date)
            .sort((a: string, b: string) => b.localeCompare(a))

          let streak = 0
          let check = new Date()
          for (const date of dates) {
            const d = new Date(check)
            d.setDate(d.getDate() - (streak === 0 ? 0 : 1))
            if (date === d.toISOString().split('T')[0]) {
              streak++
              check = d
            } else break
          }
          streakMap[id] = streak
        }
        setStreaks(streakMap)
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalStreak = Object.values(streaks).reduce((a, b) => a + b, 0)
  const pendingToday = activeChallenges.filter(p =>
    (p.challenges as any)?.status === 'active' && !todayReports.includes(p.challenge_id)
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-muted-foreground">
        <div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm">Loading your sadhana...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hare Krishna, {profile?.full_name?.split(' ')[0]}! 🙏
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Word of the Day */}
      {wordOfDay && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3 items-start">
              <Quote size={18} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground leading-relaxed italic">
                  "{wordOfDay.content}"
                </p>
                {wordOfDay.verse_reference && (
                  <p className="text-xs text-muted-foreground mt-1">— {wordOfDay.verse_reference}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-primary">{activeChallenges.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
              <Trophy size={11} /> Active
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
              {totalStreak}<Flame size={18} className="text-orange-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Streak Days</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-accent">{profile?.chanting_rounds || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Rounds Daily</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's pending submissions */}
      {pendingToday.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-orange-700 flex items-center gap-2">
              <Clock size={15} /> Today's Reports Pending ({pendingToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {pendingToday.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-orange-100">
                <span className="text-sm font-medium">{(p.challenges as any)?.title}</span>
                <Link href={`/my-challenges/${p.challenge_id}`}>
                  <Button size="sm" className="lotus-gradient text-white border-0 h-7 text-xs px-3">
                    Submit
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Challenges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen size={16} className="text-primary" /> My Challenges
          </h2>
          <Link href="/challenges">
            <Button variant="ghost" size="sm" className="text-xs text-primary">Browse more →</Button>
          </Link>
        </div>

        {activeChallenges.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <Trophy size={32} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground text-sm">You haven't joined any challenges yet.</p>
              <Link href="/challenges">
                <Button size="sm" className="mt-3 lotus-gradient text-white border-0">
                  Browse Challenges
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeChallenges.map(p => {
              const challenge = p.challenges as any
              const submitted = todayReports.includes(p.challenge_id)
              const streak = streaks[p.challenge_id] || 0
              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{challenge?.title}</h3>
                          {submitted ? (
                            <Badge variant="secondary" className="text-green-700 bg-green-50 border-green-200 text-[10px] gap-1">
                              <CheckCircle2 size={10} /> Done today
                            </Badge>
                          ) : challenge?.status === 'active' ? (
                            <Badge variant="secondary" className="text-orange-600 bg-orange-50 border-orange-200 text-[10px]">
                              Pending
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {challenge?.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-orange-500 flex items-center gap-1">
                            <Flame size={11} /> {streak} day streak
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Ends {new Date(challenge?.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <Link href={`/my-challenges/${p.challenge_id}`}>
                        <Button variant="outline" size="sm" className="text-xs shrink-0">
                          {submitted ? 'View' : 'Submit'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      <PinSetupModal open={showPinSetup} onClose={() => setShowPinSetup(false)} userId={profile?.id || ''} />
    </div>
  )
}