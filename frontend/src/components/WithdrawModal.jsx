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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Withdraw to Bank / UPI</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successData ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-slate-900">Transfer Initiated!</h4>
            <p className="text-xs text-slate-600">{successData.message}</p>
            <p className="text-[11px] text-slate-400 font-mono">
              Txn ID: #{successData.transaction?._id?.slice(-8).toUpperCase()}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="p-5 space-y-4">
            {/* Balance Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Available to Cash Out</span>
              <span className="font-black text-slate-900 text-sm">₹{currentBalance}</span>
            </div>

            {/* Amount Input & Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Amount to Withdraw (Min ₹50)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="50"
                  max={currentBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(currentBalance))}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
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
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md border flex items-center justify-center gap-1 cursor-pointer ${
                  method === 'upi' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                UPI Payout
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md border flex items-center justify-center gap-1 cursor-pointer ${
                  method === 'bank' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Bank IMPS
              </button>
            </div>

            {method === 'upi' ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Recipient UPI ID
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okbank"
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Instant IMPS Transfer • Recorded on Audit Ledger</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || currentBalance < 50}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? 'Initiating IMPS...' : `Cash Out ₹${amount}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;