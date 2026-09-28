import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser, getDepartments } from '../services/api';

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
  'w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

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

  // The one department document matching BOTH selections. Its _id is what
  // gets submitted as deptId; the user never sees or types an ID.
  const selectedDepartment = departments.find(
    (d) => d.deptName === selectedDeptName && d.programName === selectedProgram
  );

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDeptChange = (e) => {
    const name = e.target.value;
    setSelectedDeptName(name);
    // Auto-pick the program if this department only offers one.
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
      setError('Please select your department and program');
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
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
            C
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your Commuto account</h1>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">College ID</label>
            <input type="text" name="collegeId" required value={formData.collegeId}
              onChange={handleChange} className={inputClass} placeholder="MCA2024017" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input type="text" name="name" required value={formData.name}
              onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">College Email</label>
            <input type="email" name="email" required value={formData.email}
              onChange={handleChange} className={inputClass} placeholder="you@college.edu" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input type="tel" name="phone" required value={formData.phone}
              onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <select required value={selectedDeptName} onChange={handleDeptChange}
              disabled={deptLoading} className={inputClass}>
              <option value="">{deptLoading ? 'Loading departments...' : 'Select department'}</option>
              {deptNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
            <select required value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              disabled={!selectedDeptName} className={inputClass}>
              <option value="">
                {selectedDeptName ? 'Select program' : 'Select a department first'}
              </option>
              {programOptions.map((program) => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
            <input type="number" name="year" required min="1" value={formData.year}
              onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" name="password" required minLength={6}
              value={formData.password} onChange={handleChange} className={inputClass} />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" onChange={toggleDriverRole} className="rounded" />
            I also want to register as a driver
          </label>

          <button type="submit" disabled={submitting || deptLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-md transition">
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;