"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface PersonDepartedSectionProps {
  formData: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function PersonDepartedSection({ formData, onChange }: PersonDepartedSectionProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-foreground border-b border-border pb-2 w-full">
        Section 2: Information about the Person Departed
      </legend>

      {/* (8) Identification Status */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(8)</span>
          Identification Status
        </Label>
        <RadioGroup
          value={formData.identificationStatus || ""}
          onValueChange={(val) => onChange("identificationStatus", val)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="identified" id="identified" />
            <Label htmlFor="identified" className="font-normal cursor-pointer">
              Identified
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="not_identified" id="not_identified" />
            <Label htmlFor="not_identified" className="font-normal cursor-pointer">
              Not Identified
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* (9) Identification Number */}
      <div className="space-y-2">
        <Label htmlFor="deceasedNic" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(9)</span>
          Identification Number (Sri Lankan NIC)
        </Label>
        <Input
          id="deceasedNic"
          name="deceasedNic"
          placeholder="NIC Number"
          value={formData.deceasedNic || ""}
          onChange={(e) => onChange("deceasedNic", e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* (10) Foreigner Details */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(10)</span>
          Foreigner Details (If Applicable)
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="foreignerCountry" className="text-xs text-muted-foreground">
              Country
            </Label>
            <Input
              id="foreignerCountry"
              name="foreignerCountry"
              placeholder="Country of Origin"
              value={formData.foreignerCountry || ""}
              onChange={(e) => onChange("foreignerCountry", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="foreignerPassport" className="text-xs text-muted-foreground">
              Passport Number
            </Label>
            <Input
              id="foreignerPassport"
              name="foreignerPassport"
              placeholder="Passport Number"
              value={formData.foreignerPassport || ""}
              onChange={(e) => onChange("foreignerPassport", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* (11 & 12) Date of Birth and Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            <span className="text-muted-foreground mr-1.5">(11)</span>
            Date of Birth
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Year"
              value={formData.dobYear || ""}
              onChange={(e) => onChange("dobYear", e.target.value)}
            />
            <Input
              placeholder="Month"
              value={formData.dobMonth || ""}
              onChange={(e) => onChange("dobMonth", e.target.value)}
            />
            <Input
              placeholder="Day"
              value={formData.dobDay || ""}
              onChange={(e) => onChange("dobDay", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            <span className="text-muted-foreground mr-1.5">(12)</span>
            Age
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Years"
              value={formData.ageYears || ""}
              onChange={(e) => onChange("ageYears", e.target.value)}
            />
            <Input
              placeholder="Months"
              value={formData.ageMonths || ""}
              onChange={(e) => onChange("ageMonths", e.target.value)}
            />
            <Input
              placeholder="Days"
              value={formData.ageDays || ""}
              onChange={(e) => onChange("ageDays", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* (13) Gender */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(13)</span>
          Gender
        </Label>
        <RadioGroup
          value={formData.deceasedGender || ""}
          onValueChange={(val) => onChange("deceasedGender", val)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="male" id="genderMale" />
            <Label htmlFor="genderMale" className="font-normal cursor-pointer">
              Male
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="female" id="genderFemale" />
            <Label htmlFor="genderFemale" className="font-normal cursor-pointer">
              Female
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* (14) Race */}
      <div className="space-y-2">
        <Label htmlFor="deceasedRace" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(14)</span>
          Race
        </Label>
        <Input
          id="deceasedRace"
          name="deceasedRace"
          placeholder="Race"
          value={formData.deceasedRace || ""}
          onChange={(e) => onChange("deceasedRace", e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* (15 & 16) Names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nameOfficialLang" className="text-sm font-medium">
            <span className="text-muted-foreground mr-1.5">(15)</span>
            Name (Official Language)
          </Label>
          <Input
            id="nameOfficialLang"
            name="nameOfficialLang"
            placeholder="Sinhala or Tamil"
            value={formData.nameOfficialLang || ""}
            onChange={(e) => onChange("nameOfficialLang", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameEnglish" className="text-sm font-medium">
            <span className="text-muted-foreground mr-1.5">(16)</span>
            Name (English)
          </Label>
          <Input
            id="nameEnglish"
            name="nameEnglish"
            placeholder="English Full Name"
            value={formData.nameEnglish || ""}
            onChange={(e) => onChange("nameEnglish", e.target.value)}
          />
        </div>
      </div>

      {/* (17) Permanent Address */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(17)</span>
          Permanent Address
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permAddressDistrict" className="text-xs text-muted-foreground">
              District
            </Label>
            <Input
              id="permAddressDistrict"
              value={formData.permAddressDistrict || ""}
              onChange={(e) => onChange("permAddressDistrict", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permAddressDs" className="text-xs text-muted-foreground">
              Divisional Secretary Division
            </Label>
            <Input
              id="permAddressDs"
              value={formData.permAddressDs || ""}
              onChange={(e) => onChange("permAddressDs", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permAddressGn" className="text-xs text-muted-foreground">
              Grama Niladhari Division
            </Label>
            <Input
              id="permAddressGn"
              value={formData.permAddressGn || ""}
              onChange={(e) => onChange("permAddressGn", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* (18) Rank or Profession */}
      <div className="space-y-2">
        <Label htmlFor="profession" className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(18)</span>
          Rank or Profession
        </Label>
        <Input
          id="profession"
          name="profession"
          placeholder="Profession"
          value={formData.profession || ""}
          onChange={(e) => onChange("profession", e.target.value)}
        />
      </div>

      {/* (19) Pension Status */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">(19)</span>
          Pension Status
        </Label>
        <RadioGroup
          value={formData.pensionStatus || ""}
          onValueChange={(val) => onChange("pensionStatus", val)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="pensionerYes" />
            <Label htmlFor="pensionerYes" className="font-normal cursor-pointer">
              Was a Pensioner
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="pensionerNo" />
            <Label htmlFor="pensionerNo" className="font-normal cursor-pointer">
              Was not a Pensioner
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* (20-23) Parents Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-3 p-4 border rounded-lg bg-card">
          <h4 className="font-semibold text-sm">Father's Details</h4>
          <div className="space-y-2">
            <Label htmlFor="fatherNic" className="text-xs">
              <span className="text-muted-foreground mr-1.5">(20)</span>
              Identification Number
            </Label>
            <Input
              id="fatherNic"
              value={formData.fatherNic || ""}
              onChange={(e) => onChange("fatherNic", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherName" className="text-xs">
              <span className="text-muted-foreground mr-1.5">(21)</span>
              Full Name
            </Label>
            <Input
              id="fatherName"
              value={formData.fatherName || ""}
              onChange={(e) => onChange("fatherName", e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-3 p-4 border rounded-lg bg-card">
          <h4 className="font-semibold text-sm">Mother's Details</h4>
          <div className="space-y-2">
            <Label htmlFor="motherNic" className="text-xs">
              <span className="text-muted-foreground mr-1.5">(22)</span>
              Identification Number
            </Label>
            <Input
              id="motherNic"
              value={formData.motherNic || ""}
              onChange={(e) => onChange("motherNic", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motherName" className="text-xs">
              <span className="text-muted-foreground mr-1.5">(23)</span>
              Full Name
            </Label>
            <Input
              id="motherName"
              value={formData.motherName || ""}
              onChange={(e) => onChange("motherName", e.target.value)}
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}
