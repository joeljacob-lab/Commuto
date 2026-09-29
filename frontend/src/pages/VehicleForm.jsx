import { useState, useRef } from 'react';
import { addVehicle } from '../services/api';

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
      setStatus({
        loading: false,
        error: 'Unsupported file format! Please upload JPG, PNG, or PDF files only.',
        success: '',
      });
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
        setStatus({
          loading: false,
          error: 'Error reading files. Please try again.',
          success: '',
        });
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    if (documents.length === 0) {
      setStatus({
        loading: false,
        error: 'Please upload at least one RC/Insurance document.',
        success: '',
      });
      return;
    }

    try {
      await addVehicle({ ...formData, documents });
      
      setStatus({
        loading: false,
        error: '',
        success: 'Vehicle submitted for admin verification!',
      });

      // 1. Reset all form text inputs
      setFormData({
        registrationNumber: '',
        model: '',
        type: 'car',
        color: '',
        seats: 4,
        mileageKmpl: 15,
      });

      // 2. Reset the file state
      setDocuments([]);

      // 3. Clear the DOM file input display text
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.message || 'Failed to submit vehicle.',
        success: '',
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Register a Vehicle</h1>

      {status.error && (
        <div className="text-red-700 bg-red-50 border border-red-200 text-sm p-3 mb-4 rounded-lg">
          {status.error}
        </div>
      )}

      {status.success && (
        <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-sm p-3 mb-4 rounded-lg">
          {status.success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 border border-slate-200 rounded-xl shadow-xs"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Registration Number
          </label>
          <input
            required
            placeholder="e.g. KL 07 AB 1234"
            value={formData.registrationNumber}
            onChange={(e) =>
              setFormData({ ...formData, registrationNumber: e.target.value })
            }
            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Vehicle Model
            </label>
            <input
              required
              placeholder="e.g. Swift, Activa"
              value={formData.model}
              onChange={(e) =>
                setFormData({ ...formData, model: e.target.value })
              }
              className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Vehicle Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Color
            </label>
            <input
              placeholder="e.g. White, Grey"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
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
              className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
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
              className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Upload RC &amp; Insurance Documents
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={handleFileChange}
            className="w-full border border-slate-300 rounded-md p-2 text-sm bg-slate-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            Supported formats: <strong>JPG, JPEG, PNG, or PDF</strong>. You can select multiple files.
          </p>
        </div>

        <button
          type="submit"
          disabled={status.loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition shadow-xs mt-2"
        >
          {status.loading ? 'Uploading & Registering...' : 'Submit Vehicle'}
        </button>
      </form>
    </div>
  );
}

export default VehicleForm;