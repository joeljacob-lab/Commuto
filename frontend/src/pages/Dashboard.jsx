import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Ticket, 
  Car, 
  Wallet, 
  ShieldAlert, 
  ArrowUpRight, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Compass 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { getDepartments } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();

  // Derive department name if already populated on user object
  const populatedDeptName =
    user?.deptId && typeof user.deptId === 'object'
      ? user.deptId.deptName || user.deptId.name
      : '';

  const [asyncDeptName, setAsyncDeptName] = useState('');
  const deptName = populatedDeptName || asyncDeptName;

  const isDriver = user?.roles?.includes('driver');
  const isAdmin = user?.roles?.includes('admin');

  useEffect(() => {
    // If user.deptId is an unpopulated string ObjectId, load departments list to resolve name
    if (user?.deptId && typeof user.deptId === 'string') {
      getDepartments()
        .then((res) => {
          const list = res.data?.departments || [];
          const found = list.find((d) => d._id === user.deptId);
          if (found) {
            setAsyncDeptName(found.deptName);
          }
        })
        .catch(() => {});
    }
  }, [user?.deptId]);

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-accent selection:text-accent-foreground">
      {/* Subtle background ambiance */}
      <div className="absolute inset-0 theme-dot-pattern opacity-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Welcome Cockpit Banner */}
        <div className="bg-card rounded-[var(--radius)] border border-border p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="font-mono text-xs font-bold text-primary bg-secondary px-2.5 py-0.5 rounded-[var(--radius)] border border-border">
                {user?._id}
              </span>
              <div className="flex gap-1.5">
                {user?.roles?.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius)] bg-muted text-foreground border border-border"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-foreground tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{deptName || user?.deptId?.deptName || user?.deptId?.name || 'Department'}</span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Year {user?.year || '1'}</span>
            </p>
          </div>

          {/* Quick Wallet Snapshot - Styled with theme primary & card tokens */}
          <div className="bg-gradient-to-br from-[#7f1d1d] to-[#9b2c2c] rounded-[var(--radius)] p-5 text-white min-w-[240px] shadow-sm border border-[#b91c1c]/30">
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider block">
              Escrow Balance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-mono font-black">₹{user?.walletBalance ?? 0}</span>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-accent font-medium">
                Spendable
              </span>
            </div>
            <Link
              to="/profile"
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-white transition"
            >
              <span>Manage &amp; Top Up</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Action Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Find Rides */}
          <Link
            to="/search-rides"
            className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-[var(--radius)] bg-secondary text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-border">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif text-foreground group-hover:text-primary transition-colors">
                Find a Commute Ride
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Match with classmates driving your corridor and split daily fuel costs with Equal Split pricing.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              Search Commutes <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 2: My Bookings */}
          <Link
            to="/bookings"
            className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-[var(--radius)] bg-secondary text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-border">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif text-foreground group-hover:text-primary transition-colors">
                My Bookings &amp; Passes
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Track your active seat reservations, roster lock countdowns, and pre-lock cancellation controls.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              View Bookings <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 3: Driver Hub (Driver Only) */}
          {isDriver && (
            <Link
              to="/driver/rides"
              className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-[var(--radius)] bg-secondary text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-border">
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold font-serif text-foreground group-hover:text-primary transition-colors">
                  Driver Command Hub
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Manage recurring timetable rides, inspect confirmed riders, and trigger trip payouts.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                Open Driver Hub <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}

          {/* Card 4: Wallet Ledger */}
          <Link
            to="/profile"
            className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-[var(--radius)] bg-secondary text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-border">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif text-foreground group-hover:text-primary transition-colors">
                Escrow Wallet &amp; Ledger
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Review immutable transaction audit logs: holds, releases, payouts, and academic mock top-ups.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              Manage Wallet <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 5: Route Pools (Driver Only) */}
          {isDriver && (
            <Link
              to="/driver/routepools"
              className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-[var(--radius)] bg-secondary text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-border">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold font-serif text-foreground group-hover:text-primary transition-colors">
                  Recurring Route Pools
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Configure your weekly recurring corridors and schedule auto-generation rules.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                Manage Route Pools <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}

          {/* Card 6: Admin Center (Admin Only) */}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-[var(--radius)] bg-secondary text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-border">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold font-serif text-foreground group-hover:text-primary transition-colors">
                  Admin Command Center
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Verify vehicle registrations, update platform fuel prices, and triage safety incident reports.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                Open Command Center <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}

        </div>

        {/* Platform Integrity & Rules Summary Banner */}
        <div className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-[var(--radius)] bg-secondary flex items-center justify-center text-primary shrink-0 border border-border">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-foreground">
                College Identity &amp; Equal Split Guarantee
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every member is domain-verified with natural roll keys. Equal Split guarantees no passenger pays 100% of fuel costs.
              </p>
            </div>
          </div>
          <Link to="/search-rides" className="shrink-0 w-full sm:w-auto">
            <Button size="sm" variant="secondary" className="w-full sm:w-auto">
              Find Classmates Going Your Way
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;