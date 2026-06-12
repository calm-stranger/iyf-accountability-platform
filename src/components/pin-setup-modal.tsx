'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { hashPin } from '@/lib/pin'
import { useToast } from '@/hooks/use-toast'
import { Delete } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
}

export default function PinSetupModal({ open, onClose, userId }: Props) {
  const { toast } = useToast()
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [saving, setSaving] = useState(false)

  const current = step === 'enter' ? pin : confirmPin

  function handleDigit(d: string) {
    if (current.length >= 6) return
    if (step === 'enter') setPin(p => p + d)
    else setConfirmPin(p => p + d)
  }

  function handleBackspace() {
    if (step === 'enter') setPin(p => p.slice(0, -1))
    else setConfirmPin(p => p.slice(0, -1))
  }

  function proceedToConfirm() {
    if (pin.length < 4) {
      toast({ title: 'PIN too short', description: 'Use at least 4 digits.', variant: 'destructive' })
      return
    }
    setStep('confirm')
  }

  async function handleSave() {
    if (pin !== confirmPin) {
      toast({ title: "PINs don't match", description: 'Please try again.', variant: 'destructive' })
      setPin('')
      setConfirmPin('')
      setStep('enter')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const hash = await hashPin(pin, userId)
    const { error } = await supabase.from('profiles').update({ pin_hash: hash }).eq('id', userId)
    
    if (error) {
      toast({ title: 'Failed to set PIN', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'PIN set! 🙏', description: 'You can now use it for quick login.' })
      onClose()
    }
    setSaving(false)
  }

  function handleSkip() {
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-primary text-center">
            {step === 'enter' ? 'Set Up Quick PIN 🔐' : 'Confirm Your PIN'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'enter' ? 'Choose a 4-6 digit PIN for fast login on this device' : 'Enter your PIN again to confirm'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex justify-center gap-3 h-8 items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${i < current.length ? 'bg-primary border-primary' : 'border-border'}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button key={d} onClick={() => handleDigit(d)} className="h-14 rounded-xl border border-border text-lg font-semibold hover:bg-primary/5 hover:border-primary/30 hover:text-primary active:scale-95 transition-all">
                {d}
              </button>
            ))}
            <div />
            <button onClick={() => handleDigit('0')} className="h-14 rounded-xl border border-border text-lg font-semibold hover:bg-primary/5 hover:border-primary/30 hover:text-primary active:scale-95 transition-all">
              0
            </button>
            <button onClick={handleBackspace} className="h-14 rounded-xl border border-border flex items-center justify-center hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive active:scale-95 transition-all text-muted-foreground">
              <Delete size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={handleSkip}>
              Skip for now
            </Button>
            {step === 'enter' ? (
              <Button size="sm" className="flex-1 lotus-gradient text-white border-0" onClick={proceedToConfirm} disabled={pin.length < 4}>
                Continue
              </Button>
            ) : (
              <Button size="sm" className="flex-1 lotus-gradient text-white border-0" onClick={handleSave} disabled={confirmPin.length < 4 || saving}>
                {saving ? 'Saving...' : 'Set PIN'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
