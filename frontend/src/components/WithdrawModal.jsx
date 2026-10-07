import { useState } from 'react';
import { 
  ArrowUpRight, 
  Building, 
  Smartphone, 
  CheckCircle2, 
  X, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { withdrawWallet } from '../services/api';
import { Button } from './ui/button';

const WithdrawModal = ({ isOpen, onClose, currentBalance = 0, onSuccess }) => {
  const [amount, setAmount] = useState('100');
  const [method, setMethod] = useState('upi'); // 'upi', 'bank'
  const [upiId, setUpiId] = useState('driver@okaxis');
  const [accountNumber, setAccountNumber] = useState('987654321012');
  const [ifsc, setIfsc] = useState('SBIN0001234');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const withdrawAmt = Number(amount);

    if (!withdrawAmt || withdrawAmt <= 0) {
      alert('Please enter a valid withdrawal amount');
      return;
    }

    if (withdrawAmt > currentBalance) {
      alert(`Insufficient balance! Your available balance is ₹${currentBalance}`);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        amount: withdrawAmt,
        method,
        upiId: method === 'upi' ? upiId : null,
        bankDetails: method === 'bank' ? { accountNumber, ifsc } : null,
      };

      const res = await withdrawWallet(payload);
      setSuccessData(res.data);

      setTimeout(() => {
        if (onSuccess) onSuccess(res.data.walletBalance);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card rounded-[var(--radius)] max-w-sm w-full shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-5 py-4 text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
            <h3 className="font-serif font-bold text-sm">Withdraw to Bank / UPI</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successData ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-serif font-bold text-foreground">Transfer Initiated!</h4>
            <p className="text-xs text-muted-foreground">{successData.message}</p>
            <p className="text-[11px] text-muted-foreground font-mono">
              Txn ID: #{successData.transaction?._id?.slice(-8).toUpperCase()}
            </p>
            <Button
              onClick={onClose}
              className="mt-4 bg-primary hover:bg-[#832323] text-primary-foreground text-xs font-semibold rounded-[var(--radius)]"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="p-5 space-y-4">
            {/* Balance Badge */}
            <div className="bg-secondary/60 border border-border rounded-[var(--radius)] p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">Available to Cash Out</span>
              <span className="font-mono font-bold text-primary text-base">₹{currentBalance}</span>
            </div>

            {/* Amount Input & Presets */}
            <div>
              <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                Amount to Withdraw (Min ₹50)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="50"
                  max={currentBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm font-mono font-bold bg-background border border-border rounded-[var(--radius)] px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(currentBalance))}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold text-primary bg-secondary border border-border rounded-[var(--radius)] hover:bg-secondary/80 cursor-pointer"
                >
                  All
                </button>
              </div>
            </div>

            {/* Payout Destination Selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-[var(--radius)] border flex items-center justify-center gap-1 cursor-pointer transition ${
                  method === 'upi' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                UPI Payout
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-[var(--radius)] border flex items-center justify-center gap-1 cursor-pointer transition ${
                  method === 'bank' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Bank IMPS
              </button>
            </div>

            {method === 'upi' ? (
              <div>
                <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                  Recipient UPI ID
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okbank"
                  className="w-full text-xs font-mono bg-background border border-border rounded-[var(--radius)] p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full text-xs font-mono bg-background border border-border rounded-[var(--radius)] p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground block mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full text-xs font-mono uppercase bg-background border border-border rounded-[var(--radius)] p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Instant IMPS Transfer • Recorded on Audit Ledger</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || currentBalance < 50}
                className="px-4 py-2 bg-[#1b6a43] hover:bg-[#155334] disabled:opacity-50 text-white font-semibold text-xs rounded-[var(--radius)] shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? 'Initiating IMPS...' : `Cash Out ₹${amount}`}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;