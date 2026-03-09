import { useEffect, useState, useCallback } from 'react'
import { Loader2, Inbox } from 'lucide-react'
import api from '../../api/axios'

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

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [filters, setFilters] = useState({ status: '', from: '', to: '' })
  const [loading, setLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.from) params.from = new Date(filters.from).toISOString()
      if (filters.to) params.to = new Date(filters.to + 'T23:59:59').toISOString()
      const { data } = await api.get('/api/admin/bookings', { params })
      setBookings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    setCancellingId(id)
    try {
      await api.delete(`/api/admin/bookings/${id}/cancel`)
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel.')
    } finally {
      setCancellingId(null)
    }
  }

  const clearFilters = () => setFilters({ status: '', from: '', to: '' })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-gray-500 mt-1">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
          <input
            type="date"
            value={filters.from}
            onChange={e => setFilters(p => ({ ...p, from: e.target.value }))}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
          <input
            type="date"
            value={filters.to}
            onChange={e => setFilters(p => ({ ...p, to: e.target.value }))}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={clearFilters}
          className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
            Loading…
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Inbox size={40} className="mx-auto mb-3 text-gray-300" />
            No bookings found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['User', 'Resource', 'Time', 'Status', 'Notes', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.userName}</p>
                      <p className="text-xs text-gray-400">{b.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.resourceName}</p>
                      <p className="text-xs text-gray-400">{b.resourceLocation}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{fmt(b.startTime)}</p>
                      <p className="text-xs text-gray-400">→ {fmt(b.endTime)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {b.notes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {b.status === 'Active' && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancellingId === b.id}
                          className="text-red-600 hover:text-red-800 text-xs font-semibold disabled:opacity-50 hover:underline"
                        >
                          {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
