import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  User, 
  ExternalLink,
  ShieldCheck 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { getPendingVehicles, updateVehicleStatus } from '../../services/api';

function VehicleVerificationQueue() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadVehicles = async () => {
      try {
        setLoading(true);
        const { data } = await getPendingVehicles();
        if (!ignore) {
          setVehicles(data.vehicles || []);
        }
      } catch (err) {
        console.error('Failed to load vehicles', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadVehicles();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  const handleAction = async (id, status) => {
    if (!window.confirm(`Mark vehicle ${id} as ${status}?`)) return;
    try {
      await updateVehicleStatus(id, status);
      setActionSuccess(`Vehicle ${id} marked as ${status}.`);
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch {
      alert(`Failed to update vehicle status.`);
    }
  };

  return (
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Center</span>
            </Link>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SAFETY INSPECTION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              Vehicle Verification Queue
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Verify submitted RC books and insurance papers before clearing student vehicles for campus carpools.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="text-xs h-9 border-border bg-card hover:bg-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">Loading pending vehicle registrations...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-card border border-border rounded-[var(--radius)] p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-secondary text-primary rounded-full flex items-center justify-center mx-auto border border-border">
              <Car className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-serif font-bold text-foreground">Queue Clear</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              There are no pending vehicles waiting for admin review at this moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((v) => (
              <div
                key={v._id}
                className="bg-card border border-border p-6 rounded-[var(--radius)] shadow-xs flex flex-col sm:flex-row justify-between gap-5 hover:border-primary/30 transition-all"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-base font-bold text-primary bg-secondary/80 px-2.5 py-0.5 rounded border border-border">
                      {v._id}
                    </span>
                    <span className="font-serif font-bold text-foreground text-base">
                      {v.model}
                    </span>
                    <span className="text-xs font-mono uppercase bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded border border-border">
                      {v.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Owner: <strong className="text-foreground">{v.ownerId?.name || 'Driver'}</strong> ({v.ownerId?.email || v.ownerId})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground bg-secondary/30 p-2.5 rounded-[var(--radius)] border border-border/70">
                    <span>Seats: <strong className="text-foreground">{v.seats}</strong></span>
                    <span className="text-border">•</span>
                    <span>Mileage: <strong className="text-foreground">{v.mileageKmpl} kmpl</strong></span>
                    <span className="text-border">•</span>
                    <span>Color: <strong className="text-foreground capitalize">{v.color || 'Standard'}</strong></span>
                  </div>

                  {/* Documents Attachments */}
                  <div className="pt-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Uploaded RC &amp; Insurance Documents:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {v.documentUrls && v.documentUrls.length > 0 ? (
                        v.documentUrls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-primary bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded-[var(--radius)] border border-border transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Document {i + 1}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
                          </a>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No document links available</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approve / Reject buttons */}
                <div className="flex sm:flex-col justify-end gap-2.5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                  <Button
                    onClick={() => handleAction(v._id, 'approved')}
                    className="bg-[#1b6a43] hover:bg-[#155334] text-white text-xs font-semibold h-9 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction(v._id, 'rejected')}
                    className="text-xs h-9 font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-border hover:border-rose-200"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VehicleVerificationQueue;