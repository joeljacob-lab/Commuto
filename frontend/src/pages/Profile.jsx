import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Shield, 
  Star, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  RefreshCw,
  Plus,
  Landmark
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyWallet, getUserReviews, getDepartments } from '../services/api';
import MockPaymentGatewayModal from '../components/MockPaymentGatewayModal';
import WithdrawModal from '../components/WithdrawModal';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/toaster';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [walletData, setWalletData] = useState({ walletBalance: 0, transactions: [] });
  const [reviewsData, setReviewsData] = useState({ averageRating: null, reviewCount: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Department name resolution
  const populatedDeptName =
    user?.deptId && typeof user.deptId === 'object'
      ? user.deptId.deptName || user.deptId.name
      : '';
  const [asyncDeptName, setAsyncDeptName] = useState('');
  const deptName = populatedDeptName || asyncDeptName;

  useEffect(() => {
    if (user?.deptId && typeof user.deptId === 'string') {
      getDepartments()
        .then((res) => {
          const list = res.data?.departments || [];
          const found = list.find((d) => d._id === user.deptId);
          if (found) setAsyncDeptName(found.deptName);
        })
        .catch(() => {});
    }
  }, [user?.deptId]);

  // Modals
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayAmount, setGatewayAmount] = useState('200');
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    if (!user?._id) return;

    const loadProfileData = async () => {
      try {
        setLoading(true);
        const [walletRes, reviewsRes] = await Promise.all([
          getMyWallet().catch(() => ({ data: { walletBalance: user.walletBalance || 0, transactions: [] } })),
          getUserReviews(user._id).catch(() => ({ data: { data: { averageRating: null, reviewCount: 0, reviews: [] } } })),
        ]);

        setWalletData(walletRes.data);
        const reviewsPayload = reviewsRes.data?.data || reviewsRes.data || {};
        setReviewsData({
          averageRating: reviewsPayload.averageRating ?? null,
          reviewCount: reviewsPayload.reviewCount ?? 0,
          reviews: reviewsPayload.reviews || [],
        });
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user?._id, user?.walletBalance, refreshKey]);

  const handleOpenGateway = (amt) => {
    setGatewayAmount(amt);
    setGatewayOpen(true);
  };

  const getLedgerBadge = (type) => {
    switch (type) {
      case 'topup':
        return <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold"><ArrowDownLeft className="w-3 h-3" /> Top Up</span>;
      case 'payout':
        return <span className="inline-flex items-center gap-1 text-primary bg-secondary border border-border px-2 py-0.5 rounded font-mono text-[10px] font-bold"><ArrowDownLeft className="w-3 h-3" /> Payout</span>;
      case 'hold':
        return <span className="inline-flex items-center gap-1 text-accent-foreground bg-accent/80 border border-border px-2 py-0.5 rounded font-mono text-[10px] font-bold"><Clock className="w-3 h-3" /> Hold</span>;
      case 'release':
        return <span className="inline-flex items-center gap-1 text-foreground bg-muted border border-border px-2 py-0.5 rounded font-mono text-[10px] font-bold"><ArrowDownLeft className="w-3 h-3" /> Refunded</span>;
      case 'forfeit':
        return <span className="inline-flex items-center gap-1 text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded font-mono text-[10px] font-bold"><ArrowUpRight className="w-3 h-3" /> Forfeited</span>;
      case 'withdrawal':
        return <span className="inline-flex items-center gap-1 text-foreground bg-secondary border border-border px-2 py-0.5 rounded font-mono text-[10px] font-bold"><ArrowUpRight className="w-3 h-3" /> Bank Cashout</span>;
      default:
        return <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono text-[10px] font-bold">{type}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-accent selection:text-accent-foreground">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 theme-dot-pattern opacity-40 pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div>
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-primary bg-secondary px-3 py-1 rounded-full border border-border">
              College Identity &amp; Financial Ledger
            </span>
            <h1 className="text-3xl font-serif font-bold text-foreground mt-3 tracking-tight flex items-center gap-2.5">
              <User className="w-7 h-7 text-primary" />
              Student Profile &amp; Wallet Ledger
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verified campus identity, pairwise ratings, and transparent escrow transaction records.
            </p>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-[var(--radius)] text-xs font-semibold text-foreground hover:bg-muted shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Identity & Reputation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Student Identity */}
          <div className="md:col-span-2 bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">{user?.name}</h2>
                <span className="font-mono text-xs font-bold text-primary bg-secondary px-2.5 py-0.5 rounded-[var(--radius)] border border-border mt-1 inline-block">
                  {user?._id}
                </span>
              </div>

              <div className="flex gap-1.5">
                {user?.roles?.map((r) => (
                  <span
                    key={r}
                    className="px-2.5 py-0.5 rounded-[var(--radius)] text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground border border-border"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-foreground">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate font-mono">{user?.email}</span>
              </div>

              <div className="flex items-center gap-2.5 text-foreground">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium font-mono">{user?.phone || 'Not registered'}</span>
              </div>

              <div className="flex items-center gap-2.5 text-foreground">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span>{deptName || 'Department Student'}</span>
              </div>

              <div className="flex items-center gap-2.5 text-foreground">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>Study Year {user?.year || '1'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Campus Reputation */}
          <div className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Campus Rating</span>
                <Shield className="w-4 h-4 text-primary" />
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-serif font-black text-foreground">
                  {reviewsData.averageRating !== null && reviewsData.averageRating !== undefined
                    ? Number(reviewsData.averageRating).toFixed(1)
                    : '5.0'}
                </span>
                <div className="flex text-amber-500">
                  <Star className="w-5 h-5 fill-current" />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Based on {reviewsData.reviewCount} mutual ride {reviewsData.reviewCount === 1 ? 'review' : 'reviews'}.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/80 text-[11px] text-muted-foreground">
              ✓ Verified college identity by domain constraint &amp; natural key records.
            </div>
          </div>
        </div>

        {/* Wallet & Gateway Actions Banner */}
        <div className="bg-gradient-to-br from-[#7f1d1d] to-[#9b2c2c] rounded-[var(--radius)] p-6 sm:p-7 text-white shadow-md border border-[#b91c1c]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-accent uppercase tracking-wider block mb-1">
              Campus Escrow Balance
            </span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-mono font-black">₹{user?.walletBalance ?? 0}</span>
              <span className="text-xs bg-black/20 px-2.5 py-0.5 rounded text-accent font-medium">Spendable</span>
            </div>
            <p className="text-xs text-accent/80 mt-1.5">
              Held per seat reservation and automatically paid out to drivers upon trip completion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Top-Up with Gateway */}
            <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-[var(--radius)] border border-white/20">
              <span className="text-xs font-bold text-accent pl-2">Top Up:</span>
              {['100', '200', '500'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleOpenGateway(amt)}
                  className="px-2.5 py-1 text-xs font-mono font-bold rounded-[var(--radius)] bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  ₹{amt}
                </button>
              ))}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleOpenGateway('200')}
                className="gap-1 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                Add Funds
              </Button>
            </div>

            {/* Withdraw to Bank Button */}
            <Button
              variant="outline"
              size="default"
              onClick={() => setWithdrawOpen(true)}
              className="gap-2 font-bold text-xs"
            >
              <Landmark className="w-4 h-4 text-primary" />
              Cash Out to Bank
            </Button>
          </div>
        </div>

        {/* Append-Only Financial Audit Ledger */}
        <div className="bg-card rounded-[var(--radius)] border border-border shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Wallet Ledger Audit Trail
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Append-only log of all financial holds, releases, payouts, withdrawals, and top-ups
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono bg-secondary px-2.5 py-0.5 rounded-[var(--radius)] border border-border">
              {walletData.transactions?.length || 0} Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left text-xs">
              <thead className="bg-muted text-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-mono">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 font-mono">Balance After</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {!walletData.transactions || walletData.transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-muted-foreground">
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  walletData.transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        #{tx._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-3 px-4">{getLedgerBadge(tx.type)}</td>
                      <td className={`py-3 px-4 font-mono font-bold ${
                        tx.type === 'topup' || tx.type === 'payout' || tx.type === 'release'
                          ? 'text-primary'
                          : 'text-foreground'
                      }`}>
                        {tx.type === 'topup' || tx.type === 'payout' || tx.type === 'release' ? '+' : '-'}₹{tx.amount}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        ₹{tx.balanceAfter}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mock Payment Gateway Modal */}
      <MockPaymentGatewayModal
        key={gatewayAmount}
        isOpen={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
        initialAmount={gatewayAmount}
        onSuccess={(newBal) => {
          updateUser({ walletBalance: newBal });
          toast.success(`Escrow wallet recharged! Current balance: ₹${newBal}`, { title: 'Top-Up Successful' });
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* Driver Cash Out Modal */}
      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        currentBalance={user?.walletBalance || 0}
        onSuccess={(newBal) => {
          updateUser({ walletBalance: newBal });
          toast.success(`Transfer initiated. Remaining balance: ₹${newBal}`, { title: 'Cash Out Confirmed' });
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
};

export default Profile;