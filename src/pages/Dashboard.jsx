import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  Food: 'bg-orange-100 text-orange-700',
  Transport: 'bg-blue-100 text-blue-700',
  Housing: 'bg-purple-100 text-purple-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Healthcare: 'bg-green-100 text-green-700',
  Education: 'bg-yellow-100 text-yellow-700',
  Shopping: 'bg-red-100 text-red-700',
  Utilities: 'bg-cyan-100 text-cyan-700',
  Other: 'bg-gray-100 text-gray-700',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [rankings, setRankings] = useState({ categoryRankings: [], summary: { total: 0, count: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [expRes, rankRes] = await Promise.all([
          api.get('/expenses', { params: { startDate: monthStart, sort: 'date', order: 'desc' } }),
          api.get('/expenses/rankings', { params: { period: 'month' } }),
        ]);
        setRecentExpenses(expRes.data.expenses.slice(0, 5));
        setRankings(rankRes.data);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const { summary, categoryRankings } = rankings;
  const topCategory = categoryRankings[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {user?.name}. Here is your spending summary for this month.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total This Month</p>
          <p className="text-3xl font-bold text-indigo-700 mt-1">
            PKR {summary.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{summary.count}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Top Category</p>
          {topCategory ? (
            <div className="mt-1">
              <p className="text-xl font-bold text-gray-800">{topCategory.category}</p>
              <p className="text-sm text-indigo-600 mt-0.5">{topCategory.percentage}% of spending</p>
            </div>
          ) : (
            <p className="text-xl font-bold text-gray-400 mt-1">No data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Category Rankings</h2>
            <Link to="/rankings" className="text-sm text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {categoryRankings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No expenses this month yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryRankings.slice(0, 4).map(cat => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {cat.rank}
                      </span>
                      <span className="font-medium text-gray-700">{cat.category}</span>
                    </div>
                    <span className="text-gray-700 font-medium">
                      PKR {cat.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-1.5 bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Expenses</h2>
            <Link to="/expenses" className="text-sm text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No expenses yet.{' '}
              <Link to="/expenses" className="text-indigo-600 hover:underline">
                Add one
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map(exp => (
                <div
                  key={exp._id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{exp.title}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other
                      }`}
                    >
                      {exp.category}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    PKR {exp.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
