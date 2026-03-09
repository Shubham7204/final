import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DoorOpen, Armchair, Wrench, MapPin, Clock, Loader2, Inbox, StickyNote, X, Plus } from 'lucide-react'
import api from '../api/axios'

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

function ResourceIcon({ type }) {
  const props = { size: 18 }
  if (type === 'MeetingRoom') return <DoorOpen {...props} />
  if (type === 'Desk') return <Armchair {...props} />
  return <Wrench {...props} />
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  const fetchBookings = () => {
    setLoading(true)
    api.get('/api/bookings/my')
      .then(r => setBookings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, [])

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setCancellingId(id)
    try {
      await api.delete(`/api/bookings/${id}/cancel`)
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel booking.')
    } finally {
      setCancellingId(null)
    }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">Manage your reservations</p>
        </div>
        <div className="flex gap-2">
          {['all', 'Active', 'Cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Quick book CTA */}
      <Link
        to="/resources"
        className="inline-flex items-center gap-2 mb-6 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
      >
        <Plus size={14} /> Book a New Resource
      </Link>

      <div className="bg-white rounded-2xl shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Inbox size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No {filter !== 'all' ? filter.toLowerCase() : ''} bookings found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(b => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 sm:w-10">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <ResourceIcon type={b.resourceType} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900">{b.resourceName}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={12} /> {b.resourceLocation} · {b.resourceType}</p>
                  <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                    <Clock size={12} /> {fmt(b.startTime)} → {fmt(b.endTime)}
                  </p>
                  {b.notes && (
                    <p className="text-sm text-gray-400 mt-1 italic flex items-center gap-1"><StickyNote size={12} /> {b.notes}</p>
                  )}
                </div>
                {b.status === 'Active' && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancellingId === b.id}
                    className="flex items-center gap-1.5 sm:ml-auto text-sm text-red-600 border border-red-200 px-4 py-1.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 whitespace-nowrap font-medium"
                  >
                    {cancellingId === b.id ? 'Cancelling…' : <><X size={13} /> Cancel</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
