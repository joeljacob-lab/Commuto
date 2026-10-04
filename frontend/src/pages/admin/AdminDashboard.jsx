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
  ArrowUpRight
} from 'lucide-react';
import { getAdminStats, getAdminUsers } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Prevents ESLint dependency warnings

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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Admin Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Phase 12
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Platform-wide performance KPIs, safety triage, and campus user directory.
            </p>
          </div>

          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Quick Admin Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/admin/vehicles/pending"
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-xs transition group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-indigo-600 mb-2">
              <Car className="w-5 h-5" />
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900 block">Vehicle Queue</span>
            <span className="text-xs text-slate-500">
              {stats?.vehicles?.pending || 0} pending review
            </span>
          </Link>

          <Link
            to="/admin/reports"
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-400 hover:shadow-xs transition group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-rose-600 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900 block">Safety Reports</span>
            <span className="text-xs text-slate-500">
              {stats?.reports?.open || 0} open complaints
            </span>
          </Link>

          <Link
            to="/admin/fuel-rates"
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-xs transition group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-600 mb-2">
              <Fuel className="w-5 h-5" />
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900 block">Fuel Rates</span>
            <span className="text-xs text-slate-500">Adjust campus rate</span>
          </Link>

          <Link
            to="/admin/departments"
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-xs transition group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-indigo-600 mb-2">
              <Building2 className="w-5 h-5" />
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900 block">Departments</span>
            <span className="text-xs text-slate-500">Manage programs</span>
          </Link>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Users */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Campus Students</span>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats?.users?.total || 0}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                {stats?.users?.riders || 0} Riders
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                {stats?.users?.drivers || 0} Drivers
              </span>
            </div>
          </div>

          {/* Card 2: Vehicles */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Vehicles</span>
              <Car className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats?.vehicles?.total || 0}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                {stats?.vehicles?.approved || 0} Approved
              </span>
              {stats?.vehicles?.pending > 0 && (
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold animate-pulse">
                  {stats?.vehicles?.pending} Pending
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Commute Rides */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Total Rides</span>
              <IndianRupee className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats?.rides?.total || 0}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                {stats?.rides?.completed || 0} Completed
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                {stats?.routePools?.active || 0} Active Pools
              </span>
            </div>
          </div>

          {/* Card 4: Escrow Payouts */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Escrow Volume</span>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              ₹{stats?.financials?.totalPayoutVolume || 0}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <span>{stats?.trust?.edges || 0} Trust Edges</span>
              <span>•</span>
              <span>{stats?.trust?.reviews || 0} Reviews</span>
            </div>
          </div>
        </div>

        {/* Registered Users Directory */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Campus Students</h2>
              <p className="text-xs text-slate-500 mt-0.5">Directory of verified accounts</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
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
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </form>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Roll No (College ID)</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No matching students found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{u._id}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{u.email}</td>
                      <td className="py-3 px-4">{u.deptId?.name || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {u.roles?.map((r) => (
                            <span
                              key={r}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                r === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : r === 'driver'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
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