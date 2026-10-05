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
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyWallet, getUserReviews, topUpWallet } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [walletData, setWalletData] = useState({ walletBalance: 0, transactions: [] });
  const [reviewsData, setReviewsData] = useState({ averageRating: null, totalReviews: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('200');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user?._id) return;

    const loadProfileData = async () => {
      try {
        setLoading(true);
        const [walletRes, reviewsRes] = await Promise.all([
          getMyWallet().catch(() => ({ data: { walletBalance: user.walletBalance || 0, transactions: [] } })),
          getUserReviews(user._id).catch(() => ({ data: { averageRating: null, totalReviews: 0, reviews: [] } })),
        ]);

        setWalletData(walletRes.data);
        setReviewsData(reviewsRes.data);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user?._id, refreshKey]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) return;

    try {
      setTopUpLoading(true);
      const res = await topUpWallet({ amount, paymentMethod: 'UPI' });
      updateUser({ walletBalance: res.data.walletBalance });
      setRefreshKey((k) => k + 1);
      alert(`Successfully added ₹${amount} to your wallet!`);
    } catch (error) {
      alert(error.response?.data?.message || 'Top-up failed');
    } finally {
      setTopUpLoading(false);
    }
  };

  const getLedgerBadge = (type) => {
    switch (type) {
      case 'topup':
        return <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold"><ArrowDownLeft className="w-3 h-3" /> Top Up</span>;
      case 'payout':
        return <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold"><ArrowDownLeft className="w-3 h-3" /> Trip Payout</span>;
      case 'hold':
        return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold"><Clock className="w-3 h-3" /> Escrow Hold</span>;
      case 'release':
        return <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold"><ArrowDownLeft className="w-3 h-3" /> Hold Refunded</span>;
      case 'forfeit':
        return <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold"><ArrowUpRight className="w-3 h-3" /> Forfeited</span>;
      default:
        return <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold">{type}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-7 h-7 text-indigo-600" />
              Student Profile &amp; Financial Ledger
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Verified campus identity, pairwise ratings, and transparent escrow transaction records.
            </p>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Identity & Reputation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Student Identity */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {user?._id}
                </span>
              </div>

              <div className="flex gap-1.5">
                {user?.roles?.map((r) => (
                  <span
                    key={r}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate font-mono">{user?.email}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">{user?.phone || 'Not registered'}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{user?.deptId?.name || 'Department verified'}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Year {user?.year || '1'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Campus Reputation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Campus Rating</span>
                <Shield className="w-4 h-4 text-indigo-600" />
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-slate-900">
                  {reviewsData.averageRating ? reviewsData.averageRating.toFixed(1) : '5.0'}
                </span>
                <div className="flex text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Based on {reviewsData.totalReviews} mutual ride {reviewsData.totalReviews === 1 ? 'review' : 'reviews'}.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              ✓ Verified college identity by domain constraint &amp; natural key records.
            </div>
          </div>
        </div>

        {/* Wallet & Quick Top-Up Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider block mb-1">
              Campus Escrow Balance
            </span>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-extrabold">₹{user?.walletBalance ?? 0}</span>
              <span className="text-xs bg-indigo-700/80 px-2 py-0.5 rounded text-indigo-200">Spendable</span>
            </div>
            <p className="text-xs text-indigo-300 mt-1">
              Funds are held safely per ride and released upon trip completion.
            </p>
          </div>

          <form onSubmit={handleTopUp} className="flex items-center gap-2 bg-indigo-950/60 p-2 rounded-xl border border-indigo-700/50">
            <span className="text-xs font-bold text-indigo-200 pl-2">Top Up:</span>
            {['100', '200', '500'].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTopUpAmount(amt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  topUpAmount === amt
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'bg-indigo-800/80 hover:bg-indigo-700 text-white'
                }`}
              >
                ₹{amt}
              </button>
            ))}
            <button
              type="submit"
              disabled={topUpLoading}
              className="inline-flex items-center gap-1 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {topUpLoading ? '...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Append-Only Financial Audit Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                Wallet Ledger Audit Trail
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Append-only log of all financial holds, releases, payouts, and top-ups
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {walletData.transactions?.length || 0} Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {!walletData.transactions || walletData.transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  walletData.transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        #{tx._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-3 px-4">{getLedgerBadge(tx.type)}</td>
                      <td className={`py-3 px-4 font-bold ${
                        tx.type === 'topup' || tx.type === 'payout' || tx.type === 'release'
                          ? 'text-emerald-600'
                          : 'text-slate-900'
                      }`}>
                        {tx.type === 'topup' || tx.type === 'payout' || tx.type === 'release' ? '+' : '-'}₹{tx.amount}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        ₹{tx.balanceAfter}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
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
    </div>
  );
};

export default Profile;