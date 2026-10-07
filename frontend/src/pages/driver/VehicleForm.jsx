import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/toaster';
import { addVehicle } from '../../services/api';

function VehicleForm() {
  const [formData, setFormData] = useState({
    registrationNumber: '',
    model: '',
    type: 'car',
    color: '',
    seats: 4,
    mileageKmpl: 15,
  });

  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  // Ref used to reset the native file input field after successful submit
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file formats (JPG, JPEG, PNG, PDF only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const hasInvalidFile = files.some((file) => !allowedTypes.includes(file.type));

    if (hasInvalidFile) {
      const errMsg = 'Unsupported file format! Please upload JPG, PNG, or PDF files only.';
      setStatus({
        loading: false,
        error: errMsg,
        success: '',
      });
      toast.error(errMsg, { title: 'Invalid File Format' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setDocuments([]);
      return;
    }

    // Convert valid images to Base64
    Promise.all(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
      })
    )
      .then((base64Files) => {
        setDocuments(base64Files);
        setStatus((prev) => ({ ...prev, error: '' }));
      })
      .catch(() => {
        const errMsg = 'Error reading files. Please try again.';
        setStatus({
          loading: false,
          error: errMsg,
          success: '',
        });
        toast.error(errMsg, { title: 'Upload Error' });
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    if (documents.length === 0) {
      const errMsg = 'Please upload at least one RC or Insurance document for verification.';
      setStatus({
        loading: false,
        error: errMsg,
        success: '',
      });
      toast.warning(errMsg, { title: 'Documents Required' });
      return;
    }

    try {
      await addVehicle({ ...formData, documents });
      
      const successMsg = 'Vehicle submitted for admin verification! Our campus safety team will review your papers shortly.';
      setStatus({
        loading: false,
        error: '',
        success: successMsg,
      });
      toast.success('Vehicle registered and submitted for admin verification!', { title: 'Submission Received' });

      // Reset form
      setFormData({
        registrationNumber: '',
        model: '',
        type: 'car',
        color: '',
        seats: 4,
        mileageKmpl: 15,
      });

      setDocuments([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit vehicle.';
      setStatus({
        loading: false,
        error: errMsg,
        success: '',
      });
      toast.error(errMsg, { title: 'Registration Failed' });
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-xl mx-auto space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FLEET VERIFICATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
            Register a Vehicle
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your car or two-wheeler details and official RC / Insurance papers for campus verification.
          </p>
        </div>

        {status.error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{status.error}</span>
          </div>
        )}

        {status.success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{status.success}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-[var(--radius)] p-6 sm:p-7 shadow-xs space-y-4"
        >
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Registration Number
            </label>
            <input
              required
              placeholder="e.g. KL 07 AB 1234"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData({ ...formData, registrationNumber: e.target.value })
              }
              className="w-full bg-background border border-border rounded-[var(--radius)] p-2.5 text-sm font-mono uppercase text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Vehicle Model
              </label>
              <input
                required
                placeholder="e.g. Swift, Activa, Nexon"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Vehicle Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Color
              </label>
              <input
                placeholder="e.g. White, Grey"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Passenger Seats
              </label>
              <input
                required
                type="number"
                min="1"
                max="8"
                value={formData.seats}
                onChange={(e) =>
                  setFormData({ ...formData, seats: e.target.value })
                }
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2.5 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Mileage (km/l)
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.mileageKmpl}
                onChange={(e) =>
                  setFormData({ ...formData, mileageKmpl: e.target.value })
                }
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2.5 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-primary" />
              Upload RC &amp; Insurance Documents
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              className="w-full bg-secondary/30 border border-border rounded-[var(--radius)] p-2 text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:text-xs file:font-semibold file:bg-secondary file:text-primary hover:file:bg-secondary/80 cursor-pointer transition"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <FileCheck className="w-3 h-3 text-primary shrink-0" />
              <span>Supported formats: <strong>JPG, JPEG, PNG, or PDF</strong>. Multiple files allowed.</span>
            </p>
          </div>

          <Button
            type="submit"
            disabled={status.loading}
            className="w-full bg-primary hover:bg-[#832323] text-primary-foreground py-2.5 text-sm font-semibold shadow-xs mt-3"
          >
            {status.loading ? 'Uploading & Registering...' : 'Submit Vehicle for Review'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default VehicleForm;