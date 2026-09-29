import { useState, useEffect } from 'react';
import { getPendingVehicles, updateVehicleStatus } from '../../services/api';

function VehicleVerificationQueue() {
  const [vehicles, setVehicles] = useState([]);
  // We use this state simply to trigger the useEffect to run again
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false; // prevents setting state if component unmounts

    const loadVehicles = async () => {
      try {
        const { data } = await getPendingVehicles();
        if (!ignore) {
          setVehicles(data.vehicles);
        }
      } catch (err) {
        console.error('Failed to load vehicles', err);
      }
    };

    loadVehicles();

    return () => {
      ignore = true; // cleanup function
    };
  }, [refreshTrigger]); // Re-runs automatically whenever refreshTrigger changes

  const handleAction = async (id, status) => {
    if (!window.confirm(`Mark this vehicle as ${status}?`)) return;
    await updateVehicleStatus(id, status);
    
    // Incrementing this triggers the useEffect above to fetch the fresh list!
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Vehicle Verification Queue</h1>
      {vehicles.length === 0 ? <p>No pending vehicles.</p> : (
        <div className="space-y-6">
          {vehicles.map(v => (
            <div key={v._id} className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{v._id} — {v.model}</h3>
                <p className="text-sm text-slate-600">Owner: {v.ownerId?.name} ({v.ownerId?.email})</p>
                <p className="text-sm text-slate-600">Type: {v.type} | Seats: {v.seats} | Mileage: {v.mileageKmpl} kmpl</p>
                
                <div className="flex gap-2 mt-3">
                  {v.documentUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs bg-slate-100 px-2 py-1 rounded text-indigo-600 hover:underline">
                      View Document {i + 1}
                    </a>
                  ))}
                </div>
              </div>
              
              <div className="flex sm:flex-col gap-2">
                <button onClick={() => handleAction(v._id, 'approved')} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm">Approve</button>
                <button onClick={() => handleAction(v._id, 'rejected')} className="bg-red-600 text-white px-4 py-2 rounded text-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VehicleVerificationQueue;