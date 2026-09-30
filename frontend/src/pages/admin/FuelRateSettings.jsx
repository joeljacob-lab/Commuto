import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentFuelRate, getFuelRateHistory, setFuelRate } from '../../services/api';

function FuelRateSettings() {
  const [currentRate, setCurrentRate] = useState(null);
  const [history, setHistory] = useState([]);
  const [priceInput, setPriceInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ error: '', success: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      try {
        const [currentRes, historyRes] = await Promise.all([
          getCurrentFuelRate(),
          getFuelRateHistory(),
        ]);

        if (!ignore) {
          setCurrentRate(currentRes.data.fuelRate);
          setHistory(historyRes.data.history);
          if (currentRes.data.fuelRate?.pricePerLitre) {
            setPriceInput(currentRes.data.fuelRate.pricePerLitre.toString());
          }
        }
      } catch (err) {
        if (!ignore) {
          setStatus({
            error: err.response?.data?.message || 'Failed to load fuel rate data',
            success: '',
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });
    setSubmitting(true);

    try {
      await setFuelRate({ pricePerLitre: Number(priceInput) });
      setStatus({ error: '', success: 'Fuel rate updated successfully!' });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setStatus({
        error: err.response?.data?.message || 'Failed to update fuel rate',
        success: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-indigo-600 hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-6">Fuel Rate Settings</h1>

        {status.error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {status.error}
          </div>
        )}
        {status.success && (
          <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
            {status.success}
          </div>
        )}

        {/* Current Rate Card & Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Active Rate
              </span>
              <div className="mt-3 flex items-baseline">
                <span className="text-4xl font-extrabold text-indigo-600">
                  ₹{currentRate ? currentRate.pricePerLitre.toFixed(2) : '--'}
                </span>
                <span className="ml-2 text-sm text-slate-500 font-medium">/ litre</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              {currentRate?.isDefault ? (
                <span className="text-amber-600 font-medium">System Default (Please set an initial rate)</span>
              ) : (
                <span>
                  Effective since:{' '}
                  {currentRate?.effectiveDate
                    ? new Date(currentRate.effectiveDate).toLocaleDateString()
                    : '--'}
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-2">Update Campus Fuel Rate</h2>
            <p className="text-xs text-slate-500 mb-4">
              All upcoming rides snapshot this price at midnight generation. Past rides will preserve their original rate.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  New Price Per Litre (INR)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 105.50"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm px-5 py-2.5 rounded-md transition cursor-pointer"
              >
                {submitting ? 'Updating...' : 'Set Fuel Rate'}
              </button>
            </form>
          </div>
        </div>

        {/* Audit Log / History Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              Fuel Rate History (Audit Log)
            </h2>
            <span className="text-xs text-slate-400 font-medium">Append-only records</span>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No historical updates recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Rate / Litre</th>
                    <th className="px-6 py-3 font-medium">Effective Date</th>
                    <th className="px-6 py-3 font-medium">Set By Admin</th>
                    <th className="px-6 py-3 font-medium text-right">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item, index) => (
                    <tr key={item._id} className={index === 0 ? 'bg-indigo-50/30' : ''}>
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        ₹{item.pricePerLitre.toFixed(2)}
                        {index === 0 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {new Date(item.effectiveDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {item.setBy ? `${item.setBy.name} (${item.setBy.email})` : 'System Admin'}
                      </td>
                      <td className="px-6 py-3 text-slate-400 text-right text-xs">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FuelRateSettings;