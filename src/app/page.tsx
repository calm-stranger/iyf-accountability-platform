import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen calm-gradient flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] warm-glow -z-10 pointer-events-none" />
      
      <div className="animate-fade-in-up flex flex-col items-center">
        <div className="mb-6 text-6xl animate-float">🪷</div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
          ISKCON Youth Forum
        </h1>
        <p className="text-lg md:text-xl text-primary font-medium mb-2">Guwahati</p>
        <p className="text-base md:text-lg text-muted-foreground max-w-md mb-10 leading-relaxed mx-auto">
          Take control of your days. Build your sadhana. Grow with your community.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center stagger-children">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full lotus-gradient text-white border-0 px-10 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5">
              Login
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full px-10 bg-white/50 backdrop-blur-sm border-border/50 hover:bg-white/80">
              Register
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-0 right-0 animate-fade-in" style={{ animationDelay: '800ms' }}>
        <p className="text-sm text-muted-foreground italic px-4 max-w-2xl mx-auto">
          &quot;Hare Krishna Hare Krishna, Krishna Krishna Hare Hare, Hare Rama Hare Rama, Rama Rama Hare Hare&quot;
        </p>
      </div>
    </main>
  )
}