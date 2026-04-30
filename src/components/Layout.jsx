import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/rankings', label: 'Rankings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="font-bold text-xl tracking-tight">ExpenseRank</span>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-900 text-white'
                          : 'text-indigo-200 hover:bg-indigo-600'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span className="text-indigo-200 text-sm">Hello, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-indigo-900 hover:bg-indigo-800 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
            <button
              className="md:hidden text-indigo-200 hover:text-white p-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-indigo-600 px-4 py-2 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'bg-indigo-900 text-white' : 'text-indigo-200 hover:bg-indigo-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 text-sm text-indigo-200 hover:bg-indigo-600 rounded-md"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
