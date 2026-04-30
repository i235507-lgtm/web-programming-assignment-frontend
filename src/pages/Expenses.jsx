import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Entertainment',
  'Healthcare', 'Education', 'Shopping', 'Utilities', 'Other',
];

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

const defaultForm = { title: '', amount: '', category: 'Food', date: '', description: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [filters, setFilters] = useState({ category: '', sort: 'date', order: 'desc' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sort: filters.sort, order: filters.order };
      if (filters.category) params.category = filters.category;
      const res = await api.get('/expenses', { params });
      setExpenses(res.data.expenses);
    } catch {
      setError('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) {
      setFormError('Please fill in all required fields with valid values.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        date: form.date || undefined,
        description: form.description,
      });
      setForm(defaultForm);
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e._id !== id));
    } catch {
      setError('Failed to delete expense.');
    } finally {
      setDeleteId(null);
    }
  };

  const totalFiltered = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {expenses.length} transaction{expenses.length !== 1 ? 's' : ''} &mdash; Total: PKR {totalFiltered.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">New Expense</h2>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-4">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Grocery shopping"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional note"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? 'Adding...' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters — Interactive Feature #2 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Category</label>
            <select
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
            <select
              value={`${filters.sort}-${filters.order}`}
              onChange={e => {
                const [sort, order] = e.target.value.split('-');
                setFilters({ ...filters, sort, order });
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No expenses found. Add your first expense above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(exp => (
                  <tr key={exp._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{exp.title}</p>
                      {exp.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{exp.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other
                        }`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(exp.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      PKR {exp.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deleteId === exp._id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handleDelete(exp._id)}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteId(exp._id)}
                          className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none font-medium"
                          title="Delete expense"
                        >
                          &times;
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
