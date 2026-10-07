import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Smartphone, 
  Building, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Lock, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { topUpWallet } from '../services/api';
import commutoLogo from '../assets/Commuto_ emblem.png';
import { Button } from './ui/button';

const MockPaymentGatewayModal = ({ isOpen, onClose, initialAmount = '200', onSuccess }) => {
  const [amount, setAmount] = useState(initialAmount);
  const [activeTab, setActiveTab] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiMethod, setUpiMethod] = useState('vpa'); // 'vpa', 'qr'
  const [upiId, setUpiId] = useState('student@oksbi');
  const [selectedBank, setSelectedBank] = useState('sbi');

  // Card State
  const [cardNumber, setCardNumber] = useState('4532 0123 4567 8910');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // Gateway Simulation States
  const [gatewayStep, setGatewayStep] = useState('input'); // 'input', 'otp', 'processing', 'success'
  const [otp, setOtp] = useState('123456');
  const [statusMessage, setStatusMessage] = useState('');
  const [qrTimer, setQrTimer] = useState(299);

  const handleClose = () => {
    setGatewayStep('input');
    onClose();
  };

  // QR Countdown Timer
  useEffect(() => {
    if (!isOpen || upiMethod !== 'qr') return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 299));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, upiMethod]);

  if (!isOpen) return null;

  const handleStartPayment = (e) => {
    e.preventDefault();
    if (activeTab === 'card') {
      setGatewayStep('otp'); // Go to 3D Secure OTP simulation
    } else {
      executePayment(activeTab === 'upi' ? `UPI (${upiMethod === 'qr' ? 'QR Scan' : upiId})` : `Net Banking (${selectedBank.toUpperCase()})`);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    executePayment('Credit/Debit Card (3D Secure)');
  };

  const executePayment = async (paymentMethodLabel) => {
    setGatewayStep('processing');
    setStatusMessage('Connecting with campus bank server...');

    setTimeout(() => {
      setStatusMessage('Authorizing mock escrow funds...');
    }, 800);

    setTimeout(async () => {
      try {
        const res = await topUpWallet({
          amount: Number(amount),
          paymentMethod: paymentMethodLabel,
        });
        setStatusMessage('Payment Verified & Approved!');
        setGatewayStep('success');

        setTimeout(() => {
          if (onSuccess) onSuccess(res.data.walletBalance);
          onClose();
        }, 1400);
      } catch (err) {
        alert(err.response?.data?.message || 'Payment simulation failed');
        setGatewayStep('input');
      }
    }, 1600);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card rounded-[var(--radius)] max-w-md w-full shadow-2xl border border-border overflow-hidden flex flex-col">
        {/* Gateway Brand Header */}
        <div className="bg-primary px-6 py-4 text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={commutoLogo}
              alt="Commuto Pay"
              className="w-8 h-8 rounded-[var(--radius)] object-contain bg-white/10 p-0.5"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm tracking-tight">Commuto Pay</span>
                <span className="text-[10px] bg-white/20 text-white font-mono px-1.5 py-0.2 rounded border border-white/30">
                  TEST ESCROW
                </span>
              </div>
              <p className="text-[11px] text-white/80 flex items-center gap-1 font-mono">
                <Lock className="w-2.5 h-2.5" />
                Campus Verified Peer Escrow
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Summary Ribbon */}
        <div className="bg-secondary/60 border-b border-border px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-foreground">Top-up Escrow Balance</span>
          <span className="text-xl font-mono font-bold text-primary">₹{amount}</span>
        </div>

        {/* BODY: STEP 1 - INPUT */}
        {gatewayStep === 'input' && (
          <div className="p-6 space-y-5">
            {/* Quick Amount Selector */}
            <div>
              <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Select Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['100', '200', '500', '1000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-1.5 text-xs font-mono font-bold rounded-[var(--radius)] border transition cursor-pointer ${
                      amount === amt
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'border-border text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Method Tabs */}
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`flex-1 pb-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'upi'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                UPI Apps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`flex-1 pb-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'card'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                className={`flex-1 pb-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'netbanking'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Net Banking
              </button>
            </div>

            {/* TAB CONTENT: UPI */}
            {activeTab === 'upi' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUpiMethod('vpa')}
                    className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-[var(--radius)] border cursor-pointer ${
                      upiMethod === 'vpa'
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    UPI ID / VPA
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiMethod('qr')}
                    className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-[var(--radius)] border flex items-center justify-center gap-1 cursor-pointer ${
                      upiMethod === 'qr'
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Scan QR
                  </button>
                </div>

                {upiMethod === 'vpa' ? (
                  <div>
                    <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                      Enter UPI VPA ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                      className="w-full text-xs font-mono bg-background border border-border rounded-[var(--radius)] p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <div className="flex gap-1.5 mt-2">
                      {['@oksbi', '@paytm', '@okaxis'].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => setUpiId(`student${handle}`)}
                          className="text-[10px] font-mono text-muted-foreground hover:text-primary bg-secondary/80 border border-border px-2 py-0.5 rounded cursor-pointer transition"
                        >
                          student{handle}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 space-y-2">
                    <div className="inline-block p-3 bg-white border border-border rounded-[var(--radius)] shadow-xs">
                      <svg className="w-32 h-32 mx-auto text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                        <path d="M0 0h30v30H0zM40 0h20v10H40zM70 0h30v30H70zM10 10h10v10H10zM80 10h10v10H80zM0 40h10v20H0zM20 40h20v10H20zM50 40h20v20H50zM80 40h20v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 70h10v30H40zM60 80h20v10H60zM70 70h10v10H70zM90 90h10v10H90z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-foreground font-medium">Scan with GPay, PhonePe, or Paytm</p>
                    <p className="text-[11px] text-primary font-mono font-bold">Expires in {formatTimer(qrTimer)}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CARD */}
            {activeTab === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-xs font-mono bg-background border border-border rounded-[var(--radius)] p-2.5 text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full text-xs font-mono bg-background border border-border rounded-[var(--radius)] p-2.5 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength="3"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full text-xs font-mono bg-background border border-border rounded-[var(--radius)] p-2.5 text-foreground"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">Supported: Visa, MasterCard, RuPay (Test values prefilled)</p>
              </div>
            )}

            {/* TAB CONTENT: NETBANKING */}
            {activeTab === 'netbanking' && (
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                  Popular Campus Banks
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sbi', name: 'State Bank of India' },
                    { id: 'hdfc', name: 'HDFC Bank' },
                    { id: 'icici', name: 'ICICI Bank' },
                    { id: 'federal', name: 'Federal Bank' },
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-2.5 text-left rounded-[var(--radius)] border text-xs font-medium transition cursor-pointer ${
                        selectedBank === bank.id
                          ? 'border-primary bg-secondary text-primary font-bold'
                          : 'border-border text-foreground hover:bg-secondary/40'
                      }`}
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pay Button */}
            <Button
              type="button"
              onClick={handleStartPayment}
              className="w-full py-3 bg-primary hover:bg-[#832323] text-primary-foreground font-bold text-sm rounded-[var(--radius)] shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Pay ₹{amount} Securely
            </Button>
          </div>
        )}

        {/* BODY: STEP 2 - CARD 3D SECURE OTP SIMULATION */}
        {gatewayStep === 'otp' && (
          <div className="p-6 space-y-4">
            <div className="bg-secondary/60 border border-border rounded-[var(--radius)] p-3 text-xs text-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>3D Secure Banking Verification</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                  An OTP has been simulated for your college test account.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-foreground block mb-1">
                Enter 6-Digit Bank OTP
              </label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono font-bold bg-background border border-border rounded-[var(--radius)] py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
              />
              <span className="text-[11px] text-muted-foreground font-mono text-center block mt-1">
                Demo code: <strong>123456</strong>
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGatewayStep('input')}
                className="flex-1 py-2 text-xs border-border text-foreground hover:bg-secondary"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleVerifyOtp}
                className="flex-2 py-2.5 bg-[#1b6a43] hover:bg-[#155334] text-white font-bold text-xs shadow-xs"
              >
                Confirm &amp; Authorize ₹{amount}
              </Button>
            </div>
          </div>
        )}

        {/* BODY: STEP 3 - PROCESSING */}
        {gatewayStep === 'processing' && (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <p className="text-sm font-serif font-bold text-foreground">{statusMessage}</p>
            <p className="text-xs text-muted-foreground font-mono">Do not refresh or close this window.</p>
          </div>
        )}

        {/* BODY: STEP 4 - SUCCESS */}
        {gatewayStep === 'success' && (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-serif font-bold text-foreground">Payment Successful!</h4>
            <p className="text-xs text-muted-foreground font-mono">
              ₹{amount} has been added to your spendable Escrow Wallet.
            </p>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="bg-secondary/30 border-t border-border px-6 py-2.5 text-center text-[10px] text-muted-foreground font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Commuto Internal Escrow • Automated Fair Cost Sharing</span>
        </div>
      </div>
    </div>
  );
};

export default MockPaymentGatewayModal;