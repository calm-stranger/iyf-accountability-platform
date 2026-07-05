export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen calm-gradient flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] warm-glow -z-10 pointer-events-none" />
      <div className="animate-fade-in-up w-full flex justify-center z-10">
        {children}
      </div>
    </div>
  )
}