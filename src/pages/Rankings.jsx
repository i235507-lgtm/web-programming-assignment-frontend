import { useState, useEffect } from 'react';
import api from '../services/api';

const RANK_STYLE = {
  1: { card: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-400 text-white', label: '1st', bar: 'bg-yellow-400' },
  2: { card: 'bg-gray-50 border-gray-200', badge: 'bg-gray-400 text-white', label: '2nd', bar: 'bg-gray-400' },
  3: { card: 'bg-orange-50 border-orange-200', badge: 'bg-orange-400 text-white', label: '3rd', bar: 'bg-orange-400' },
};

const DEFAULT_RANK_STYLE = {
  card: 'bg-white border-gray-100',
  badge: 'bg-indigo-100 text-indigo-700',
  bar: 'bg-indigo-400',
};

const PERIODS = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'This Month' },
  { value: 'week', label: 'This Week' },
  { value: 'year', label: 'This Year' },
];

export default function Rankings() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState({
    categoryRankings: [],
    topExpenses: [],
    summary: { total: 0, count: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/expenses/rankings', { params: { period } })
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load rankings.'))
      .finally(() => setLoading(false));
  }, [period]);

  const { categoryRankings, topExpenses, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header + Period Selector — Interactive Feature #1 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Rankings</h1>
          <p className="text-gray-500 text-sm mt-1">
            {summary.count} expenses &mdash; PKR {summary.total.toLocaleString()} total
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-white shadow text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : categoryRankings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-2xl font-bold text-gray-200 mb-2">No Data</p>
          <p className="text-gray-400 text-sm">No expense data for this period. Add some expenses first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Rankings — Core Ranking Logic */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800">Category Rankings</h2>
            <p className="text-xs text-gray-400 mb-4 mt-0.5">
              Ranked by total spend &mdash; categories with higher total spending receive a higher rank
            </p>
            <div className="space-y-3">
              {categoryRankings.map(cat => {
                const style = RANK_STYLE[cat.rank] || DEFAULT_RANK_STYLE;
                const rankLabel = RANK_STYLE[cat.rank]?.label || `#${cat.rank}`;
                return (
                  <div key={cat.category} className={`rounded-lg border p-3 ${style.card}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${style.badge}`}
                        >
                          {rankLabel}
                        </span>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{cat.category}</p>
                          <p className="text-xs text-gray-500">
                            {cat.count} transaction{cat.count !== 1 ? 's' : ''} &middot; Avg PKR {cat.avgAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-gray-900">PKR {cat.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{cat.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white bg-opacity-70 rounded-full">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${style.bar}`}
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 10 Expenses by Amount */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800">Top 10 Largest Expenses</h2>
            <p className="text-xs text-gray-400 mb-4 mt-0.5">
              Individual transactions ranked by amount
            </p>
            {topExpenses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data available.</p>
            ) : (
              <div className="space-y-2">
                {topExpenses.map((exp, i) => (
                  <div
                    key={exp._id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-gray-400 text-white' :
                        i === 2 ? 'bg-orange-400 text-white' :
                        'bg-indigo-100 text-indigo-600'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{exp.title}</p>
                      <p className="text-xs text-gray-400">
                        {exp.category} &middot; {new Date(exp.date).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                      PKR {exp.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insight Card */}
      {!loading && categoryRankings.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-5">
          <h3 className="font-semibold text-indigo-800 mb-1">Spending Insight</h3>
          <p className="text-sm text-indigo-700">
            Your highest spending category is <strong>{categoryRankings[0]?.category}</strong> at{' '}
            <strong>PKR {categoryRankings[0]?.totalAmount.toLocaleString()}</strong> ({categoryRankings[0]?.percentage}% of total).
            {categoryRankings.length > 1 && (
              <>
                {' '}Your lowest ranked category is{' '}
                <strong>{categoryRankings[categoryRankings.length - 1]?.category}</strong> at{' '}
                <strong>PKR {categoryRankings[categoryRankings.length - 1]?.totalAmount.toLocaleString()}</strong>.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
