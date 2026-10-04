import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Car
} from 'lucide-react';
import { getAllReports, updateReportStatus } from '../../services/api';

const ReportsQueue = () => {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refresh without linter warnings

  // Linter-friendly data fetching pattern
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
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"><AlertTriangle className="w-3 h-3" /> Open</span>;
      case 'investigating':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> Investigating</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Resolved</span>;
      case 'dismissed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><XCircle className="w-3 h-3" /> Dismissed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-rose-600" />
              Safety Reports Moderation Queue
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review and triage student conduct and safety incident complaints.
            </p>
          </div>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mt-6">
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reports Feed */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              Loading safety reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              No reports found in this status category.
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(report.status)}
                    <span className="text-xs text-slate-400">
                      Filed on {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Quick Action Triage */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Triage:</span>
                    {report.status !== 'investigating' && (
                      <button
                        onClick={() => handleStatusChange(report._id, 'investigating')}
                        disabled={updatingId === report._id}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded border border-amber-200 transition cursor-pointer"
                      >
                        Investigate
                      </button>
                    )}
                    {report.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange(report._id, 'resolved')}
                        disabled={updatingId === report._id}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded border border-emerald-200 transition cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                    {report.status !== 'dismissed' && (
                      <button
                        onClick={() => handleStatusChange(report._id, 'dismissed')}
                        disabled={updatingId === report._id}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded border border-slate-200 transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 text-xs">
                  <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                    <span className="font-semibold text-rose-900 block mb-1">Accused User</span>
                    <p className="text-slate-800 font-medium">{report.against?.name || report.against}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{report.against?.email || report.against}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-1">Reported By</span>
                    <p className="text-slate-800 font-medium">{report.reportedBy?.name || report.reportedBy}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{report.reportedBy?.email || report.reportedBy}</p>
                  </div>
                </div>

                {report.rideId && (
                  <div className="mb-3 px-3 py-2 bg-indigo-50/40 rounded-lg text-xs text-indigo-900 flex items-center gap-2 border border-indigo-100">
                    <Car className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>
                      Associated Trip: <strong>{report.rideId.origin?.label} → {report.rideId.destination?.label}</strong> ({report.rideId.date} at {report.rideId.departureTime})
                    </span>
                  </div>
                )}

                <div className="mt-3">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Incident Description:
                  </span>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
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