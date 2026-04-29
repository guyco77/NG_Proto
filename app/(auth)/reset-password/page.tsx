'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

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

function ResetPasswordContent() {
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
    router.push('/login?reset=success')
  }

  if (tokenStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Validating reset link...</p>
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
              {tokenStatus === 'expired' && 'Link Expired'}
              {tokenStatus === 'invalid' && 'Invalid Link'}
              {tokenStatus === 'used' && 'Link Already Used'}
            </CardTitle>
            <CardDescription>
              {tokenStatus === 'expired' && 'This password reset link has expired. Please request a new one.'}
              {tokenStatus === 'invalid' && 'This password reset link is invalid. Please request a new one.'}
              {tokenStatus === 'used' && 'This password reset link has already been used. Please request a new one if needed.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/forgot-password">
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>
              Create a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">New Password</FieldLabel>
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
                {isLoading ? 'Setting password...' : 'Set New Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
