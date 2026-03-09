import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  CalendarCheck, LayoutDashboard, Search, BookOpen,
  Building2, Users, LogOut, CalendarDays,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const employeeLinks = [
    { path: '/dashboard',  label: 'Dashboard',       Icon: LayoutDashboard },
    { path: '/resources',  label: 'Browse Resources', Icon: Search },
    { path: '/bookings',   label: 'My Bookings',      Icon: CalendarDays },
  ]

  const adminLinks = [
    { path: '/admin',           label: 'Dashboard',    Icon: LayoutDashboard },
    { path: '/admin/bookings',  label: 'All Bookings', Icon: CalendarDays },
    { path: '/admin/resources', label: 'Resources',    Icon: Building2 },
    { path: '/admin/users',     label: 'Users',        Icon: Users },
  ]

  const links = user.role === 'Admin' ? adminLinks : employeeLinks

  const isActive = (path) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path)

  return (
    <nav className="bg-indigo-700 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">
              K<span className="text-indigo-200">Reserve</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex gap-1">
            {links.map(({ path, label, Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'bg-white/20 text-white'
                    : 'text-indigo-100 hover:bg-white/10'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-xs text-indigo-300 leading-tight">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-red-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
