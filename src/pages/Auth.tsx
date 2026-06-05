import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// ✅ FIXED: Use EXACT Vercel URL - no environment variables
const SUPABASE_URL = 'https://yhcvhrcolriymnwdorjm.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY3ZocmNvbHJpeW1ud2RvcmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MjUwNTIsImV4cCI6MjA5NjIwMTA1Mn0.l_8ptH6wTHqHBoXZkTkYUH67ZtSC26w8_VZJHgS2bSs'

// ✅ FIXED: Use EXACT Vercel URL for redirects
const REDIRECT_URL = 'https://helola-laasyapriyagali-creator.vercel.app/auth/v1/callback'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface AuthProps {
  onLogin?: (user: any) => void
}

export default function Auth({ onLogin }: AuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [view, setView] = useState<'login' | 'signup' | 'phone' | 'verify'>('login')

  // ✅ GOOGLE LOGIN - Fixed redirect URL
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    console.log('Google Login: Redirect URL =', REDIRECT_URL)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URL  // ✅ EXACT URL - not window.location.origin
      }
    })
    
    if (error) {
      console.error('Google Error:', error)
      setError(error.message)
    } else {
      console.log('Google Response:', data)
    }
    setLoading(false)
  }

  // ✅ PHONE LOGIN - Fixed redirect URL
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    console.log('Sending OTP to:', phone)

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms',
        redirectTo: REDIRECT_URL  // ✅ EXACT URL
      }
    })

    if (error) {
      console.error('Phone Error:', error)
      setError(error.message)
    } else {
      console.log('OTP Sent:', data)
      setSuccess('OTP sent to your phone!')
      setView('verify')
    }
    setLoading(false)
  }

  // ✅ VERIFY PHONE OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    console.log('Verifying OTP:', otp, 'for phone:', phone)

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp
    })

    if (error) {
      console.error('Verify Error:', error)
      setError(error.message)
    } else {
      console.log('Verified:', data)
      setSuccess('Login successful!')
      if (onLogin) onLogin(data.user)
    }
    setLoading(false)
  }

  // ✅ EMAIL MAGIC LINK - Fixed redirect URL
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    console.log('Sending Magic Link to:', email, 'Redirect URL:', REDIRECT_URL)

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: REDIRECT_URL  // ✅ EXACT URL - not window.location.origin
      }
    })

    if (error) {
      console.error('Email Error:', error)
      setError(error.message)
    } else {
      console.log('Magic Link Sent:', data)
      setSuccess('✅ Check your email for the magic link!')
    }
    setLoading(false)
  }

  // ✅ SIGN UP WITH PASSWORD
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (error) {
      console.error('SignUp Error:', error)
      setError(error.message)
    } else {
      console.log('SignUp Success:', data)
      setSuccess('✅ Account created! Check your email to verify.')
      setView('login')
    }
    setLoading(false)
  }

  // ✅ SIGN OUT
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px', color: '#1f2937' }}>
          🔐 {view === 'login' && ' Welcome Back '}
          {view === 'signup' && ' Create Account '}
          {view === 'phone' && ' Phone Login '}
          {view === 'verify' && ' Verify OTP '}
        </h1>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            ❌ {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {success}
          </div>
        )}

        {/* ==================== LOGIN VIEW ==================== */}
        {view === 'login' && (
          <>

            {/* 🔴 GOOGLE LOGIN BUTTON */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ 
                width: '100%', 
                backgroundColor: '#4285F4', 
                color: 'white', 
                padding: '16px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                marginBottom: '16px', 
                border: 'none', 
                cursor: 'pointer', 
                opacity: loading ? 0.5 : 1,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              🔴 Continue with Google
            </button>

            <div style={{ position: 'relative', margin: '20px 0' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, borderTop: '1px solid #e5e7eb' }}></div>
              <div style={{ position: 'relative', textAlign: 'center', backgroundColor: 'white', width: 'fit-content', margin: '0 auto', padding: '0 12px' }}>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>or</span>
              </div>
            </div>

            {/* 📧 EMAIL MAGIC LINK */}
            <form onSubmit={handleEmailLogin} style={{ marginBottom: '16px' }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  marginBottom: '12px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#374151', 
                  color: 'white', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  fontWeight: '600', 
                  border: 'none', 
                  cursor: 'pointer', 
                  opacity: loading ? 0.5 : 1,
                  fontSize: '16px'
                }}
              >
                📧 Send Magic Link
              </button>
            </form>

            {/* 📱 PHONE LOGIN BUTTON */}
            <button
              onClick={() => setView('phone')}
              style={{ 
                width: '100%', 
                backgroundColor: '#059669', 
                color: 'white', 
                padding: '16px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                marginBottom: '20px', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              📱 Login with Phone Number
            </button>

            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              Don't have an account?{' '}
              <button 
                onClick={() => setView('signup')} 
                style={{ 
                  color: '#2563eb', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  textDecoration: 'underline',
                  fontWeight: '600'
                }}
              >
                Sign Up
              </button>
            </p>
          </>
        )}

        {/* ==================== SIGN UP VIEW ==================== */}
        {view === 'signup' && (
          <form onSubmit={handleSignUp}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '14px', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                marginBottom: '12px', 
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ 
                width: '100%', 
                padding: '14px', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                marginBottom: '12px', 
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                backgroundColor: '#22c55e', 
                color: 'white', 
                padding: '16px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                border: 'none', 
                cursor: 'pointer', 
                opacity: loading ? 0.5 : 1,
                fontSize: '16px'
              }}
            >
              ✅ Create Account
            </button>
            
            <button
              onClick={() => setView('login')}
              style={{ 
                width: '100%', 
                marginTop: '16px', 
                color: '#2563eb', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Already have an account? Login
            </button>
          </form>
        )}

        {/* ==================== PHONE LOGIN VIEW ==================== */}
        {view === 'phone' && (
          <form onSubmit={handlePhoneLogin}>
            <input
              type="tel"
              placeholder="Enter phone number (+1234567890)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '14px', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                marginBottom: '12px', 
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                backgroundColor: '#059669', 
                color: 'white', 
                padding: '16px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                border: 'none', 
                cursor: 'pointer', 
                opacity: loading ? 0.5 : 1,
                fontSize: '16px'
              }}
            >
              📱 Send OTP
            </button>
            
            <button
              onClick={() => setView('login')}
              style={{ 
                width: '100%', 
                marginTop: '16px', 
                color: '#2563eb', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to Login
            </button>
          </form>
        )}

        {/* ==================== VERIFY OTP VIEW ==================== */}
        {view === 'verify' && (
          <form onSubmit={handleVerifyOTP}>
            <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
              Enter the 6-digit code sent to<br />
              <strong style={{ color: '#059669' }}>{phone}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{ 
                width: '100%', 
                padding: '14px', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                marginBottom: '12px', 
                fontSize: '20px', 
                textAlign: 'center', 
                letterSpacing: '4px',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                backgroundColor: '#059669', 
                color: 'white', 
                padding: '16px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                border: 'none', 
                cursor: 'pointer', 
                opacity: loading ? 0.5 : 1,
                fontSize: '16px'
              }}
            >
              ✅ Verify & Login
            </button>
            
            <button
              onClick={() => setView('phone')}
              style={{ 
                width: '100%', 
                marginTop: '16px', 
                color: '#2563eb', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
