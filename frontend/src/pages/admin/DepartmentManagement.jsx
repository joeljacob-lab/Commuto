import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../services/api';

const inputClass =
  'border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newDept, setNewDept] = useState({ deptName: '', programName: '' });
  const [adding, setAdding] = useState(false);

  // Inline editing: which row is being edited, and its draft values.
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ deptName: '', programName: '' });

  // Initial load: setState happens inside promise callbacks (allowed by the
  // lint rule), and `ignore` stops a late response from updating state
  // after the component has unmounted.
  useEffect(() => {
    let ignore = false;

    getDepartments()
      .then(({ data }) => {
        if (!ignore) setDepartments(data.departments);
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

  // Re-fetch after add/edit/delete. Only ever called from event handlers, never from an effect.
  const refreshDepartments = async () => {
    const { data } = await getDepartments();
    setDepartments(data.departments);
  };

  // Runs an API action, then refreshes the list; shows the backend's message on failure.
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
    const ok = await run(() => updateDepartment(editingId, editDraft), 'Failed to update');
    if (ok) setEditingId(null);
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete ${dept.deptName} (${dept.programName})?`)) return;
    await run(() => deleteDepartment(dept._id), 'Failed to delete');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-indigo-600 hover:underline">← Back to home</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-6">Manage Departments</h1>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleAdd}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input required placeholder="Department name" value={newDept.deptName}
            onChange={(e) => setNewDept((p) => ({ ...p, deptName: e.target.value }))}
            className={`${inputClass} flex-1`} />
          <input required placeholder="Program (e.g. MCA)" value={newDept.programName}
            onChange={(e) => setNewDept((p) => ({ ...p, programName: e.target.value }))}
            className={`${inputClass} sm:w-40`} />
          <button type="submit" disabled={adding}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md">
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading...</p>
          ) : departments.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No departments yet. Add one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept._id} className="border-t border-slate-100">
                    {editingId === dept._id ? (
                      <>
                        <td className="px-4 py-2">
                          <input value={editDraft.deptName}
                            onChange={(e) => setEditDraft((p) => ({ ...p, deptName: e.target.value }))}
                            className={`${inputClass} w-full`} />
                        </td>
                        <td className="px-4 py-2">
                          <input value={editDraft.programName}
                            onChange={(e) => setEditDraft((p) => ({ ...p, programName: e.target.value }))}
                            className={`${inputClass} w-full`} />
                        </td>
                        <td className="px-4 py-2 text-right space-x-3">
                          <button onClick={saveEdit} className="text-indigo-600 hover:underline">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-slate-500 hover:underline">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-slate-800">{dept.deptName}</td>
                        <td className="px-4 py-3 text-slate-800">{dept.programName}</td>
                        <td className="px-4 py-3 text-right space-x-3">
                          <button onClick={() => startEdit(dept)} className="text-indigo-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(dept)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default DepartmentManagement;