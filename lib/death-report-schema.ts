import { z } from "zod";

// --- Constants (Enums) ---
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

// --- Zod Schemas (Data Validation Layer) ---
const addressSchema = z.object({
  fullText: z.string().trim().min(1, "Permanent address is required"),
  district: z.string().trim().min(1, "Permanent district is required"),
  dsDivision: z.string().trim().min(1, "Permanent DS division is required"),
  gnDivision: z.string().trim().min(1, "Permanent GN division is required"),
});

const nicRegex = /^([0-9]{9}[vV]|[0-9]{12})$/;

const deceasedSchema = z
  .object({
    identificationStatus: z.enum(IDENTIFICATION_STATUSES, {
      errorMap: () => ({ message: "Identification status is required" }),
    }),
    nic: z.string().trim().regex(nicRegex, "Invalid NIC format (e.g. 123456789V or 12 digits)").nullable().optional().or(z.literal("")),
    fullNameEnglish: z.string().trim().min(1, "English full name is required"),
    dateOfBirth: z.string().trim().nullable().optional(),
    nationality: z.string().trim().min(1, "Nationality is required"),
    gender: z.enum(GENDERS, {
      errorMap: () => ({ message: "Gender is required" }),
    }),
    permanentAddress: addressSchema,
    // Other fields (lesser priority in order)
    fullNameOfficialLanguage: z.string().trim().nullable().optional(),
    passportCountry: z.string().trim().nullable().optional(),
    passportNumber: z.string().trim().nullable().optional(),
    ageYears: z.number().int().min(0).nullable().optional(),
    ageMonths: z.number().int().min(0).max(11).nullable().optional(),
    ageDays: z.number().int().min(0).max(31).nullable().optional(),
    race: z.string().trim().nullable().optional(),
    profession: z.string().trim().nullable().optional(),
    pensionStatus: z.boolean().nullable().optional(),
    fatherNic: z.string().trim().regex(nicRegex, "Invalid NIC format").nullable().optional().or(z.literal("")),
    fatherName: z.string().trim().nullable().optional(),
    motherNic: z.string().trim().regex(nicRegex, "Invalid NIC format").nullable().optional().or(z.literal("")),
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
  });

const deathSchema = z.object({
  date: z.string().trim().min(1, "Date of death is required"),
  placeEnglish: z.string().trim().min(1, "Place of death in English is required"),
  placeDistrict: z.string().trim().min(1, "Place of death district is required"),
  placeDsDivision: z.string().trim().min(1, "Place of death DS division is required"),
  registrationDivision: z.string().trim().min(1, "Registration division is required"),
  // Others
  time: z.string().trim().nullable().optional(),
  occurredInHospital: z.literal(false),
  placeOfficialLanguage: z.string().trim().nullable().optional(),
  causeKnownByFamily: z.boolean().nullable().optional(),
  familyNarrative: z.string().trim().nullable().optional(),
  burialOrCremationPlace: z.string().trim().nullable().optional(),
});

const informantSchema = z.object({
  capacity: z.enum(INFORMANT_CAPACITIES, {
    errorMap: () => ({ message: "Informant capacity is required" }),
  }),
  nicOrPassport: z.string().trim().min(1, "Informant NIC or passport is required"),
  fullName: z.string().trim().min(1, "Informant full name is required"),
  postalAddress: z.string().trim().min(1, "Informant postal address is required"),
  mobile: z
    .string()
    .trim()
    .regex(/^\+947\d{8}$/, "Mobile must be in format +947 followed by 8 digits (e.g. +947XXXXXXXX)"),
  // Others
  otherCapacityText: z.string().trim().nullable().optional(),
  landline: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Landline must be exactly 10 digits")
    .nullable()
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Invalid email address").nullable().optional().or(z.literal("")),
});

export const canonicalFamilyReportSchema = z.object({
  // USER ORDER: Declaration confirmed -> Deceased -> Death -> Informant
  declarationConfirmed: z.boolean().refine((value) => value, {
    message: "Declaration must be confirmed",
  }),
  deceased: deceasedSchema,
  death: deathSchema,
  informant: informantSchema,
  // System fields
  workflowScenario: z.enum(WORKFLOW_SCENARIOS),
  sectorCode: z.string().trim().min(1, "Sector code is required"),
  doctorId: z.string().trim().nullable().optional(),
  maternal: z.any().optional(),
}).superRefine((report, ctx) => {
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

// --- OOP Domain Layer ---

export class DeceasedModel {
  constructor(public data: z.infer<typeof deceasedSchema>) {}

  public calculateAgeAtDeath(dateOfDeath: string) {
    if (!this.data.dateOfBirth || !dateOfDeath) return null;
    const dob = new Date(this.data.dateOfBirth);
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

  public static createDefault() {
    return {
      identificationStatus: "IDENTIFIED_SRI_LANKAN" as const,
      nic: "",
      fullNameEnglish: "",
      nationality: "Sri Lankan",
      gender: "MALE" as const,
      permanentAddress: { fullText: "", district: "", dsDivision: "", gnDivision: "" },
    };
  }
}

export abstract class BaseReport {
  constructor(public sectorCode: string) {}
  public abstract validate(): { success: boolean; errors?: string[]; firstErrorPath?: string };
}

export class DeathReportModel extends BaseReport {
  public deceased: DeceasedModel;
  
  constructor(public reportData: CanonicalFamilyReport) {
    super(reportData.sectorCode);
    this.deceased = new DeceasedModel(reportData.deceased);
  }

  public validate() {
    const result = canonicalFamilyReportSchema.safeParse(this.reportData);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return {
        success: false,
        errors: result.error.issues.map(i => i.message),
        firstErrorPath: firstIssue.path.join(".")
      };
    }
    return { success: true };
  }

  public static fromData(data: CanonicalFamilyReport): DeathReportModel {
    return new DeathReportModel(data);
  }
}

// --- Compatibility Exports ---

export function formatZodError(error: any): string[] {
  if (!error || !error.issues) return [];
  return error.issues.map((issue: any) => {
    const path = issue.path && issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

export function computeAgeAtDeath(dateOfBirth?: string | null, dateOfDeath?: string | null) {
  const model = new DeceasedModel({ dateOfBirth } as any);
  return model.calculateAgeAtDeath(dateOfDeath || "");
}

export function createInitialFamilyReport(): CanonicalFamilyReport {
  return {
    declarationConfirmed: false,
    workflowScenario: "NATURAL_DEATH_HOME",
    sectorCode: "KANDY-01",
    doctorId: null,
    deceased: DeceasedModel.createDefault() as any,
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
    }
  } as any;
}
