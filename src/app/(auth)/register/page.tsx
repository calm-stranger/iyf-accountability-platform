'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [occupation, setOccupation] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '', address: '',
    date_of_birth: '', chanting_rounds: '', academic_institution: '',
    academic_year: '', academic_course: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name, role: 'student' } }
    })
    if (error || !data.user) {
      toast({ title: 'Registration failed', description: error?.message, variant: 'destructive' })
      setLoading(false); return
    }
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: form.full_name, phone: form.phone, address: form.address,
      occupation, date_of_birth: form.date_of_birth || null,
      chanting_rounds: parseInt(form.chanting_rounds) || 0,
      academic_institution: occupation === 'student' ? form.academic_institution : null,
      academic_year: occupation === 'student' ? form.academic_year : null,
      academic_course: occupation === 'student' ? form.academic_course : null,
      role: 'student',
    })
    if (profileError) {
      toast({ title: 'Profile setup failed', description: profileError.message, variant: 'destructive' })
      setLoading(false); return
    }
    toast({ title: 'Welcome! 🪷', description: 'Your account has been created.' })
    router.push('/dashboard')
  }

  return (
    <Card className="w-full max-w-lg border-border/60 bg-white/80 backdrop-blur-md shadow-[0_10px_40px_hsl(35_22%_50%/0.08)] my-8">
      <CardHeader className="text-center pb-2 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-t-2xl -z-10" />
        <div className="text-4xl mb-3 animate-float">🪷</div>
        <CardTitle className="text-2xl text-primary">Join the Journey</CardTitle>
        <CardDescription>Create your account — Hare Krishna!</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="Your full name" value={form.full_name}
                onChange={e => set('full_name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" placeholder="Min 6 characters" value={form.password}
                onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+91 XXXXX XXXXX" value={form.phone}
                  onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth}
                  onChange={e => set('date_of_birth', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="City / Area" value={form.address}
                onChange={e => set('address', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Occupation *</Label>
              <Select onValueChange={setOccupation} required>
                <SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="working">Working Professional</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {occupation === 'student' && (
              <div className="grid grid-cols-1 gap-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Academic Details</p>
                <Input placeholder="Institution name" value={form.academic_institution}
                  onChange={e => set('academic_institution', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Course (e.g. B.Tech)" value={form.academic_course}
                    onChange={e => set('academic_course', e.target.value)} />
                  <Input placeholder="Year (e.g. 2nd Year)" value={form.academic_year}
                    onChange={e => set('academic_year', e.target.value)} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Minimum Rounds Chanting Daily</Label>
              <Input type="number" placeholder="e.g. 16" min={0} max={64}
                value={form.chanting_rounds} onChange={e => set('chanting_rounds', e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full lotus-gradient text-white border-0 mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account 🙏'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}