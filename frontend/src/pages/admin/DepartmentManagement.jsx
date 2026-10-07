import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  AlertCircle 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../services/api';

const inputClass =
  'bg-background border border-border rounded-[var(--radius)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition';

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newDept, setNewDept] = useState({ deptName: '', programName: '' });
  const [adding, setAdding] = useState(false);

  // Inline editing: which row is being edited, and its draft values.
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ deptName: '', programName: '' });

  useEffect(() => {
    let ignore = false;

    getDepartments()
      .then(({ data }) => {
        if (!ignore) setDepartments(data.departments || []);
      })
      .catch(() => {
        if (!ignore) setError('Failed to load departments');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const refreshDepartments = async () => {
    const { data } = await getDepartments();
    setDepartments(data.departments || []);
  };

  const run = async (action, fallbackMessage) => {
    setError('');
    try {
      await action();
      await refreshDepartments();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || fallbackMessage);
      return false;
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    const ok = await run(() => createDepartment(newDept), 'Failed to add department');
    if (ok) setNewDept({ deptName: '', programName: '' });
    setAdding(false);
  };

  const startEdit = (dept) => {
    setEditingId(dept._id);
    setEditDraft({ deptName: dept.deptName, programName: dept.programName });
  };

  const saveEdit = async () => {
    const ok = await run(() => updateDepartment(editingId, editDraft), 'Failed to update department');
    if (ok) setEditingId(null);
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete ${dept.deptName} (${dept.programName})?`)) return;
    await run(() => deleteDepartment(dept._id), 'Failed to delete department');
  };

  return (
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-border">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Center</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>ACADEMIC DEPARTMENTS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
            Manage Academic Departments
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Configure campus departments and degree programs for student verification and trust graph scoring.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Form */}
        <form
          onSubmit={handleAdd}
          className="bg-card border border-border rounded-[var(--radius)] p-5 flex flex-col sm:flex-row gap-3 shadow-xs items-center"
        >
          <input
            required
            placeholder="Department name (e.g. Computer Applications)"
            value={newDept.deptName}
            onChange={(e) => setNewDept((p) => ({ ...p, deptName: e.target.value }))}
            className={`${inputClass} flex-1 w-full`}
          />
          <input
            required
            placeholder="Program (e.g. MCA)"
            value={newDept.programName}
            onChange={(e) => setNewDept((p) => ({ ...p, programName: e.target.value }))}
            className={`${inputClass} sm:w-44 w-full font-mono uppercase`}
          />
          <Button
            type="submit"
            disabled={adding}
            className="w-full sm:w-auto bg-primary hover:bg-[#832323] text-primary-foreground text-xs font-semibold px-4 h-9 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {adding ? 'Adding...' : 'Add Department'}
          </Button>
        </form>

        {/* Departments Table */}
        <div className="bg-card border border-border rounded-[var(--radius)] shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-muted-foreground">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">No departments yet. Add one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 text-muted-foreground font-mono font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Department Name</th>
                    <th className="px-5 py-3">Program Code</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground">
                  {departments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-secondary/15 transition">
                      {editingId === dept._id ? (
                        <>
                          <td className="px-5 py-2.5">
                            <input
                              value={editDraft.deptName}
                              onChange={(e) => setEditDraft((p) => ({ ...p, deptName: e.target.value }))}
                              className={`${inputClass} w-full`}
                            />
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              value={editDraft.programName}
                              onChange={(e) => setEditDraft((p) => ({ ...p, programName: e.target.value }))}
                              className={`${inputClass} w-32 font-mono uppercase`}
                            />
                          </td>
                          <td className="px-5 py-2.5 text-right space-x-2">
                            <Button
                              onClick={saveEdit}
                              className="bg-[#1b6a43] hover:bg-[#155334] text-white text-[11px] h-7 px-2.5"
                            >
                              <Check className="w-3 h-3 mr-1" /> Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="text-[11px] h-7 px-2.5 border-border text-muted-foreground hover:bg-secondary"
                            >
                              <X className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 font-serif font-medium text-foreground text-sm">
                            {dept.deptName}
                          </td>
                          <td className="px-5 py-3 font-mono">
                            <span className="font-bold text-primary bg-secondary/80 px-2 py-0.5 rounded border border-border text-[11px]">
                              {dept.programName}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right space-x-2 font-mono">
                            <button
                              onClick={() => startEdit(dept)}
                              className="inline-flex items-center gap-1 text-primary hover:underline text-xs cursor-pointer font-medium"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <span className="text-border">•</span>
                            <button
                              onClick={() => handleDelete(dept)}
                              className="inline-flex items-center gap-1 text-rose-600 hover:underline text-xs cursor-pointer font-medium"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DepartmentManagement;