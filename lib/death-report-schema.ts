import { z } from "zod";

export const WORKFLOW_SCENARIOS = ["NATURAL_DEATH_HOME"] as const;
export const IDENTIFICATION_STATUSES = [
  "IDENTIFIED_SRI_LANKAN",
  "IDENTIFIED_FOREIGNER",
  "NOT_IDENTIFIED",
] as const;
export const GENDERS = ["MALE", "FEMALE"] as const;
export const INFORMANT_CAPACITIES = [
  "HUSBAND_WIFE",
  "FATHER_MOTHER",
  "SON_DAUGHTER",
  "BROTHER_SISTER",
  "RELATIVE",
  "OTHER",
] as const;

const addressSchema = z.object({
  fullText: z.string().trim().min(1, "Permanent address is required"),
  district: z.string().trim().min(1, "Permanent district is required"),
  dsDivision: z.string().trim().min(1, "Permanent DS division is required"),
  gnDivision: z.string().trim().min(1, "Permanent GN division is required"),
});

const deceasedSchema = z
  .object({
    identificationStatus: z.enum(IDENTIFICATION_STATUSES),
    nic: z.string().trim().nullable().optional(),
    passportCountry: z.string().trim().nullable().optional(),
    passportNumber: z.string().trim().nullable().optional(),
    fullNameOfficialLanguage: z.string().trim().nullable().optional(),
    fullNameEnglish: z.string().trim().min(1, "English full name is required"),
    dateOfBirth: z.string().trim().nullable().optional(),
    ageYears: z.number().int().min(0).nullable().optional(),
    ageMonths: z.number().int().min(0).max(11).nullable().optional(),
    ageDays: z.number().int().min(0).max(31).nullable().optional(),
    nationality: z.string().trim().min(1, "Nationality is required"),
    gender: z.enum(GENDERS),
    race: z.string().trim().nullable().optional(),
    permanentAddress: addressSchema,
    profession: z.string().trim().nullable().optional(),
    pensionStatus: z.boolean().nullable().optional(),
    fatherNic: z.string().trim().nullable().optional(),
    fatherName: z.string().trim().nullable().optional(),
    motherNic: z.string().trim().nullable().optional(),
    motherName: z.string().trim().nullable().optional(),
  })
  .superRefine((deceased, ctx) => {
    if (!deceased.dateOfBirth && deceased.ageYears == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ageYears"],
        message: "Age in years is required when date of birth is missing",
      });
    }

    if (deceased.identificationStatus === "IDENTIFIED_SRI_LANKAN" && !deceased.nic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nic"],
        message: "NIC is required for identified Sri Lankan deceased",
      });
    }

    if (
      deceased.identificationStatus === "IDENTIFIED_FOREIGNER" &&
      (!deceased.passportCountry || !deceased.passportNumber)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passportNumber"],
        message: "Passport country and number are required for identified foreign deceased",
      });
    }
  });

const deathSchema = z.object({
  date: z.string().trim().min(1, "Date of death is required"),
  time: z.string().trim().nullable().optional(),
  occurredInHospital: z.literal(false),
  placeOfficialLanguage: z.string().trim().nullable().optional(),
  placeEnglish: z.string().trim().min(1, "Place of death in English is required"),
  placeDistrict: z.string().trim().min(1, "Place of death district is required"),
  placeDsDivision: z.string().trim().min(1, "Place of death DS division is required"),
  registrationDivision: z.string().trim().min(1, "Registration division is required"),
  causeKnownByFamily: z.boolean().nullable().optional(),
  familyNarrative: z.string().trim().nullable().optional(),
  burialOrCremationPlace: z.string().trim().nullable().optional(),
});

const maternalSchema = z.object({
  wasPregnantAtDeath: z.boolean().nullable().optional(),
  gaveBirthWithin42Days: z.boolean().nullable().optional(),
  hadAbortion: z.boolean().nullable().optional(),
  daysSinceBirthOrAbortion: z.number().int().min(0).nullable().optional(),
});

const informantSchema = z
  .object({
    capacity: z.enum(INFORMANT_CAPACITIES),
    otherCapacityText: z.string().trim().nullable().optional(),
    nicOrPassport: z.string().trim().min(1, "Informant NIC or passport is required"),
    fullName: z.string().trim().min(1, "Informant full name is required"),
    postalAddress: z.string().trim().min(1, "Informant postal address is required"),
    mobile: z.string().trim().min(1, "Informant mobile number is required"),
    landline: z.string().trim().nullable().optional(),
    email: z.string().trim().email("Invalid email address").nullable().optional().or(z.literal("")),
  })
  .superRefine((informant, ctx) => {
    if (informant.capacity === "OTHER" && !informant.otherCapacityText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherCapacityText"],
        message: "Please describe the informant's relationship",
      });
    }
  });

export const canonicalFamilyReportSchema = z
  .object({
    workflowScenario: z.enum(WORKFLOW_SCENARIOS),
    sectorCode: z.string().trim().min(1, "Sector code is required"),
    doctorId: z.string().trim().nullable().optional(),
    declarationConfirmed: z.boolean().refine((value) => value, {
      message: "Declaration must be confirmed",
    }),
    deceased: deceasedSchema,
    death: deathSchema,
    maternal: maternalSchema,
    informant: informantSchema,
  })
  .superRefine((report, ctx) => {
    if (report.deceased.dateOfBirth && report.death.date) {
      const dob = new Date(report.deceased.dateOfBirth);
      const dod = new Date(report.death.date);
      if (dod < dob) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["death", "date"],
          message: "Date of death cannot be before date of birth",
        });
      }
    }
  });

export type CanonicalFamilyReport = z.infer<typeof canonicalFamilyReportSchema>;

export function computeAgeAtDeath(dateOfBirth?: string | null, dateOfDeath?: string | null) {
  if (!dateOfBirth || !dateOfDeath) return null;
  const dob = new Date(dateOfBirth);
  const dod = new Date(dateOfDeath);
  let years = dod.getFullYear() - dob.getFullYear();
  let months = dod.getMonth() - dob.getMonth();
  let days = dod.getDate() - dob.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(dod.getFullYear(), dod.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function createInitialFamilyReport(): CanonicalFamilyReport {
  return {
    workflowScenario: "NATURAL_DEATH_HOME",
    sectorCode: "KANDY-01",
    doctorId: null,
    declarationConfirmed: false,
    deceased: {
      identificationStatus: "IDENTIFIED_SRI_LANKAN",
      nic: "",
      passportCountry: "",
      passportNumber: "",
      fullNameOfficialLanguage: "",
      fullNameEnglish: "",
      dateOfBirth: "",
      ageYears: null,
      ageMonths: null,
      ageDays: null,
      nationality: "Sri Lankan",
      gender: "MALE",
      race: "",
      permanentAddress: {
        fullText: "",
        district: "",
        dsDivision: "",
        gnDivision: "",
      },
      profession: "",
      pensionStatus: null,
      fatherNic: "",
      fatherName: "",
      motherNic: "",
      motherName: "",
    },
    death: {
      date: "",
      time: "",
      occurredInHospital: false,
      placeOfficialLanguage: "",
      placeEnglish: "",
      placeDistrict: "",
      placeDsDivision: "",
      registrationDivision: "",
      causeKnownByFamily: null,
      familyNarrative: "",
      burialOrCremationPlace: "",
    },
    maternal: {
      wasPregnantAtDeath: null,
      gaveBirthWithin42Days: null,
      hadAbortion: null,
      daysSinceBirthOrAbortion: null,
    },
    informant: {
      capacity: "SON_DAUGHTER",
      otherCapacityText: "",
      nicOrPassport: "",
      fullName: "",
      postalAddress: "",
      mobile: "",
      landline: "",
      email: "",
    },
  };
}
