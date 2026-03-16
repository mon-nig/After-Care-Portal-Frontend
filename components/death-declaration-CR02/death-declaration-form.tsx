"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { FormHeader } from "./form-header"
import { DeathInfoSection } from "./death-info-section"
import { DeathNatureSection } from "./death-nature-section"
import { InformantSection } from "./informant-section"
import { SuddenDeathSection } from "./sudden-death-section"
import { OfficerSection } from "./officer-section"
import { DeclarationSection } from "./declaration-section"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { submitCr02Form, fetchB24ById } from "../../lib/api"
import { useAuth } from "../../contexts/auth-context"

interface DeathDeclarationFormProps {
  sourceB24Id?: number;
}

export function DeathDeclarationForm({ sourceB24Id }: DeathDeclarationFormProps) {
  const router = useRouter()
  const { currentUsername } = useAuth()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreFilling, setIsPreFilling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-fill from B24 if sourceB24Id is provided
  useEffect(() => {
    if (!sourceB24Id) return;

    setIsPreFilling(true);
    fetchB24ById(sourceB24Id)
      .then((b24) => {
        setFormData((prev) => ({
          ...prev,
          // Map B24 fields → CR02 fields
          deathYear: b24.deathYear ? String(b24.deathYear) : "",
          deathMonth: b24.deathMonth ? String(b24.deathMonth) : "",
          deathDay: b24.deathDay ? String(b24.deathDay) : "",
          placeInEnglish: b24.placeOfDeath || "",
          causeOfDeath: b24.causeOfDeath || "",
          informantName: b24.informantName || "",
          informantAddress: b24.informantAddress || "",
          regDivision: b24.registrarDivision || "",
          cr02FamilyNicNo: b24.familyNicNo || "",
          deceasedName: b24.fullName || "",
        }));
      })
      .catch(() => {
        setError("Failed to load B24 data for pre-filling. You can still fill the form manually.");
      })
      .finally(() => setIsPreFilling(false));
  }, [sourceB24Id]);

  const handleChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const payload = { ...formData, submittedByUsername: currentUsername || "" };
      console.log("[CR02 Submit] Payload:", JSON.stringify(payload, null, 2));
      await submitCr02Form(payload)
      setSubmitted(true)
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 1500)
    } catch (err: unknown) {
      console.error("[CR02 Submit] API Error:", err);
      const message = err instanceof Error ? err.message : "Failed to connect to the server.";
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

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
            Death Declaration Submitted
          </h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            The CR02 Death Declaration has been submitted successfully.
          </p>
        </div>
        <Button onClick={handleReset} variant="outline">
          Submit Another Declaration
        </Button>
      </div>
    )
  }

  if (isPreFilling) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">Pre-filling from B24 Report #{sourceB24Id}...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {sourceB24Id && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 border border-blue-200">
          <strong>Pre-filled from B24 #{sourceB24Id}.</strong> Review the data below, fill in any remaining fields, then submit.
        </div>
      )}

      <FormHeader />

      <Separator />

      <DeathInfoSection formData={formData} onChange={handleChange} />

      <Separator />

      <DeathNatureSection formData={formData} onChange={handleChange} />

      <Separator />

      <InformantSection formData={formData} onChange={handleChange} />

      <Separator />

      <SuddenDeathSection formData={formData} onChange={handleChange} visible={formData.typeOfDeath === "sudden"} />

      <Separator />

      <OfficerSection formData={formData} onChange={handleChange} />

      <Separator />

      <DeclarationSection formData={formData} onChange={handleChange} />

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3 text-sm text-destructive border border-destructive/20 mt-4 mb-4">
          <AlertCircle className="size-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3">System Tracking Assignment</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Deceased Name</label>
          <input
            type="text"
            name="deceasedName"
            value={formData.deceasedName || ""}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
            placeholder="Full name of the deceased"
            disabled={isSubmitting}
            className="block w-full max-w-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
            required
          />
        </div>
        <div>
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
          <p className="text-xs text-gray-500 mt-1">Enter the NIC of the registered family member to allow them to track this form.</p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handleReset} className="sm:flex-1" disabled={isSubmitting}>
          Reset Form
        </Button>
        <Button
          type="submit"
          className="sm:flex-1"
          disabled={formData.declarationConfirmed !== "true" || isSubmitting}
        >
          {isSubmitting ? "Submitting Declaration..." : "Submit Death Declaration"}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Registrar General{"'"}s Department &mdash; Sri Lanka
      </p>
    </form>
  )
}
