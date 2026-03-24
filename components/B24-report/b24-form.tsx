"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { B24FormHeader } from "./form-header"
import { DeathDetailsSection } from "./death-details-section"
import { CertificationSection } from "./certification-section"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { submitB24Form, fetchRegistrars } from "../../lib/api"
import { useAuth } from "../../contexts/auth-context"

export interface B24FormProps {
  initialData?: Record<string, string>;
  isVerificationFlow?: boolean;
  onVerificationSubmit?: (formData: Record<string, string>) => Promise<void>;
  onCancel?: () => void;
}

export function B24Form({ initialData, isVerificationFlow, onVerificationSubmit, onCancel }: B24FormProps = {}) {
  const [formData, setFormData] = useState<Record<string, string>>(initialData || {})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrars, setRegistrars] = useState<{username: string; fullName: string}[]>([])

  // Fetch registrars on mount for dropdown
  useEffect(() => {
    fetchRegistrars()
      .then(setRegistrars)
      .catch(() => setRegistrars([]))
  }, [])

  const handleChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (isVerificationFlow && onVerificationSubmit) {
        // Special case: workflow api logic for pure verification
        await onVerificationSubmit(formData);
      } else {
        // Standard legacy API
        await submitB24Form(formData)
        setSubmitted(true)
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- AUTO-FILL LOGIC ---
  const { currentNicNo: placeholderToken } = useAuth(); // just to use the context avoiding warnings later
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const familyNicNo = formData.b24FamilyNicNo;

  useEffect(() => {
    // Only attempt auto-fill if NIC is likely valid (e.g. 10 or 12 chars)
    if (!familyNicNo || familyNicNo.length < 10) return;

    const autoFillCase = async () => {
      setIsAutoFilling(true);
      setError(null);
      try {
        // Fetch active death case for this family NIC
        const token = localStorage.getItem("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const CASES_URL = process.env.NEXT_PUBLIC_API_URL 
          ? process.env.NEXT_PUBLIC_API_URL.replace('/v1', '/cases') 
          : "http://localhost:8080/api/cases";
          
        const response = await fetch(`${CASES_URL}/active/${familyNicNo}`, { headers });
        if (response.ok) {
          const caseData = await response.json();
          console.log("Auto-filling from Case:", caseData);
          
          setFormData((prev) => ({
            ...prev,
            // Only overwrite if it hasn't been manually typed yet
            deceasedFullName: prev.deceasedFullName || caseData.deceasedFullName,
            deceasedNicNo: prev.deceasedNicNo || caseData.deceasedNic,
            deceasedAddress: prev.deceasedAddress || caseData.address,
            gender: prev.gender || caseData.gender,
            dateOfDeath: prev.dateOfDeath || caseData.dateOfDeath,
            
            // From Doctor's B12 if it exists
            causeOfDeath: prev.causeOfDeath || (caseData.formB12 ? caseData.formB12.primaryCause : ""),
            
            // From Family applying
            informantFullName: prev.informantFullName || caseData.applicantFullName,
            informantNicNo: prev.informantNicNo || caseData.applicantNic,
          }));
        }
      } catch (err) {
        console.error("Auto-fill failed", err);
      } finally {
        setIsAutoFilling(false);
      }
    };
    
    const timeoutId = setTimeout(autoFillCase, 800); // 800ms debounce
    return () => clearTimeout(timeoutId);
  }, [familyNicNo]);
  // ----------------------

  const handleReset = () => {
    setFormData({})
    setSubmitted(false)
    setError(null)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Report Submitted
          </h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            The Report of Death by Grama Seva Niladhari has been submitted
            successfully. It will be forwarded to the Registrar within seven days
            as required.
          </p>
        </div>
        <Button onClick={handleReset} variant="outline">
          Submit Another Report
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <B24FormHeader formData={formData} onChange={handleChange} />

      <Separator />

      <DeathDetailsSection formData={formData} onChange={handleChange} />

      <Separator />

      <CertificationSection formData={formData} onChange={handleChange} />

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3 text-sm text-destructive border border-destructive/20 mt-4 mb-4">
          <AlertCircle className="size-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Hide Assignment Section for pure Verification Flow since backend already tracks it */}
      {!isVerificationFlow && (
        <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3">System Tracking Assignment</h3>

          {/* Family Member NIC No */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              Family Member NIC No
              {isAutoFilling && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </label>
            <input
              type="text"
              name="b24FamilyNicNo"
              value={formData.b24FamilyNicNo || ""}
              onChange={(e) => handleChange(e.target.name, e.target.value)}
              placeholder="e.g., 200012345678"
              disabled={isSubmitting}
              className="block w-full max-w-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter the NIC of the registered family member to allow them to track this form.</p>
          </div>

          {/* Assigned Registrar Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Registrar</label>
            <select
              name="assignedRegistrarUsername"
              value={formData.assignedRegistrarUsername || ""}
              onChange={(e) => handleChange(e.target.name, e.target.value)}
              disabled={isSubmitting}
              className="block w-full max-w-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white"
              required
            >
              <option value="">-- Select a Registrar --</option>
              {registrars.map((r) => (
                <option key={r.username} value={r.username}>
                  {r.fullName} ({r.username})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Choose the Registrar who will receive this form for review.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        {onCancel ? (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="sm:flex-1 text-gray-700 font-medium"
            disabled={isSubmitting}
          >
            Cancel Review
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleReset} 
            className="sm:flex-1"
            disabled={isSubmitting}
          >
            Reset Form
          </Button>
        )}
        <Button
          type="submit"
          className="sm:flex-1"
          disabled={formData.b24Confirmed !== "true" || isSubmitting}
        >
          {isSubmitting ? "Submitting Report..." : "Submit Report"}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Registrar General{"'"}s Department &mdash; Sri Lanka
      </p>
    </form>
  )
}
