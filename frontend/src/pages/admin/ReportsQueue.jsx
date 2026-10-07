import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Car,
  ArrowLeft,
  User,
  Shield
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { getAllReports, updateReportStatus } from '../../services/api';

const ReportsQueue = () => {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const params = statusFilter ? { status: statusFilter } : {};
        const res = await getAllReports(params);
        setReports(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [statusFilter, refreshKey]);

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      setUpdatingId(reportId);
      await updateReportStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update report status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Open
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Investigating
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-secondary text-muted-foreground border border-border">
            <XCircle className="w-3 h-3" /> Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Center</span>
            </Link>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>SAFETY TRIAGE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2.5">
              Safety Reports Moderation Queue
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Review and triage student conduct, punctuality, and campus safety incident complaints.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="text-xs h-9 border-border bg-card hover:bg-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All Reports', value: '' },
            { label: 'Open', value: 'open' },
            { label: 'Investigating', value: 'investigating' },
            { label: 'Resolved', value: 'resolved' },
            { label: 'Dismissed', value: 'dismissed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-[var(--radius)] text-xs font-mono font-semibold transition cursor-pointer border ${
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground hover:bg-secondary border-border hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reports Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-mono">Loading safety incident reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-card rounded-[var(--radius)] border border-border p-12 text-center text-muted-foreground text-sm">
              <p className="font-serif text-base font-bold text-foreground mb-1">Queue Clear</p>
              No reports found in this status category.
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report._id}
                className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs transition hover:border-primary/40 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-border/80 gap-3">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(report.status)}
                    <span className="text-xs font-mono text-muted-foreground">
                      Filed on {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Quick Action Triage */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-muted-foreground">Triage:</span>
                    {report.status !== 'investigating' && (
                      <button
                        onClick={() => handleStatusChange(report._id, 'investigating')}
                        disabled={updatingId === report._id}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-mono font-medium rounded border border-amber-200 transition cursor-pointer"
                      >
                        Investigate
                      </button>
                    )}
                    {report.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange(report._id, 'resolved')}
                        disabled={updatingId === report._id}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-mono font-medium rounded border border-emerald-200 transition cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                    {report.status !== 'dismissed' && (
                      <button
                        onClick={() => handleStatusChange(report._id, 'dismissed')}
                        disabled={updatingId === report._id}
                        className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-muted-foreground text-xs font-mono font-medium rounded border border-border transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-rose-50/50 rounded-[var(--radius)] border border-rose-200/70 space-y-1">
                    <span className="font-mono font-semibold uppercase tracking-wider text-rose-900 block flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-rose-700" />
                      Accused User
                    </span>
                    <p className="text-foreground font-serif font-bold text-sm">{report.against?.name || report.against}</p>
                    <p className="text-muted-foreground font-mono text-[11px]">{report.against?.email || report.against}</p>
                  </div>
                  <div className="p-3.5 bg-secondary/30 rounded-[var(--radius)] border border-border space-y-1">
                    <span className="font-mono font-semibold uppercase tracking-wider text-muted-foreground block flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Reported By
                    </span>
                    <p className="text-foreground font-serif font-bold text-sm">{report.reportedBy?.name || report.reportedBy}</p>
                    <p className="text-muted-foreground font-mono text-[11px]">{report.reportedBy?.email || report.reportedBy}</p>
                  </div>
                </div>

                {report.rideId && (
                  <div className="px-3.5 py-2.5 bg-secondary/40 rounded-[var(--radius)] text-xs text-foreground flex items-center gap-2 border border-border font-mono">
                    <Car className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      Associated Trip: <strong>{report.rideId.origin?.label} → {report.rideId.destination?.label}</strong> ({report.rideId.date} at {report.rideId.departureTime})
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Incident Description:
                  </span>
                  <p className="text-sm text-foreground bg-background p-3.5 rounded-[var(--radius)] border border-border leading-relaxed font-sans">
                    {report.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsQueue;