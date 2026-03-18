import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { getMyCases, issueB12 } from "../../lib/api";

export function DoctorDashboard() {
  const { token } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCase, setActiveCase] = useState<any>(null);

  const [naturalDeath, setNaturalDeath] = useState(true);
  const [icd10Code, setIcd10Code] = useState("");
  const [primaryCause, setPrimaryCause] = useState("");

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      const caseList = data.content || [];
      setCases(caseList.filter((c: any) => c.status === "PENDING_B12_MEDICAL"));
    } catch (err: any) {
      setError(err.message || "Failed to load pending cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCases();
  }, [token]);

  const handleSubmitB12 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    try {
      await issueB12(activeCase.caseId, { naturalDeath, icd10Code, primaryCause }, token);
      setActiveCase(null);
      setPrimaryCause("");
      setIcd10Code("");
      fetchCases();
    } catch (err: any) {
      alert("Error issuing B-12: " + err.message);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading pending cases...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Pending Medical Certifications (B-12)</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      {cases.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
          You have no pending cases awaiting medical certification in your sector.
        </div>
      )}

      {!activeCase ? (
        <div className="grid grid-cols-1 gap-4">
          {cases.map((c) => (
            <div key={c.caseId} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{c.deceasedFullName}</h3>
                <p className="text-sm text-gray-500">NIC: {c.deceasedNic} • DOD: {c.dateOfDeath}</p>
              </div>
              <button 
                onClick={() => setActiveCase(c)}
                className="mt-4 sm:mt-0 bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition"
              >
                Review & Issue B-12
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 p-4">
            <h3 className="font-bold text-blue-900">Issuing Medical Certificate (B-12)</h3>
            <p className="text-sm text-blue-700 mt-1">For deceased: <span className="font-semibold">{activeCase.deceasedFullName}</span> (NIC: {activeCase.deceasedNic})</p>
          </div>
          
          <form onSubmit={handleSubmitB12} className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <input 
                type="checkbox" 
                id="naturalDeath" 
                checked={naturalDeath} 
                onChange={(e) => setNaturalDeath(e.target.checked)} 
                className="w-5 h-5 text-blue-600 rounded"
              />
              <label htmlFor="naturalDeath" className="font-medium text-gray-800 cursor-pointer">
                Declare as Natural Death
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ICD-10 Code</label>
                <input 
                  type="text" 
                  required 
                  value={icd10Code} 
                  onChange={(e) => setIcd10Code(e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" 
                  placeholder="e.g. I21.9" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Primary Cause of Death</label>
                <input 
                  type="text" 
                  required 
                  value={primaryCause} 
                  onChange={(e) => setPrimaryCause(e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="e.g. Acute myocardial infarction" 
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                className={`text-white px-5 py-2.5 rounded-md font-medium border transition ${naturalDeath ? 'bg-green-600 hover:bg-green-700 border-green-700' : 'bg-red-600 hover:bg-red-700 border-red-700'}`}
              >
                {naturalDeath ? "Issue B-12" : "Reject Case as Unnatural"}
              </button>
              <button type="button" onClick={() => setActiveCase(null)} className="bg-white text-gray-700 px-5 py-2.5 rounded-md font-medium hover:bg-gray-50 border border-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
