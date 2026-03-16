"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FormHeader } from "./form-header"
import { DeathInfoSection } from "./death-info-section"
import { DeathNatureSection } from "./death-nature-section"
import { InformantSection } from "./informant-section"
import { SuddenDeathSection } from "./sudden-death-section"
import { OfficerSection } from "./officer-section"
import { DeclarationSection } from "./declaration-section"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { submitCr02Form } from "@/lib/api"

export function DeathDeclarationForm() {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      await submitCr02Form(formData)
      setSubmitted(true)
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormHeader />

      <DeathInfoSection formData={formData} onChange={handleChange} />

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

      <OfficerSection formData={formData} onChange={handleChange} />

      <Separator />

      <DeclarationSection formData={formData} onChange={handleChange} />

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3 text-sm text-destructive border border-destructive/20 mt-4 mb-4">
          <AlertCircle className="size-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3">System Tracking Assignment</h3>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Family Member Account ID (to track status)</label>
        <input
          type="number"
          name="cr02FamilyUserId"
          value={formData.cr02FamilyUserId || ""}
          onChange={(e) => handleChange(e.target.name, e.target.value)}
          placeholder="e.g., 1 for test family_user"
          disabled={isSubmitting}
          className="block w-full max-w-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          required
        />
        <p className="text-xs text-gray-500 mt-2">Required. Assign this form to a registered family member ID (e.g. 1) to allow them to track its current progress.</p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleReset} 
          className="sm:flex-1"
          disabled={isSubmitting}
        >
          Reset Form
        </Button>
        <Button
          type="submit"
          className="sm:flex-1"
          disabled={formData.declarationConfirmed !== "true" || isSubmitting}
        >
          {isSubmitting ? "Submitting Declaration..." : "Submit Declaration"}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Registrar General{"'"}s Department &mdash; Sri Lanka
      </p>
    </form>
  )
}
