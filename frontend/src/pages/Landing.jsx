import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  Building2,
  Monitor,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function FeatureCard({ icon: Icon, title, desc, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={22} />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function StatBadge({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-indigo-200 text-sm mt-1">{label}</p>
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const dashboardPath = user ? (user.role === 'Admin' ? '/admin' : '/dashboard') : null

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top Nav ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <CalendarCheck size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              K<span className="text-indigo-600">Reserve</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 py-24 px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-violet-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Zap size={13} />
            Smart Workspace Management
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Reserve smarter,<br />
            <span className="text-indigo-200">work better.</span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            KReserve is your corporate booking portal for meeting rooms, hot desks,
            and shared equipment — with real-time conflict detection and a clean dashboard
            for every team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={user ? dashboardPath : '/register'}
              className="flex items-center gap-2 bg-white text-indigo-700 font-bold px-7 py-3.5 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20 text-sm"
            >
              {user ? 'Open Dashboard' : 'Start for Free'} <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/10 transition-colors text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 border-t border-indigo-500 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          <StatBadge value="3 Types" label="Resources Supported" />
          <StatBadge value="Real-time" label="Conflict Detection" />
          <StatBadge value="2 Roles" label="Employee & Admin" />
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything your office needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Designed for corporate teams that need a simple, reliable way to manage shared spaces and resources.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={Building2}
              title="Meeting Rooms"
              desc="Book conference rooms by capacity and location. See availability in real-time before you reserve."
              color="bg-blue-100 text-blue-600"
            />
            <FeatureCard
              icon={Monitor}
              title="Hot Desks & Equipment"
              desc="Reserve shared desks or equipment like projectors and video kits for any time slot you need."
              color="bg-green-100 text-green-600"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Conflict Prevention"
              desc="Smart overlap detection ensures no two bookings clash for the same resource at the same time."
              color="bg-violet-100 text-violet-600"
            />
            <FeatureCard
              icon={Clock}
              title="Instant Availability Filter"
              desc="Filter resources by date, time window, type, and capacity to find exactly what you need fast."
              color="bg-orange-100 text-orange-600"
            />
            <FeatureCard
              icon={BarChart3}
              title="Admin Dashboard"
              desc="Admins get live stats — bookings today, most-used rooms, available desks, and full user history."
              color="bg-red-100 text-red-600"
            />
            <FeatureCard
              icon={Users}
              title="Role-Based Access"
              desc="Employees manage their own bookings while admins oversee the entire system from one panel."
              color="bg-indigo-100 text-indigo-600"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Book in three steps</h2>
            <p className="text-gray-500">No training required — anyone can be up and running in minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Users, title: 'Sign in', desc: 'Log in with your corporate account or register a new one in seconds.' },
              { step: '02', icon: Building2, title: 'Find a resource', desc: 'Filter by type, date, time, and capacity to find exactly what is available.' },
              { step: '03', icon: CalendarCheck, title: 'Confirm your booking', desc: 'Pick your slot, add notes, and confirm. Cancellation is always one click away.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="relative inline-flex mb-5">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Icon size={26} className="text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-violet-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step.replace('0', '')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-violet-700">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle2 size={40} className="text-indigo-200 mx-auto mb-5" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8">
            Create your account and start booking smarter today.
          </p>
          <Link
            to={user ? dashboardPath : '/register'}
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg text-sm"
          >
            {user ? 'Open Dashboard' : 'Create Free Account'} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <CalendarCheck size={15} className="text-white" />
            </div>
            <span className="font-bold text-white">K<span className="text-indigo-400">Reserve</span></span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} KReserve. All rights reserved.</p>
          <div className="flex gap-5 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
