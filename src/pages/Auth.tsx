import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yhcvhrcolriymnwdorjm.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY3ZocmNvbHJpeW1ud2RvcmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MjUwNTIsImV4cCI6MjA5NjIwMTA1Mn0.l_8ptH6wTHqHBoXZkTkYUH67ZtSC26w8_VZJHgS2bSs'

const supabase = createClient(supabaseUrl, supabaseKey)

// Types
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

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/v1/callback'
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    setLoading(false)
  }

  // Email Magic Link Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + '/auth/v1/callback'
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Magic link sent to your email! Check your inbox.')
    }
    setLoading(false)
  }

  // Sign Up with Email & Password
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
      setError(error.message)
    } else {
      setSuccess('Account created! You can now log in.')
      setView('login')
    }
    setLoading(false)
  }

  // Phone Login - Send OTP
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms'
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('OTP sent to your phone!')
      setView('verify')
    }
    setLoading(false)
  }

  // Verify Phone OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp
    })

    if (error) {
      setError(error.message)
    } else {
      if (onLogin) onLogin(data.user)
    }
    setLoading(false)
  }

  // Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          {view === 'login' && 'Login'}
          {view === 'signup' && 'Sign Up'}
          {view === 'phone' && 'Phone Login'}
          {view === 'verify' && 'Verify OTP'}
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Login View */}
        {view === 'login' && (
          <>
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold mb-4 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {!loading ? 'Continue with Google' : 'Loading...'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email Login */}
            <form onSubmit={handleEmailLogin} className="mb-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50"
              >
                {!loading ? 'Send Magic Link' : 'Sending...'}
              </button>
            </form>

            {/* Phone Login Link */}
            <button
              onClick={() => setView('phone')}
              className="w-full text-blue-600 hover:underline mb-4"
            >
              Login with Phone Number
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setView('signup')}
                className="text-blue-600 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </>
        )}

        {/* Sign Up View */}
        {view === 'signup' && (
          <>
            <form onSubmit={handleSignUp}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {!loading ? 'Create Account' : 'Creating...'}
              </button>
            </form>

            <button
              onClick={() => setView('login')}
              className="w-full text-blue-600 hover:underline mt-4"
            >
              Already have an account? Login
            </button>
          </>
        )}

        {/* Phone Login View */}
        {view === 'phone' && (
          <>
            <form onSubmit={handlePhoneLogin}>
              <input
                type="tel"
                placeholder="Enter phone number (+1234567890)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {!loading ? 'Send OTP' : 'Sending...'}
              </button>
            </form>

            <button
              onClick={() => setView('login')}
              className="w-full text-blue-600 hover:underline mt-4"
            >
              Back to Login
            </button>
          </>
        )}

        {/* Verify OTP View */}
        {view === 'verify' && (
          <>
            <form onSubmit={handleVerifyOTP}>
              <input
                type="text"
                placeholder="Enter OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {!loading ? 'Verify & Login' : 'Verifying...'}
              </button>
            </form>

            <button
              onClick={() => setView('phone')}
              className="w-full text-blue-600 hover:underline mt-4"
            >
              Resend OTP
            </button>
          </>
        )}
      </div>
    </div>
  )
}
