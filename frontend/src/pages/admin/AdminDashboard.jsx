import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Car,
  ShieldAlert,
  IndianRupee,
  Award,
  RefreshCw,
  Search,
  Building2,
  Fuel,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/toaster';
import { getAdminStats, getAdminUsers } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsRes, usersRes] = await Promise.all([
          getAdminStats(),
          getAdminUsers({ search: userSearch, role: roleFilter }),
        ]);
        setStats(statsRes.data.data);
        setUsers(usersRes.data.data || []);
      } catch (error) {
        console.error('Failed to load admin stats:', error);
        toast.error('Failed to load administrator statistics', { title: 'Admin Sync' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roleFilter, refreshKey, userSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CAMPUS OVERSIGHT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              Admin Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Platform-wide performance KPIs, fleet approvals, incident safety triage, and student directory.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setRefreshKey(prev => prev + 1);
              toast.info('Refreshing platform metrics and campus directory...', { title: 'Admin Sync' });
            }}
            className="text-xs h-9 border-border bg-card hover:bg-secondary transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Quick Admin Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/admin/vehicles/pending"
            className="p-4 bg-card border border-border rounded-[var(--radius)] hover:border-primary/40 hover:shadow-xs transition group space-y-1.5"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-primary transition">
              <Car className="w-5 h-5 text-primary" />
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-serif font-bold text-foreground block">Vehicle Queue</span>
            <span className="text-xs font-mono text-muted-foreground">
              {stats?.vehicles?.pending || 0} pending review
            </span>
          </Link>

          <Link
            to="/admin/reports"
            className="p-4 bg-card border border-border rounded-[var(--radius)] hover:border-primary/40 hover:shadow-xs transition group space-y-1.5"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-primary transition">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-serif font-bold text-foreground block">Safety Reports</span>
            <span className="text-xs font-mono text-muted-foreground">
              {stats?.reports?.open || 0} open complaints
            </span>
          </Link>

          <Link
            to="/admin/fuel-rates"
            className="p-4 bg-card border border-border rounded-[var(--radius)] hover:border-primary/40 hover:shadow-xs transition group space-y-1.5"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-primary transition">
              <Fuel className="w-5 h-5 text-emerald-600" />
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-serif font-bold text-foreground block">Fuel Rates</span>
            <span className="text-xs font-mono text-muted-foreground">Adjust campus rate</span>
          </Link>

          <Link
            to="/admin/departments"
            className="p-4 bg-card border border-border rounded-[var(--radius)] hover:border-primary/40 hover:shadow-xs transition group space-y-1.5"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-primary transition">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-serif font-bold text-foreground block">Departments</span>
            <span className="text-xs font-mono text-muted-foreground">Manage programs</span>
          </Link>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Users */}
          <div className="bg-card rounded-[var(--radius)] border border-border p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Campus Students</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-serif font-bold text-foreground">{stats?.users?.total || 0}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span className="bg-secondary/70 border border-border px-2 py-0.5 rounded">
                {stats?.users?.riders || 0} Riders
              </span>
              <span className="bg-secondary/70 border border-border px-2 py-0.5 rounded">
                {stats?.users?.drivers || 0} Drivers
              </span>
            </div>
          </div>

          {/* Card 2: Vehicles */}
          <div className="bg-card rounded-[var(--radius)] border border-border p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Fleet Vehicles</span>
              <Car className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-serif font-bold text-foreground">{stats?.vehicles?.total || 0}</p>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                {stats?.vehicles?.approved || 0} Approved
              </span>
              {stats?.vehicles?.pending > 0 && (
                <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold animate-pulse">
                  {stats?.vehicles?.pending} Pending
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Commute Rides */}
          <div className="bg-card rounded-[var(--radius)] border border-border p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Rides</span>
              <IndianRupee className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-serif font-bold text-foreground">{stats?.rides?.total || 0}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span className="bg-secondary/70 border border-border px-2 py-0.5 rounded">
                {stats?.rides?.completed || 0} Completed
              </span>
              <span className="bg-secondary/70 border border-border px-2 py-0.5 rounded">
                {stats?.routePools?.active || 0} Pools
              </span>
            </div>
          </div>

          {/* Card 4: Escrow Payouts */}
          <div className="bg-card rounded-[var(--radius)] border border-border p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Escrow Volume</span>
              <Award className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-serif font-bold text-foreground font-mono">
              ₹{stats?.financials?.totalPayoutVolume || 0}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span>{stats?.trust?.edges || 0} Trust Edges</span>
              <span className="text-border">•</span>
              <span>{stats?.trust?.reviews || 0} Reviews</span>
            </div>
          </div>
        </div>

        {/* Registered Users Directory */}
        <div className="bg-card rounded-[var(--radius)] border border-border shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-serif font-bold text-foreground">Registered Campus Students</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Verified college directory with roll number natural keys</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs font-mono bg-background border border-border rounded-[var(--radius)] px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="rider">Riders</option>
                <option value="driver">Drivers</option>
                <option value="admin">Admins</option>
              </select>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search name, roll no..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="text-xs bg-background border border-border rounded-[var(--radius)] pl-8 pr-3 py-1.5 w-44 sm:w-56 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2" />
              </form>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground font-mono font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Roll No (College ID)</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-muted-foreground">
                      No matching students found in campus directory.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{u._id}</td>
                      <td className="py-3 px-4 font-serif font-medium text-foreground">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4">{u.deptId?.deptName || u.deptId?.name || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {u.roles?.map((r) => (
                            <span
                              key={r}
                              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                                r === 'admin'
                                  ? 'bg-primary/10 text-primary border-primary/30'
                                  : r === 'driver'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-secondary text-secondary-foreground border-border'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        ₹{u.walletBalance || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;