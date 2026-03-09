import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, AlertCircle, KeyRound } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      login(data)
      navigate(data.role === 'Admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <CalendarCheck size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">K<span className="text-indigo-600">Reserve</span></h1>
          <p className="text-gray-500 mt-1">Workspace Booking System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              <AlertCircle size={14} className="inline mr-1" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">Register</Link>
          </p>

          <div className="mt-5 p-3 bg-indigo-50 rounded-xl text-xs text-gray-600 border border-indigo-100 space-y-2">
            <p className="font-semibold text-indigo-700 flex items-center gap-1 mb-2"><KeyRound size={12} /> Demo Credentials — click to fill</p>
            <button
              type="button"
              onClick={() => setForm({ email: 'admin@smartoffice.com', password: 'Admin@123' })}
              className="w-full text-left px-3 py-2 bg-white rounded-lg border border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              <span className="font-semibold text-purple-700">Admin</span>
              <span className="ml-2 text-gray-500">admin@smartoffice.com / Admin@123</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: 'employee@smartoffice.com', password: 'Employee@123' })}
              className="w-full text-left px-3 py-2 bg-white rounded-lg border border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              <span className="font-semibold text-indigo-700">Employee</span>
              <span className="ml-2 text-gray-500">employee@smartoffice.com / Employee@123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
