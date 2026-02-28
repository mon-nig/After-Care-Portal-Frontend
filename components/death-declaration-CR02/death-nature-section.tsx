"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DeathNatureSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function DeathNatureSection({ formData, onChange }: DeathNatureSectionProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-foreground border-b border-border pb-2 w-full">
        Cause and Nature of Death
      </legend>

      {/* (24) Cause of death */}
      <div className="space-y-2">
        <Label htmlFor="causeOfDeathDetail" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(24)</span>
          Cause of death
        </Label>
        <Textarea
          id="causeOfDeathDetail"
          name="causeOfDeathDetail"
          placeholder="Describe the cause of death in detail"
          value={formData.causeOfDeathDetail || ""}
          onChange={(e) => onChange("causeOfDeathDetail", e.target.value)}
          rows={3}
        />
      </div>

      {/* (25) Nature of death */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(25)</span>
          Nature of death
        </Label>

        {/* 25.1 Natural death? */}
        <div className="space-y-2 pl-4 border-l-2 border-border">
          <Label className="text-sm">
            1. Is it a natural death?
          </Label>
          <RadioGroup
            value={formData.isNaturalDeath || ""}
            onValueChange={(val) => onChange("isNaturalDeath", val)}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="naturalYes" />
              <Label htmlFor="naturalYes" className="font-normal cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="naturalNo" />
              <Label htmlFor="naturalNo" className="font-normal cursor-pointer">
                No
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* 25.2 Reasons for sudden death */}
        <div className="space-y-2 pl-4 border-l-2 border-border">
          <Label htmlFor="suddenDeathReasons" className="text-sm">
            2. If not, what are the reasons for it being a sudden death?
          </Label>
          <Textarea
            id="suddenDeathReasons"
            name="suddenDeathReasons"
            placeholder="Describe reasons for sudden death"
            value={formData.suddenDeathReasons || ""}
            onChange={(e) => onChange("suddenDeathReasons", e.target.value)}
            rows={2}
          />
        </div>

        {/* 25.3 Opinion about the death */}
        <div className="space-y-2 pl-4 border-l-2 border-border">
          <Label htmlFor="opinionAboutDeath" className="text-sm">
            3. What is your opinion about the death?
          </Label>
          <Textarea
            id="opinionAboutDeath"
            name="opinionAboutDeath"
            placeholder="State your opinion"
            value={formData.opinionAboutDeath || ""}
            onChange={(e) => onChange("opinionAboutDeath", e.target.value)}
            rows={2}
          />
        </div>

        {/* 25.4 Other information */}
        <div className="space-y-2 pl-4 border-l-2 border-border">
          <Label htmlFor="otherInformation" className="text-sm">
            4. If there is any other information to be given
          </Label>
          <Textarea
            id="otherInformation"
            name="otherInformation"
            placeholder="Any other information"
            value={formData.otherInformation || ""}
            onChange={(e) => onChange("otherInformation", e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </fieldset>
  )
}
