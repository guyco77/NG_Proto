'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'At least 1 uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least 1 number', test: (p: string) => /\d/.test(p) },
  { label: 'At least 1 special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

function getPasswordStrength(password: string): { level: 'weak' | 'medium' | 'strong'; metCount: number } {
  const metCount = passwordRequirements.filter((req) => req.test(password)).length
  if (metCount < 3) return { level: 'weak', metCount }
  if (metCount === 3) return { level: 'medium', metCount }
  return { level: 'strong', metCount }
}

// Simulated invite data
const inviteData = {
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex.johnson@company.com',
  role: 'Project Manager',
}

function SetupContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'expired' | 'invalid' | 'used' | 'loading'>('loading')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    // Simulate token validation
    const validateToken = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      // For demo purposes, accept any token
      if (token) {
        setTokenStatus('valid')
      } else {
        setTokenStatus('invalid')
      }
    }
    validateToken()
  }, [token])

  const strength = getPasswordStrength(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const allRequirementsMet = strength.metCount === 4
  const canSubmit = allRequirementsMet && passwordsMatch && !isLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    router.push('/dashboard?welcome=true')
  }

  const handleSSOSetup = async (provider: 'google' | 'microsoft') => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    router.push('/dashboard?welcome=true')
  }

  if (tokenStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Validating invite link...</p>
        </div>
      </div>
    )
  }

  if (tokenStatus !== 'valid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">
              {tokenStatus === 'expired' && 'Invite Expired'}
              {tokenStatus === 'invalid' && 'Invalid Invite'}
              {tokenStatus === 'used' && 'Invite Already Used'}
            </CardTitle>
            <CardDescription>
              {tokenStatus === 'expired' && 'This invite link has expired (72 hours). Please contact your administrator for a new invite.'}
              {tokenStatus === 'invalid' && 'This invite link is invalid. Please contact your administrator.'}
              {tokenStatus === 'used' && 'This invite link has already been used. If you need access, please contact your administrator.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline" className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-foreground"
          >
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xl font-semibold text-foreground">GUNO</span>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl">Welcome to GUNO Studio</CardTitle>
            <CardDescription>
              Hi {inviteData.firstName}, set up your account to get started.
            </CardDescription>
            <div className="flex justify-center pt-2">
              <Badge variant="secondary" className="text-sm">
                {inviteData.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">Create Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="mt-1.5 text-sm text-destructive">Passwords do not match</p>
                  )}
                </Field>
              </FieldGroup>

              {/* Password Strength Bar */}
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div className={`h-1.5 flex-1 rounded-full ${strength.level === 'weak' ? 'bg-destructive' : strength.level === 'medium' ? 'bg-warning' : 'bg-success'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${strength.level === 'medium' || strength.level === 'strong' ? (strength.level === 'medium' ? 'bg-warning' : 'bg-success') : 'bg-muted'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${strength.level === 'strong' ? 'bg-success' : 'bg-muted'}`} />
                  </div>
                  <p className={`text-xs font-medium ${strength.level === 'weak' ? 'text-destructive' : strength.level === 'medium' ? 'text-warning' : 'text-success'}`}>
                    {strength.level === 'weak' && 'Weak password'}
                    {strength.level === 'medium' && 'Medium strength'}
                    {strength.level === 'strong' && 'Strong password'}
                  </p>
                </div>
              )}

              {/* Requirements Checklist */}
              <div className="space-y-1.5">
                {passwordRequirements.map((req, index) => {
                  const met = req.test(password)
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {met ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={met ? 'text-success' : 'text-muted-foreground'}>
                        {req.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {isLoading ? 'Creating account...' : 'Create My Account'}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full justify-center gap-2"
                  onClick={() => handleSSOSetup('google')}
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full justify-center gap-2"
                  onClick={() => handleSSOSetup('microsoft')}
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  Continue with Microsoft
                </Button>
              </div>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SetupContent />
    </Suspense>
  )
}
