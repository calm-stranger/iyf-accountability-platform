'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile, ChallengeParticipant, DailyReport } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Phone, MapPin, Calendar, Music2,
  BookOpen, Flame, Send, FileText, Trophy
} from 'lucide-react'

export default function StudentDetailPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [challenges, setChallenges] = useState<ChallengeParticipant[]>([])
  const [reports, setReports] = useState<DailyReport[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAdminId(user.id)

      const [{ data: prof }, { data: parts }, { data: reps }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('challenge_participants').select('*, challenges(*)')
          .eq('user_id', id).order('joined_at', { ascending: false }),
        supabase.from('daily_reports').select('*, challenges(title)')
          .eq('user_id', id).order('submitted_at', { ascending: false }).limit(20),
      ])

      setProfile(prof)
      setChallenges(parts || [])
      setReports(reps || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function sendMessage() {
    if (!message.trim() || !profile) return
    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.from('messages').insert({
      from_id: adminId, to_id: profile.id, content: message,
    })
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: profile.id, type: 'feedback',
        title: 'New message from Admin',
        message: message.slice(0, 80) + (message.length > 80 ? '...' : ''),
        link: '/notifications',
      })
      toast({ title: 'Message sent! 🙏' })
      setMessage('')
    }
    setSending(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading student...</p></div>
    </div>
  )
  if (!profile) return <div className="text-center py-16 text-muted-foreground">Student not found.</div>

  const approvedChallenges = challenges.filter(c => c.status === 'approved')
  const totalReports = reports.length

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/students">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft size={16} /></Button>
        </Link>
        <h1 className="text-xl font-bold">Student Profile</h1>
      </div>

      {/* Profile card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full lotus-gradient flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {profile.full_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile.full_name}</h2>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {profile.phone && (
                  <span className="flex items-center gap-1"><Phone size={12} />{profile.phone}</span>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1"><MapPin size={12} />{profile.address}</span>
                )}
                {profile.date_of_birth && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(profile.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="capitalize gap-1">
                  <BookOpen size={10} />{profile.occupation || 'N/A'}
                </Badge>
                <Badge className="bg-accent/10 text-accent border-accent/20 gap-1">
                  <Music2 size={10} />{profile.chanting_rounds || 0} rounds daily
                </Badge>
              </div>
              {profile.occupation === 'student' && profile.academic_institution && (
                <p className="text-xs text-muted-foreground mt-2">
                  📚 {profile.academic_course && `${profile.academic_course} · `}
                  {profile.academic_institution}
                  {profile.academic_year && ` · ${profile.academic_year}`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-primary">{approvedChallenges.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
              <Trophy size={10} />Challenges
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{totalReports}</div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
              <FileText size={10} />Reports
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
              {(() => {
                let streak = 0
                const sorted = [...reports].sort((a, b) => b.report_date.localeCompare(a.report_date))
                let check = new Date()
                for (const r of sorted) {
                  const d = new Date(check)
                  d.setDate(d.getDate() - (streak === 0 ? 0 : 1))
                  if (r.report_date === d.toISOString().split('T')[0]) { streak++; check = d } else break
                }
                return streak
              })()}
              <Flame size={16} className="text-orange-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Challenges */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Trophy size={13} />Challenge Participation
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-2">
          {challenges.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-4">No challenge participation yet.</p>
            : challenges.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{(c.challenges as any)?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(c.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <Badge className={
                  c.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                  c.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }>
                  {c.status}
                </Badge>
              </div>
            ))
          }
        </CardContent>
      </Card>

      {/* Recent reports */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <FileText size={13} />Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-2">
          {reports.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-4">No reports submitted yet.</p>
            : reports.slice(0, 8).map(r => (
              <div key={r.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{(r.challenges as any)?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.report_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(r.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">✓ Submitted</Badge>
              </div>
            ))
          }
        </CardContent>
      </Card>

      {/* Send message */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Send size={13} />Send Message / Encouragement
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          <Textarea placeholder={`Write a message or word of encouragement for ${profile.full_name}...`}
            value={message} onChange={e => setMessage(e.target.value)} rows={3} className="text-sm resize-none" />
          <Button className="w-full lotus-gradient text-white border-0" onClick={sendMessage} disabled={sending || !message.trim()}>
            <Send size={14} className="mr-2" />
            {sending ? 'Sending...' : 'Send Message 🙏'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}