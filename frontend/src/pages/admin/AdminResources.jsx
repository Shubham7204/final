import { useEffect, useState } from 'react'
import { Loader2, Plus, AlertCircle } from 'lucide-react'
import api from '../../api/axios'

const TYPE_COLORS = {
  MeetingRoom: 'bg-blue-100 text-blue-700',
  Desk: 'bg-green-100 text-green-700',
  Equipment: 'bg-orange-100 text-orange-700',
}

function ResourceFormModal({ resource, onSave, onClose }) {
  const isEdit = Boolean(resource?.id)
  const [form, setForm] = useState(
    resource
      ? { name: resource.name, type: resource.type, capacity: resource.capacity, location: resource.location }
      : { name: '', type: 'MeetingRoom', capacity: 1, location: '' }
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/api/resources/${resource.id}`, form)
      } else {
        await api.post('/api/resources', form)
      }
      onSave()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save resource.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Resource' : 'Add New Resource'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={14} className="inline mr-1" />{error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Board Room A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="MeetingRoom">Meeting Room</option>
              <option value="Desk">Desk</option>
              <option value="Equipment">Equipment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              min="1"
              required
              value={form.capacity}
              onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              required
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Floor 2"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : isEdit ? 'Update Resource' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminResources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editResource, setEditResource] = useState(null)

  const fetchResources = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/resources')
      setResources(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchResources() }, [])

  const handleToggleActive = async (r) => {
    const action = r.isActive ? 'Deactivate' : 'Reactivate'
    if (!confirm(`${action} "${r.name}"?`)) return
    try {
      if (r.isActive) {
        await api.delete(`/api/resources/${r.id}`)
      } else {
        await api.put(`/api/resources/${r.id}`, { isActive: true })
      }
      fetchResources()
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed.')
    }
  }

  const openCreate = () => { setEditResource(null); setShowForm(true) }
  const openEdit = (r) => { setEditResource(r); setShowForm(true) }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Resources</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage office resources</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> Add Resource
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Type', 'Capacity', 'Location', 'Status', 'Active / Total', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resources.map(r => (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${!r.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${TYPE_COLORS[r.type] || 'bg-gray-100 text-gray-600'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.capacity}</td>
                    <td className="px-4 py-3 text-gray-600">{r.location}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="text-green-600 font-medium">{r.activeBookings}</span>
                      <span className="text-gray-400"> / {r.totalBookings}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(r)}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(r)}
                          className={`text-xs font-semibold hover:underline ${
                            r.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {r.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ResourceFormModal
          resource={editResource}
          onSave={() => { setShowForm(false); fetchResources() }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
