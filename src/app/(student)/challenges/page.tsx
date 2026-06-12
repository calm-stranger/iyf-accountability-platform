'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Challenge, ChallengeParticipant, Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Trophy, Clock, CheckCircle2, Users, Calendar, Info } from 'lucide-react'

export default function StudentChallengesPage() {
  const { toast } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [participations, setParticipations] = useState<Record<string, ChallengeParticipant>>({})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: chs }, { data: parts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('challenges').select('*').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('challenge_participants').select('*').eq('user_id', user.id)
      ])

      setProfile(prof)
      setChallenges(chs || [])
      
      const partMap: Record<string, ChallengeParticipant> = {}
      if (parts) {
        parts.forEach((p: ChallengeParticipant) => {
          partMap[p.challenge_id] = p
        })
      }
      setParticipations(partMap)
      setLoading(false)
    }
    load()
  }, [])

  async function handleJoin(challengeId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    if (!profile) return
    setJoining(challengeId)
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setJoining(null)
      return
    }

    const { data, error } = await supabase.from('challenge_participants').insert({
      challenge_id: challengeId,
      user_id: user.id,
      status: 'pending'
    }).select().single()

    if (error) {
      toast({ title: 'Failed to join', description: error.message, variant: 'destructive' })
    } else if (data) {
      toast({ title: 'Request Sent! 🙏', description: 'Your request to join has been sent to the admin.' })
      setParticipations(prev => ({ ...prev, [challengeId]: data }))
    }
    
    setJoining(null)
  }

  function renderStatusButton(c: Challenge, participation: ChallengeParticipant, isJoining: boolean) {
    if (!participation) {
      return (
        <Button 
          onClick={(e) => handleJoin(c.id, e)} 
          disabled={isJoining}
          className="w-full lotus-gradient text-white border-0"
        >
          {isJoining ? 'Requesting...' : 'Join Challenge 🙏'}
        </Button>
      )
    }
    if (participation.status === 'approved') {
      return (
        <Button variant="outline" className="w-full text-green-700 border-green-200 bg-green-50/50 hover:bg-green-50 pointer-events-none">
          You are participating
        </Button>
      )
    }
    if (participation.status === 'pending') {
      return (
        <Button variant="outline" className="w-full text-accent border-accent/20 bg-accent/5 hover:bg-accent/5 pointer-events-none">
          Awaiting Admin Approval
        </Button>
      )
    }
    return (
      <Button variant="outline" className="w-full text-red-700 border-red-200 bg-red-50/50 hover:bg-red-50 pointer-events-none">
        Request Not Approved
      </Button>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-muted-foreground">
        <div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm">Loading challenges...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy size={22} className="text-primary" /> Browse Challenges
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Find and join active spiritual challenges
        </p>
      </div>

      {challenges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Trophy size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No active challenges available right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map(c => {
            const participation = participations[c.id]
            const isJoining = joining === c.id
            
            return (
              <Card key={c.id} className="hover:shadow-[0_10px_30px_hsl(35_22%_50%/0.12)] transition-all duration-300 cursor-pointer flex flex-col h-full active:scale-[0.98] border-border/60 hover:-translate-y-1" onClick={() => setSelectedChallenge(c)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="min-w-0 break-words text-lg leading-tight">{c.title}</CardTitle>
                    {participation?.status === 'approved' && (
                      <Badge className="bg-green-50 text-green-700 border-green-200 shrink-0 text-[10px] gap-1">
                        <CheckCircle2 size={10} /> Joined
                      </Badge>
                    )}
                    {participation?.status === 'pending' && (
                      <Badge className="bg-accent/10 text-accent border-accent/20 shrink-0 text-[10px] gap-1">
                        <Clock size={10} /> Pending
                      </Badge>
                    )}
                    {participation?.status === 'rejected' && (
                      <Badge className="bg-red-50 text-red-700 border-red-200 shrink-0 text-[10px]">
                        Not Approved
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">{c.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0 flex flex-col gap-4">
                  <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-primary/70 shrink-0" />
                      <span className="min-w-0 break-words">
                        {new Date(c.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} 
                        {' → '} 
                        {new Date(c.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {c.audience !== 'all' && (
                      <div className="flex items-center gap-2">
                        <Users size={13} className="text-primary/70 shrink-0" />
                        <span className="min-w-0 break-words">For: {c.audience}</span>
                      </div>
                    )}
                  </div>
                  
                  {c.criteria && (
                    <div className="text-sm">
                      <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground block mb-1">Criteria</span>
                      <p className="text-xs line-clamp-2">{c.criteria}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t mt-1">
                    {renderStatusButton(c, participation, isJoining)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Challenge Detail Dialog */}
      <Dialog open={!!selectedChallenge} onOpenChange={(open) => !open && setSelectedChallenge(null)}>
        <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
          <DialogHeader className="mb-4 pb-4 border-b">
            <DialogTitle className="text-xl text-primary mb-1 flex items-center justify-between gap-2">
              {selectedChallenge?.title}
            </DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">
              {selectedChallenge?.description}
            </div>
          </DialogHeader>

          {selectedChallenge && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                <div className="flex min-w-0 items-center gap-2 bg-muted/40 px-3 py-2 rounded-lg text-sm">
                  <Calendar size={15} className="text-primary/70" />
                  <span className="font-medium">
                    {new Date(selectedChallenge.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} 
                    {' - '} 
                    {new Date(selectedChallenge.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {selectedChallenge.audience !== 'all' && (
                <div className="flex min-w-0 items-center gap-2 bg-muted/40 px-3 py-2 rounded-lg text-sm">
                    <Users size={15} className="text-primary/70" />
                    <span className="font-medium break-words">{selectedChallenge.audience}</span>
                  </div>
                )}
              </div>

              {selectedChallenge.details && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Info size={16} className="text-primary" /> Full Details
                  </h3>
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/50">
                    {selectedChallenge.details}
                  </div>
                </div>
              )}

              {selectedChallenge.criteria && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" /> Participation Criteria
                  </h3>
                  <div className="text-sm text-foreground/90 bg-muted/20 p-4 rounded-xl border border-border/50">
                    {selectedChallenge.criteria}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t mt-4 sticky bottom-0 bg-background/95 backdrop-blur py-2">
                {renderStatusButton(selectedChallenge, participations[selectedChallenge.id], joining === selectedChallenge.id)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
