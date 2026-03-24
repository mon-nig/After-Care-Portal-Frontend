"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface MaternalDemographicsSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
  visible: boolean
}

export function MaternalDemographicsSection({ formData, onChange, visible }: MaternalDemographicsSectionProps) {
  if (!visible) return null;

  return (
    <fieldset className="space-y-6 rounded-lg border-2 border-dashed border-pink-200 bg-pink-50/30 p-5 mt-6">
      <legend className="text-base font-semibold text-foreground px-2">
        Subsection: Maternal Demographics
      </legend>
      <p className="text-xs text-muted-foreground leading-relaxed -mt-2 mb-4">
        (Only if the departed is a woman below 49 years of age)
      </p>

      {/* (23a) Pregnancy Status */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(23a)</span>
          Was she pregnant at the time of death?
        </Label>
        <RadioGroup
          value={formData.wasPregnant || ""}
          onValueChange={(val) => onChange("wasPregnant", val)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="pregnantYes" />
            <Label htmlFor="pregnantYes" className="font-normal cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="pregnantNo" />
            <Label htmlFor="pregnantNo" className="font-normal cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {/* (23b) Recent Birth */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(23b)</span>
          Has she given birth in the previous 6 weeks (42 days)?
        </Label>
        <RadioGroup
          value={formData.recentBirth || ""}
          onValueChange={(val) => onChange("recentBirth", val)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="birthYes" />
            <Label htmlFor="birthYes" className="font-normal cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="birthNo" />
            <Label htmlFor="birthNo" className="font-normal cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {/* (23c) Recent Abortion */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(23c)</span>
          Has an abortion taken place?
        </Label>
        <RadioGroup
          value={formData.recentAbortion || ""}
          onValueChange={(val) => onChange("recentAbortion", val)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="abortionYes" />
            <Label htmlFor="abortionYes" className="font-normal cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="abortionNo" />
            <Label htmlFor="abortionNo" className="font-normal cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {/* (23d) Timeline */}
      <div className="space-y-2">
        <Label htmlFor="maternalTimelineDays" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(23d)</span>
          If a birth or abortion took place, how many days before the death has it occurred?
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="maternalTimelineDays"
            type="number"
            min="0"
            className="w-24"
            value={formData.maternalTimelineDays || ""}
            onChange={(e) => onChange("maternalTimelineDays", e.target.value)}
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      </div>
    </fieldset>
  )
}
