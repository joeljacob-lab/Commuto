import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Wallet, 
  Plus, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import MockPaymentGatewayModal from './MockPaymentGatewayModal';
import commutoLogo from '../assets/Commuto_ emblem.png';

const Navbar = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gatewayOpen, setGatewayOpen] = useState(false);

  const isDriver = user?.roles?.includes('driver');
  const isAdmin = user?.roles?.includes('admin');

  // Check if current route is one of the 4 public entry/auth pages
  const isAuthOrLandingPage = 
    (!isAuthenticated && location.pathname === '/') || // Unauthenticated landing/hero page
    location.pathname === '/login' ||
    location.pathname === '/register';

  const isActive = (path) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Floating Pill Navigation Wrapper */}
      <div className="sticky top-0 z-50 w-full px-4 sm:px-6 pt-3 sm:pt-4 pointer-events-none">
        <header className="max-w-5xl mx-auto flex items-center justify-between pointer-events-auto">
          
          {/* Left Brand Capsule */}
          <Link
            to="/"
            className="flex items-center gap-2.5 bg-card/90 backdrop-blur-md border border-border/80 px-3.5 py-1.5 rounded-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-primary/40 transition-all group shrink-0"
          >
            <img
              src={commutoLogo}
              alt="Commuto"
              className="h-7 w-7 object-contain rounded-full group-hover:scale-105 transition-transform"
            />
            <span className="font-serif font-extrabold text-base tracking-tight text-foreground pr-1">
              Commuto
            </span>
          </Link>

          {/* Center Floating Pill Nav: Rendered ONLY on internal pages (hidden on Landing, Login, Register) */}
          {!isAuthOrLandingPage && (
            <nav className="hidden md:flex items-center relative bg-card/90 backdrop-blur-md border border-border/80 rounded-full p-1.5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.08)]">
              {/* Home / Cockpit Dashboard */}
              <Link
                to="/"
                className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isActive('/')
                    ? 'bg-muted text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive('/') && (
                  <>
                    <div className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-foreground rounded-full shadow-[0_-2px_10px_1px_rgba(0,0,0,0.4)]" />
                    <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-6 h-[8px] bg-foreground/20 blur-xs rounded-full pointer-events-none" />
                  </>
                )}
                Home
              </Link>

              {/* Find Rides */}
              <Link
                to="/search-rides"
                className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isActive('/search-rides')
                    ? 'bg-muted text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive('/search-rides') && (
                  <>
                    <div className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-foreground rounded-full shadow-[0_-2px_10px_1px_rgba(0,0,0,0.4)]" />
                    <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-6 h-[8px] bg-foreground/20 blur-xs rounded-full pointer-events-none" />
                  </>
                )}
                Find Rides
              </Link>

              {/* My Bookings */}
              {isAuthenticated && (
                <Link
                  to="/bookings"
                  className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    isActive('/bookings')
                      ? 'bg-muted text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isActive('/bookings') && (
                    <>
                      <div className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-foreground rounded-full shadow-[0_-2px_10px_1px_rgba(0,0,0,0.4)]" />
                      <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-6 h-[8px] bg-foreground/20 blur-xs rounded-full pointer-events-none" />
                    </>
                  )}
                  My Bookings
                </Link>
              )}

              {/* Driver Hub */}
              {isAuthenticated && isDriver && (
                <Link
                  to="/driver/rides"
                  className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    isActive('/driver')
                      ? 'bg-muted text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isActive('/driver') && (
                    <>
                      <div className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-foreground rounded-full shadow-[0_-2px_10px_1px_rgba(0,0,0,0.4)]" />
                      <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-6 h-[8px] bg-foreground/20 blur-xs rounded-full pointer-events-none" />
                    </>
                  )}
                  Driver Hub
                </Link>
              )}

              {/* Admin Center */}
              {isAuthenticated && isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    isActive('/admin')
                      ? 'bg-muted text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isActive('/admin') && (
                    <>
                      <div className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-foreground rounded-full shadow-[0_-2px_10px_1px_rgba(0,0,0,0.4)]" />
                      <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-6 h-[8px] bg-foreground/20 blur-xs rounded-full pointer-events-none" />
                    </>
                  )}
                  Admin
                </Link>
              )}
            </nav>
          )}

          {/* Right Action Controls Capsule */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border/80 px-2.5 py-1.5 rounded-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)]">
                {/* Wallet Balance Pill */}
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-foreground pl-1.5 pr-1">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span>₹{user?.walletBalance ?? 0}</span>
                  <button
                    type="button"
                    onClick={() => setGatewayOpen(true)}
                    className="p-1 rounded-full bg-primary hover:bg-[#832323] text-primary-foreground transition cursor-pointer ml-0.5"
                    title="Top Up Escrow Wallet"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="h-3.5 w-px bg-border/80 mx-0.5" />

                {/* Notifications */}
                <NotificationBell />

                <div className="h-3.5 w-px bg-border/80 mx-0.5" />

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-foreground hover:bg-muted transition"
                  title="Profile & Ledger"
                >
                  <span className="font-semibold">{user?.name?.split(' ')[0]}</span>
                </Link>

                {/* Log Out Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-muted transition cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Public / Auth Pages: Only Login and Register Buttons */
              <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border/80 p-1.5 rounded-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)]">
                <Link
                  to="/login"
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition ${
                    location.pathname === '/login'
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-primary hover:bg-[#832323] text-primary-foreground rounded-full transition shadow-2xs"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button: Display only when nav items exist */}
            {!isAuthOrLandingPage && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full bg-card/90 backdrop-blur-md border border-border/80 text-foreground shadow-xs cursor-pointer hover:bg-muted"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            )}
          </div>

        </header>

        {/* Mobile Navigation Drawer for Internal Pages */}
        {!isAuthOrLandingPage && mobileMenuOpen && (
          <div className="md:hidden mt-2 max-w-md mx-auto pointer-events-auto bg-card border border-border/80 rounded-2xl p-4 shadow-xl space-y-2 backdrop-blur-md">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs font-semibold py-2 px-3 rounded-lg ${
                isActive('/') ? 'bg-secondary text-primary' : 'text-foreground'
              }`}
            >
              🏠 Home
            </Link>
            <Link
              to="/search-rides"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs font-semibold py-2 px-3 rounded-lg ${
                isActive('/search-rides') ? 'bg-secondary text-primary' : 'text-foreground'
              }`}
            >
              🔍 Find Rides
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-semibold py-2 px-3 rounded-lg ${
                    isActive('/bookings') ? 'bg-secondary text-primary' : 'text-foreground'
                  }`}
                >
                  🎟️ My Bookings
                </Link>

                {isDriver && (
                  <>
                    <Link
                      to="/driver/rides"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block text-xs font-semibold py-2 px-3 rounded-lg ${
                        isActive('/driver/rides') ? 'bg-secondary text-primary' : 'text-primary'
                      }`}
                    >
                      🚗 Driver Hub (My Rides)
                    </Link>
                    <Link
                      to="/driver/routepools"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-xs font-semibold py-2 px-3 rounded-lg text-foreground"
                    >
                      🔁 Route Pools
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-xs font-semibold py-2 px-3 rounded-lg text-primary"
                  >
                    🛡️ Admin Command Center
                  </Link>
                )}

                <div className="h-px bg-border my-2" />

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold py-2 px-3 rounded-lg text-foreground"
                >
                  👤 Profile &amp; Wallet Ledger (₹{user?.walletBalance ?? 0})
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-xs font-semibold text-destructive py-2 px-3 rounded-lg hover:bg-muted cursor-pointer"
                >
                  Log Out ({user?._id})
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Realistic Mock Gateway Modal */}
      <MockPaymentGatewayModal
        isOpen={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
        initialAmount="200"
        onSuccess={(newBal) => updateUser({ walletBalance: newBal })}
      />
    </>
  );
};

export default Navbar;