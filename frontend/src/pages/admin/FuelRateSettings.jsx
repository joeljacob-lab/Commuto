import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Fuel, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Calendar,
  User
} from 'lucide-react';
import { Button } from '../../components/ui/button';
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
          setHistory(historyRes.data.history || []);
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
      setTimeout(() => setStatus({ error: '', success: '' }), 4000);
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
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-border">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Center</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
            <Fuel className="w-3.5 h-3.5" />
            <span>COMMUTE TARIFF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
            Fuel Rate Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Campus-wide official fuel rate used to calculate fair equal split ride costs across all student corridors.
          </p>
        </div>

        {status.error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{status.error}</span>
          </div>
        )}
        {status.success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{status.success}</span>
          </div>
        )}

        {/* Current Rate Card & Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Current Active Rate
              </span>
              <div className="mt-3 flex items-baseline">
                <span className="text-4xl font-serif font-bold text-primary font-mono">
                  ₹{currentRate ? Number(currentRate.pricePerLitre).toFixed(2) : '--'}
                </span>
                <span className="ml-2 text-xs text-muted-foreground font-mono">/ litre</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border/80 text-xs text-muted-foreground font-mono">
              {currentRate?.isDefault ? (
                <span className="text-amber-800 font-medium">System Default (Please set an initial rate)</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Effective:{' '}
                  {currentRate?.effectiveDate
                    ? new Date(currentRate.effectiveDate).toLocaleDateString()
                    : '--'}
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-card border border-border rounded-[var(--radius)] p-6 shadow-xs space-y-3">
            <h2 className="text-base font-serif font-bold text-foreground">Update Campus Fuel Rate</h2>
            <p className="text-xs text-muted-foreground">
              All upcoming rides snapshot this price at midnight generation. Past completed trips retain their original rate.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end pt-2">
              <div className="flex-1 w-full">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  New Price Per Litre (INR)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground text-sm font-mono">
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
                    className="w-full bg-background border border-border rounded-[var(--radius)] pl-8 pr-3 py-2 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || loading}
                className="w-full sm:w-auto bg-primary hover:bg-[#832323] text-primary-foreground text-xs font-semibold px-5 py-2.5 h-9"
              >
                {submitting ? 'Updating...' : 'Set Fuel Rate'}
              </Button>
            </form>
          </div>
        </div>

        {/* Audit Log / History Table */}
        <div className="bg-card border border-border rounded-[var(--radius)] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-secondary/20">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-primary" />
              Fuel Rate History (Audit Log)
            </h2>
            <span className="text-xs font-mono text-muted-foreground">Append-only audit ledger</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">No historical updates recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 text-muted-foreground font-mono font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Rate / Litre</th>
                    <th className="px-6 py-3">Effective Date</th>
                    <th className="px-6 py-3">Set By Admin</th>
                    <th className="px-6 py-3 text-right">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground">
                  {history.map((item, index) => (
                    <tr key={item._id} className={index === 0 ? 'bg-secondary/20' : 'hover:bg-secondary/10 transition'}>
                      <td className="px-6 py-3 font-mono font-bold text-primary">
                        ₹{Number(item.pricePerLitre).toFixed(2)}
                        {index === 0 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-foreground">
                        {new Date(item.effectiveDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-primary shrink-0" />
                          {item.setBy ? `${item.setBy.name} (${item.setBy.email})` : 'System Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-right font-mono text-[11px]">
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