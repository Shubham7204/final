import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, CheckCircle2, XCircle, Armchair,
  Building2, Users, Trophy, CalendarCheck,
  ClipboardList, UserRound, Loader2,
} from 'lucide-react'
import api from '../../api/axios'

function StatCard({ label, value, Icon, borderColor, linkTo, linkLabel }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
          {linkTo && (
            <Link to={linkTo} className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
              {linkLabel}
            </Link>
          )}
        </div>
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-400">
        <Loader2 size={36} className="mx-auto mb-3 animate-spin text-indigo-400" />
        Loading stats…
      </div>
    )
  }

  const quickActions = [
    { to: '/admin/bookings', Icon: ClipboardList, label: 'Manage Bookings', desc: 'View, filter and cancel all bookings' },
    { to: '/admin/resources', Icon: Building2, label: 'Manage Resources', desc: 'Add, edit or deactivate resources' },
    { to: '/admin/users', Icon: UserRound, label: 'View Users', desc: 'See all registered employees' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview — {new Date().toDateString()}</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bookings Today" value={stats?.bookingsToday} Icon={CalendarDays} borderColor="border-indigo-500" linkTo="/admin/bookings" linkLabel="View all →" />
        <StatCard label="Total Active" value={stats?.totalActiveBookings} Icon={CheckCircle2} borderColor="border-green-500" />
        <StatCard label="Cancelled" value={stats?.totalCancelledBookings} Icon={XCircle} borderColor="border-red-400" />
        <StatCard label="Desks Available Today" value={stats?.availableDesksToday} Icon={Armchair} borderColor="border-yellow-500" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Resources" value={stats?.totalResources} Icon={Building2} borderColor="border-blue-500" linkTo="/admin/resources" linkLabel="Manage →" />
        <StatCard label="Total Employees" value={stats?.totalEmployees} Icon={Users} borderColor="border-purple-500" linkTo="/admin/users" linkLabel="View users →" />
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-orange-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Most Booked Resource</p>
              <p className="text-xl font-bold text-gray-800 mt-1 truncate">
                {stats?.mostBookedResource || 'N/A'}
              </p>
              {stats?.mostBookedCount > 0 && (
                <p className="text-sm text-gray-400 mt-1">{stats.mostBookedCount} bookings total</p>
              )}
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-orange-400">
              <Trophy size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick navigation */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map(({ to, Icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
              <Icon size={22} />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{label}</p>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
