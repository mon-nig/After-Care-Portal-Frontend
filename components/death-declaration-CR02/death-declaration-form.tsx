"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { FormHeader } from "./form-header"
import { DeathInfoSection } from "./death-info-section"
import { PersonDepartedSection } from "./person-departed-section"
import { MaternalDemographicsSection } from "./maternal-demographics-section"
import { DeathNatureSection } from "./death-nature-section"
import { InformantSection } from "./informant-section"
import { SuddenDeathSection } from "./sudden-death-section"
import { OfficerSection } from "./officer-section"
import { DeclarationSection } from "./declaration-section"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { submitCr02Form } from "../../lib/api"

export interface DeathDeclarationFormProps {
  initialData?: Record<string, string>;
  isReviewFlow?: boolean;
  onReviewSubmit?: (formData: Record<string, string>) => Promise<void>;
  onCancel?: () => void;
  mode?: "family" | "registrar";
  isReadOnly?: boolean;
  onBookCemetery?: () => void;
  cemeteryBooking?: {
    status: string;
    cemeteryName: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null;
  isLoadingBooking?: boolean;
}

export function DeathDeclarationForm({ initialData, isReviewFlow, onReviewSubmit, onCancel, mode = "registrar", isReadOnly, onBookCemetery, cemeteryBooking, isLoadingBooking }: DeathDeclarationFormProps = {}) {
  const [formData, setFormData] = useState<Record<string, string>>(initialData || {})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track which fields were pre-filled so we can style them
  const preFilledKeys = useMemo(() => {
    if (!initialData) return new Set<string>();
    return new Set(Object.entries(initialData).filter(([, v]) => v && v.trim() !== "").map(([k]) => k));
  }, [initialData]);

  const handleChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const formRef = useRef<HTMLFormElement>(null);

  // Apply pre-filled styling to inputs that have initialData values
  useEffect(() => {
    if (!formRef.current || preFilledKeys.size === 0) return;
    const inputs = formRef.current.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select");
    inputs.forEach((el) => {
      if (el.name && preFilledKeys.has(el.name)) {
        el.classList.add("cr2-prefilled");
      }
    });
  }, [preFilledKeys]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (isReviewFlow && onReviewSubmit) {
        await onReviewSubmit(formData);
      } else {
        await submitCr02Form(formData)
        setSubmitted(true)
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({})
    setSubmitted(false)
    setError(null)
  }

  // Determine if maternal demographics should be visible
  const isFemale = formData.deceasedGender === "female";
  const ageYears = parseInt(formData.ageYears || "0", 10);
  const showMaternal = isFemale && ageYears < 49;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Declaration Submitted
          </h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            The Declaration of Death form has been submitted successfully. It will be
            forwarded to the Registrar for registration in the Civil Registration System.
          </p>
        </div>
        <Button onClick={handleReset} variant="outline">
          Submit Another Declaration
        </Button>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-6 bg-white rounded-xl border border-border/40 shadow-sm p-4 sm:p-8"
    >
      <fieldset disabled={isReadOnly} className="contents">
        {/* Inject styles for pre-filled fields */}
      <style>{`
        .cr2-form-prefilled input,
        .cr2-form-prefilled textarea,
        .cr2-form-prefilled select {
          transition: background-color 0.2s ease;
        }
        .cr2-prefilled {
          background-color: #eff6ff !important;
          border-left: 3px solid #3b82f6 !important;
        }
      `}</style>
      <FormHeader />

      {preFilledKeys.size > 0 && (
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-100 border-l-2 border-blue-500 shrink-0"></span>
          Fields with a blue highlight have been auto-filled from previous records.
        </div>
      )}
      <DeathInfoSection formData={formData} onChange={handleChange} />

      <Separator />
      
      <PersonDepartedSection formData={formData} onChange={handleChange} />
      
      <MaternalDemographicsSection 
        formData={formData} 
        onChange={handleChange} 
        visible={showMaternal} 
      />

      <Separator />

      <DeathNatureSection formData={formData} onChange={handleChange} />

      <Separator />

      <InformantSection formData={formData} onChange={handleChange} />

      <SuddenDeathSection
        formData={formData}
        onChange={handleChange}
        visible={formData.typeOfDeath === "sudden"}
      />

      <Separator />

      {mode === "registrar" && (
        <>
          <OfficerSection formData={formData} onChange={handleChange} />
          <Separator />
        </>
      )}

      <DeclarationSection formData={formData} onChange={handleChange} />

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3 text-sm text-destructive border border-destructive/20 mt-4 mb-4">
          <AlertCircle className="size-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!isReviewFlow && (
        <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3">System Tracking Assignment</h3>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Family Member NIC No</label>
          <input
            type="text"
            name="cr02FamilyNicNo"
            value={formData.cr02FamilyNicNo || ""}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
            placeholder="e.g., 200012345678"
            disabled={isSubmitting}
            className="block w-full max-w-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
            required
          />
          <p className="text-xs text-gray-500 mt-2">Enter the NIC of the registered family member to allow them to track this form.</p>
        </div>
      )}

      </fieldset>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        {isReadOnly ? (
          <>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="sm:flex-1 text-gray-700 font-medium"
            >
              Close Form
            </Button>
            {onBookCemetery && isLoadingBooking && (
               <div className="sm:flex-1 text-sm text-gray-500 flex items-center justify-center p-2 border border-transparent">Loading booking status...</div>
            )}
            {onBookCemetery && !isLoadingBooking && cemeteryBooking?.status === 'PENDING' && (
              <div className="sm:flex-1 bg-yellow-50 text-yellow-800 p-2 text-sm text-center border border-yellow-200 rounded-md font-medium">
                Booking request submitted. Awaiting cemetery owner approval.
              </div>
            )}
            {onBookCemetery && !isLoadingBooking && cemeteryBooking?.status === 'APPROVED' && (
              <div className="sm:flex-1 bg-green-50 text-green-800 p-2 text-sm text-center border border-green-200 rounded-md">
                <strong>Booking Confirmed:</strong> {cemeteryBooking.cemeteryName} <br/>
                {cemeteryBooking.date} • {cemeteryBooking.startTime} - {cemeteryBooking.endTime}
              </div>
            )}
            {onBookCemetery && !isLoadingBooking && (!cemeteryBooking || cemeteryBooking.status === 'REJECTED') && (
              <Button
                type="button"
                onClick={onBookCemetery}
                className="sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {cemeteryBooking?.status === 'REJECTED' ? "Booking Rejected - Book Again" : "Book Cemetery"}
              </Button>
            )}
          </>
        ) : (
          <>
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
              disabled={formData.declarationConfirmed !== "true" || isSubmitting}
            >
              {isSubmitting ? "Submitting Declaration..." : (mode === "family" ? "Submit CR-2 Declaration" : (isReviewFlow ? "Issue Final Certificate (CR-2)" : "Submit Declaration"))}
            </Button>
          </>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Registrar General{"'"}s Department &mdash; Sri Lanka
      </p>
    </form>
  )
}
