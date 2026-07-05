'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { hashPin } from '@/lib/pin'
import { Delete, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Normal Login states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // PIN Login states
  const [pinMode, setPinMode] = useState(false)
  const [pinUserId, setPinUserId] = useState('')
  const [expectedHash, setExpectedHash] = useState('')
  const [userRole, setUserRole] = useState('')
  const [pin, setPin] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role, pin_hash').eq('id', user.id).single()
        if (profile?.pin_hash) {
          setPinMode(true)
          setPinUserId(user.id)
          setExpectedHash(profile.pin_hash)
          setUserRole(profile.role)
        } else {
          router.push(profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard')
        }
      }
      setCheckingSession(false)
    }
    checkSession()
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role, pin_hash').eq('id', user.id).single()
      const dest = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard'
      if (!profile?.pin_hash) {
        router.push(`${dest}?setup_pin=true`)
      } else {
        router.push(dest)
      }
    }
  }

  function handleDigit(d: string) {
    if (pin.length >= 6) return
    const newPin = pin + d
    setPin(newPin)
    if (newPin.length >= 4) {
      verifyPin(newPin)
    }
  }

  function handleBackspace() {
    setPin(p => p.slice(0, -1))
  }

  async function verifyPin(p: string) {
    setVerifying(true)
    const hash = await hashPin(p, pinUserId)
    if (hash === expectedHash) {
      router.push(userRole === 'admin' ? '/admin/dashboard' : '/dashboard')
    } else {
      if (p.length === 6) {
         toast({ title: 'Incorrect PIN', description: 'Please try again.', variant: 'destructive' })
         setPin('')
      }
    }
    setVerifying(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setPinMode(false)
    setPin('')
    setEmail('')
    setPassword('')
  }

  function onUsePassword() {
    setPinMode(false)
  }

  if (checkingSession) return (
    <div className="text-center text-muted-foreground">
      <div className="text-4xl mb-2 animate-pulse">🪷</div>
      <p className="text-sm">Loading...</p>
    </div>
  )

  if (pinMode) return (
    <Card className="w-full max-w-sm border-border/60 bg-white/80 backdrop-blur-md shadow-[0_10px_40px_hsl(35_22%_50%/0.08)]">
      <CardHeader className="text-center pb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-t-2xl -z-10" />
        <div className="text-4xl mb-3 animate-float">🔐</div>
        <CardTitle className="text-xl text-primary">Quick Login</CardTitle>
        <CardDescription>Enter your PIN to unlock</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-3 h-8 items-center mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${i < pin.length ? 'bg-primary border-primary' : 'border-border'}`} />
          ))}
        </div>
        {verifying && <p className="text-center text-xs text-muted-foreground animate-pulse mb-4">Checking...</p>}
        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button key={d} onClick={() => handleDigit(d)} className="h-14 rounded-xl border border-border text-lg font-semibold hover:bg-muted active:scale-95 transition-all">
              {d}
            </button>
          ))}
          <div />
          <button onClick={() => handleDigit('0')} className="h-14 rounded-xl border border-border text-lg font-semibold hover:bg-muted active:scale-95 transition-all">
            0
          </button>
          <button onClick={handleBackspace} className="h-14 rounded-xl border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all">
            <Delete size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-2 pt-6">
          <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={onUsePassword}>
            <KeyRound size={13} />Use password instead
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={handleLogout}>
            Not you? Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full max-w-md border-border/60 bg-white/80 backdrop-blur-md shadow-[0_10px_40px_hsl(35_22%_50%/0.08)]">
      <CardHeader className="text-center pb-2 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-t-2xl -z-10" />
        <div className="text-4xl mb-3 animate-float">🪷</div>
        <CardTitle className="text-2xl text-primary">Welcome Back</CardTitle>
        <CardDescription>Sign in to your sadhana journey</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full lotus-gradient text-white border-0" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          New here?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}