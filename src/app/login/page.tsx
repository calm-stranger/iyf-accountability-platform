import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  // Next.js 15 treats searchParams as a Promise
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <Card className="w-full max-w-md border-stone-200 shadow-sm bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-stone-800">
            Sadhana Tracker
          </CardTitle>
          <CardDescription className="text-stone-500">
            A gentle path to spiritual consistency
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {searchParams.error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-md">
              {searchParams.error}
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-stone-100">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* LOGIN FORM */}
            <TabsContent value="login">
              <form action={login} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="your@email.com" className="bg-stone-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required className="bg-stone-50" />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  Enter
                </Button>
              </form>
            </TabsContent>

            {/* REGISTER FORM */}
            <TabsContent value="register">
              <form action={signup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" type="text" required placeholder="Bhakta John" className="bg-stone-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" required placeholder="your@email.com" className="bg-stone-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password (Min 6 characters)</Label>
                  <Input id="reg-password" name="password" type="password" required className="bg-stone-50" />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

        </CardContent>
      </Card>
    </div>
  )
}