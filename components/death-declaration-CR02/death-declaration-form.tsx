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
import { CheckCircle2 } from "lucide-react"

export function DeathDeclarationForm() {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleReset = () => {
    setFormData({})
    setSubmitted(false)
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

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handleReset} className="sm:flex-1">
          Reset Form
        </Button>
        <Button
          type="submit"
          className="sm:flex-1"
          disabled={formData.declarationConfirmed !== "true"}
        >
          Submit Declaration
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Registrar General{"'"}s Department &mdash; Sri Lanka
      </p>
    </form>
  )
}
