import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen calm-gradient flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-5xl">🪷</div>
      <h1 className="text-4xl font-bold text-primary mb-2 tracking-tight">
        ISKCON Youth Forum
      </h1>
      <p className="text-lg text-muted-foreground mb-1 font-medium">Guwahati</p>
      <p className="text-base text-foreground/70 max-w-md mb-10 leading-relaxed">
        Take control of your days. Build your sadhana. Grow with your community.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/login">
          <Button size="lg" className="lotus-gradient text-white border-0 px-8">
            Login
          </Button>
        </Link>
        <Link href="/register">
          <Button size="lg" variant="outline" className="px-8">
            Register
          </Button>
        </Link>
      </div>
      <p className="mt-12 text-sm text-muted-foreground italic">
        &quot;Hare Krishna Hare Krishna, Krishna Krishna Hare Hare, Hare Rama Hare Rama, Rama Rama Hare Hare&quot;
      </p>
    </main>
  )
}