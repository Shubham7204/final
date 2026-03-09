import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, CalendarDays, CheckCircle2,
  DoorOpen, Armchair, Wrench,
  MapPin, Clock, Loader2, Inbox, Plus,
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function ResourceIcon({ type, className = '' }) {
  const props = { size: 18, className }
  if (type === 'MeetingRoom') return <DoorOpen {...props} />
  if (type === 'Desk') return <Armchair {...props} />
  return <Wrench {...props} />
}

function StatCard({ label, value, Icon, borderColor }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
      status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {status}
    </span>
  )
}

const fmt = (dt) =>
  new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function Dashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/bookings/my')
      .then(r => setBookings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const upcoming = bookings.filter(b => b.status === 'Active' && new Date(b.startTime) > now)
  const todayBookings = bookings.filter(b => {
    const d = new Date(b.startTime)
    return b.status === 'Active' && d.toDateString() === now.toDateString()
  })
  const activeCount = bookings.filter(b => b.status === 'Active').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name} 👋</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your booking overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Upcoming Bookings" value={upcoming.length} Icon={Calendar} borderColor="border-indigo-500" />
        <StatCard label="Today's Bookings" value={todayBookings.length} Icon={CalendarDays} borderColor="border-green-500" />
        <StatCard label="Total Active" value={activeCount} Icon={CheckCircle2} borderColor="border-blue-500" />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/resources"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm"
        >
          <Plus size={16} /> Book a Resource
        </Link>
        <Link
          to="/bookings"
          className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
        >
          View All My Bookings
        </Link>
      </div>

      {/* Upcoming Bookings List */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Upcoming Bookings</h2>
          {upcoming.length > 5 && (
            <Link to="/bookings" className="text-sm text-indigo-600 hover:underline">View all →</Link>
          )}
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
            Loading…
          </div>
        ) : upcoming.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Inbox size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No upcoming bookings.</p>
            <Link to="/resources" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
              Book a resource now →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcoming.slice(0, 6).map(b => (
              <div key={b.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <ResourceIcon type={b.resourceType} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{b.resourceName}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {b.resourceLocation}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1 justify-end">
                    <Clock size={12} /> {fmt(b.startTime)}
                  </p>
                  <p className="text-xs text-gray-400">→ {fmt(b.endTime)}</p>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
