import { Link } from 'react-router-dom';
import { 
  Search, 
  Ticket, 
  Car, 
  Wallet, 
  ShieldAlert, 
  PlusCircle, 
  ArrowUpRight, 
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const isDriver = user?.roles?.includes('driver');
  const isAdmin = user?.roles?.includes('admin');

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {user?._id}
              </span>
              <div className="flex gap-1">
                {user?.roles?.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.deptId?.name || 'Campus Student'}</span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Year {user?.year || '1'}</span>
            </p>
          </div>

          {/* Quick Wallet Snapshot */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl p-5 text-white min-w-[220px] shadow-sm">
            <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider block">
              Escrow Balance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black">₹{user?.walletBalance ?? 0}</span>
              <span className="text-[10px] bg-indigo-700/80 px-2 py-0.5 rounded text-indigo-200">
                Spendable
              </span>
            </div>
            <Link
              to="/profile"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-200 hover:text-white transition"
            >
              <span>Manage &amp; Top Up</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Quick Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Find Rides */}
          <Link
            to="/search-rides"
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-400 hover:shadow-sm transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Find a Commute Ride
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Match with classmates driving your corridor and split daily fuel costs fairly.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
              Search Commutes <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 2: My Bookings */}
          <Link
            to="/bookings"
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-400 hover:shadow-sm transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              My Bookings &amp; Tickets
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              View active passes, driver phone contacts, cancellation options, and rating reviews.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              View My Tickets <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 3: Profile & Ledger */}
          <Link
            to="/profile"
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-400 hover:shadow-sm transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Audit Ledger &amp; Cashout
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Check append-only financial records, transfer driver earnings to bank, or mock top-up.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600">
              Open Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* Driver Hub Section (Only for Drivers) */}
        {isDriver && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-600" />
                  Driver Command Controls
                </h2>
                <p className="text-xs text-slate-500">
                  Manage your approved vehicle, recurring timetable pools, and daily scheduled trips.
                </p>
              </div>

              <Link
                to="/driver/rides/create-single"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Publish One-Off Ride
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <Link
                to="/driver/rides"
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-emerald-50/50 hover:border-emerald-200 transition"
              >
                <span className="text-xs font-bold text-slate-800 block">Driver Hub (My Rides)</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Complete trips &amp; release escrow payouts
                </span>
              </Link>

              <Link
                to="/driver/routepools"
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-emerald-50/50 hover:border-emerald-200 transition"
              >
                <span className="text-xs font-bold text-slate-800 block">Recurring Route Pools</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Automatic daily commute generator
                </span>
              </Link>

              <Link
                to="/driver/vehicles/add"
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-emerald-50/50 hover:border-emerald-200 transition"
              >
                <span className="text-xs font-bold text-slate-800 block">Add Vehicle</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Submit RC &amp; Insurance for review
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Admin Center (Only for Admins) */}
        {isAdmin && (
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                College Administrator Controls
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Access platform-wide analytics, pending vehicle approvals, and student safety complaints.
              </p>
            </div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              Open Admin Center <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Safety & Trust Assurance Footer */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3 text-xs text-emerald-900">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Campus-Exclusive Trust:</strong> Every driver and rider is verified through institutional domain emails and natural roll number records. No anonymous rides, no commercial surge pricing.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;