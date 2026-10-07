import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser, getDepartments } from '../services/api';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/toaster';
import { AlertCircle, ArrowRight } from 'lucide-react';
import commutoLogo from '../assets/Commuto_ emblem.png';

const initialForm = {
  collegeId: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  year: '',
  roles: ['rider'],
};

const inputClass =
  'w-full bg-background border border-border rounded-[var(--radius)] px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-ring transition';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Department data: fetched once, both dropdowns are derived from it.
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getDepartments();
        setDepartments(data.departments);
      } catch {
        setError('Could not load departments. Please refresh the page.');
      } finally {
        setDeptLoading(false);
      }
    };
    load();
  }, []);

  // Dropdown 1: unique department names.
  const deptNames = useMemo(
    () => [...new Set(departments.map((d) => d.deptName))],
    [departments]
  );

  // Dropdown 2: only the programs offered under the chosen department.
  const programOptions = useMemo(
    () => departments.filter((d) => d.deptName === selectedDeptName).map((d) => d.programName),
    [departments, selectedDeptName]
  );

  // The one department document matching BOTH selections.
  const selectedDepartment = departments.find(
    (d) => d.deptName === selectedDeptName && d.programName === selectedProgram
  );

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDeptChange = (e) => {
    const name = e.target.value;
    setSelectedDeptName(name);
    const options = departments.filter((d) => d.deptName === name);
    setSelectedProgram(options.length === 1 ? options[0].programName : '');
  };

  const toggleDriverRole = (e) => {
    setFormData((prev) => ({
      ...prev,
      roles: e.target.checked ? ['rider', 'driver'] : ['rider'],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDepartment) {
      const msg = 'Please select your department and program';
      setError(msg);
      toast.warning(msg, { title: 'Selection Missing' });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await registerUser({
        ...formData,
        deptId: selectedDepartment._id,
        year: Number(formData.year),
      });
      login(data.user, data.token);
      toast.success('Account created! Welcome to Commuto transit.', { title: 'Registration Complete' });
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg, { title: 'Registration Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative selection:bg-accent selection:text-accent-foreground">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 theme-glow-warm pointer-events-none" />
      <div className="absolute inset-0 theme-dot-pattern opacity-50 pointer-events-none" />

      <div className="w-full max-w-lg bg-card border border-border rounded-[var(--radius)] p-8 shadow-xs relative z-10">
        <div className="text-center mb-6">
          <img
            src={commutoLogo}
            alt="Commuto Emblem"
            className="h-12 w-12 object-contain mx-auto mb-3 drop-shadow-xs"
          />
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Create Commuto Account
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Verified campus identity using your college domain and admission roll number
          </p>
        </div>

        {error && (
          <div className="mb-4 text-xs text-destructive bg-secondary/80 border border-destructive/20 rounded-[var(--radius)] p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                College ID (Roll No)
              </label>
              <input
                type="text"
                name="collegeId"
                required
                value={formData.collegeId}
                onChange={handleChange}
                className={inputClass}
                placeholder="MCA2024017"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Your Full Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                College Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="you@college.edu"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                required
                value={selectedDeptName}
                onChange={handleDeptChange}
                disabled={deptLoading}
                className={inputClass}
              >
                <option value="">{deptLoading ? 'Loading departments...' : 'Select department'}</option>
                {deptNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Program
              </label>
              <select
                required
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                disabled={!selectedDeptName}
                className={inputClass}
              >
                <option value="">
                  {selectedDeptName ? 'Select program' : 'Select department first'}
                </option>
                {programOptions.map((program) => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Study Year
              </label>
              <input
                type="number"
                name="year"
                required
                min="1"
                max="5"
                value={formData.year}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. 2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer bg-secondary/50 p-2.5 rounded-[var(--radius)] border border-border">
              <input
                type="checkbox"
                onChange={toggleDriverRole}
                className="rounded text-primary focus:ring-ring accent-[#9b2c2c] h-4 w-4"
              />
              <span className="font-medium">
                I also want to register as a driver (offer car/bike seats)
              </span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={submitting || deptLoading}
            className="w-full mt-2 font-semibold shadow-xs"
            size="lg"
          >
            {submitting ? 'Creating verified account...' : 'Register'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
            Log In <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;