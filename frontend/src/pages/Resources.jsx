import { useState, useEffect, useCallback } from 'react'
import { DoorOpen, Armchair, Wrench, Package, MapPin, Users, Loader2, SearchX, Search } from 'lucide-react'
import api from '../api/axios'
import BookingModal from './BookingModal'

function ResourceTypeIcon({ type, className = '' }) {
  const props = { size: 22, className }
  if (type === 'MeetingRoom') return <DoorOpen {...props} />
  if (type === 'Desk') return <Armchair {...props} />
  if (type === 'Equipment') return <Wrench {...props} />
  return <Package {...props} />
}

const TYPE_COLORS = {
  MeetingRoom: 'bg-blue-100 text-blue-700',
  Desk: 'bg-green-100 text-green-700',
  Equipment: 'bg-orange-100 text-orange-700',
}

const TYPE_ICON_BG = {
  MeetingRoom: 'bg-blue-50 text-blue-600',
  Desk: 'bg-green-50 text-green-600',
  Equipment: 'bg-orange-50 text-orange-600',
}

function ResourceCard({ resource, onBook }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col p-5">
      <div className="flex justify-between items-start mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${TYPE_ICON_BG[resource.type] || 'bg-gray-100 text-gray-500'}`}>
          <ResourceTypeIcon type={resource.type} />
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[resource.type] || 'bg-gray-100 text-gray-600'}`}>
          {resource.type === 'MeetingRoom' ? 'Meeting Room' : resource.type}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{resource.name}</h3>
      <div className="space-y-1 text-sm text-gray-500 mb-4 flex-1">
        <p className="flex items-center gap-1.5"><MapPin size={13} /> {resource.location}</p>
        <p className="flex items-center gap-1.5"><Users size={13} /> Capacity: {resource.capacity}</p>
      </div>
      <button
        onClick={() => onBook(resource)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
      >
        Book Now
      </button>
    </div>
  )
}

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ type: '', capacity: '', date: '', startTime: '', endTime: '' })
  const [selectedResource, setSelectedResource] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.type) params.type = filters.type
      if (filters.capacity) params.capacity = filters.capacity
      if (filters.date) params.date = filters.date
      if (filters.startTime) params.startTime = filters.startTime
      if (filters.endTime) params.endTime = filters.endTime
      const { data } = await api.get('/api/resources', { params })
      setResources(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchResources() }, [fetchResources])

  const handleBooked = () => {
    setSelectedResource(null)
    setBookingSuccess(true)
    fetchResources()
    setTimeout(() => setBookingSuccess(false), 3000)
  }

  const clearFilters = () =>
    setFilters({ type: '', capacity: '', date: '', startTime: '', endTime: '' })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Resources</h1>
        <p className="text-gray-500 mt-1">Find and book available rooms, desks, and equipment</p>
      </div>

      {bookingSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2">
          ✓ Booking confirmed successfully!
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="MeetingRoom">Meeting Room</option>
              <option value="Desk">Desk</option>
              <option value="Equipment">Equipment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min. Capacity</label>
            <input
              type="number"
              min="1"
              value={filters.capacity}
              onChange={e => setFilters(p => ({ ...p, capacity: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Any"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={e => setFilters(p => ({ ...p, date: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Time</label>
            <input
              type="time"
              value={filters.startTime}
              onChange={e => setFilters(p => ({ ...p, startTime: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Time</label>
            <input
              type="time"
              value={filters.endTime}
              onChange={e => setFilters(p => ({ ...p, endTime: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <Loader2 size={36} className="mx-auto mb-3 animate-spin text-indigo-400" />
          Loading resources…
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm text-gray-400">
          <SearchX size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No resources match your criteria.</p>
          <button onClick={clearFilters} className="text-indigo-600 hover:underline text-sm mt-2">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
            <Search size={14} />
            {resources.length} resource{resources.length !== 1 ? 's' : ''} available
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map(r => (
              <ResourceCard key={r.id} resource={r} onBook={setSelectedResource} />
            ))}
          </div>
        </>
      )}

      {selectedResource && (
        <BookingModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  )
}
