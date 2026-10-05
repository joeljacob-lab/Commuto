import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Car, 
  Search, 
  Ticket, 
  ShieldAlert, 
  Wallet, 
  Plus, 
  LogOut, 
  Menu, 
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { topUpWallet } from '../services/api';

const Navbar = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('200');
  const [topUpLoading, setTopUpLoading] = useState(false);

  const isDriver = user?.roles?.includes('driver');
  const isAdmin = user?.roles?.includes('admin');

  const handleTopUp = async (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) return;

    try {
      setTopUpLoading(true);
      const res = await topUpWallet({ amount, paymentMethod: 'UPI' });
      // Update local wallet balance state
      updateUser({ walletBalance: res.data.walletBalance });
      setTopUpModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Top-up failed');
    } finally {
      setTopUpLoading(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Tag */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-xs">
                C
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Commuto</span>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1">
                {/* Rider Links */}
                <Link
                  to="/search-rides"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/search-rides')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Find Rides
                </Link>

                <Link
                  to="/bookings"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/bookings')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  My Bookings
                </Link>

                {/* Driver Links */}
                {isDriver && (
                  <>
                    <div className="h-4 w-px bg-slate-200 mx-1" />
                    <Link
                      to="/driver/rides"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isActive('/driver/rides')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5 text-emerald-600" />
                      Driver Hub
                    </Link>
                    <Link
                      to="/driver/routepools"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isActive('/driver/routepools')
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Route Pools
                    </Link>
                  </>
                )}

                {/* Admin Links */}
                {isAdmin && (
                  <>
                    <div className="h-4 w-px bg-slate-200 mx-1" />
                    <Link
                      to="/admin/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isActive('/admin/dashboard')
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                      Admin Center
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* Right Area: Wallet, Notification Bell, User Profile, Mobile Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance Chip */}
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full pl-3 pr-1.5 py-1 text-xs">
                  <div className="flex items-center gap-1 text-slate-700 font-bold mr-2">
                    <Wallet className="w-3.5 h-3.5 text-slate-500" />
                    <span>₹{user?.walletBalance ?? 0}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTopUpModalOpen(true)}
                    className="p-1 rounded-full bg-white hover:bg-indigo-50 text-indigo-600 shadow-2xs border border-slate-200 transition cursor-pointer"
                    title="Top Up Wallet"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Real-time Notification Bell */}
                <NotificationBell />

                {/* User Info & Logout (Desktop) */}
                <div className="hidden sm:flex items-center pl-2 border-l border-slate-200 space-x-3">
                  <Link to="/profile" className="text-right hover:opacity-80 transition cursor-pointer" title="View Profile & Ledger">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
                    <p className="text-[10px] text-indigo-600 font-mono font-semibold">{user?._id}</p>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Hamburger Toggle */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            <Link
              to="/search-rides"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 py-1.5"
            >
              🔍 Find Rides
            </Link>
            <Link
              to="/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 py-1.5"
            >
              🎟️ My Bookings
            </Link>

            {isDriver && (
              <>
                <div className="h-px bg-slate-100 my-1" />
                <Link
                  to="/driver/rides"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-emerald-700 py-1.5"
                >
                  🚗 Driver Hub (My Rides)
                </Link>
                <Link
                  to="/driver/routepools"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-slate-700 py-1.5"
                >
                  🔁 Route Pools
                </Link>
                <Link
                  to="/driver/rides/create-single"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-slate-700 py-1.5"
                >
                  ➕ Publish Single Ride
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <div className="h-px bg-slate-100 my-1" />
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-purple-700 py-1.5"
                >
                  🛡️ Admin Dashboard
                </Link>
                <Link
                  to="/admin/vehicles/pending"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-slate-700 py-1.5"
                >
                  🚙 Vehicle Queue
                </Link>
                <Link
                  to="/admin/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-slate-700 py-1.5"
                >
                  🚨 Safety Reports
                </Link>
              </>
            )}

            <div className="h-px bg-slate-100 my-2" />
            <button
              type="button"
              onClick={logout}
              className="w-full text-left text-xs font-semibold text-rose-600 py-1.5"
            >
              Log Out ({user?._id})
            </button>
          </div>
        )}
      </header>

      {/* Wallet Top-Up Modal */}
      {topUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Top Up Campus Escrow Wallet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add mock funds to hold seat fares and split trip costs.
            </p>

            <form onSubmit={handleTopUp} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['100', '200', '500'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      topUpAmount === amt
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Custom Amount (₹)
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTopUpModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topUpLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {topUpLoading ? 'Processing...' : `Add ₹${topUpAmount || 0}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;