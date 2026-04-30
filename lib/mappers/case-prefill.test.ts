import { describe, expect, it } from "vitest";
import { familyReportToB24 } from "./familyReportToB24";
import { familyReportToCr2 } from "./familyReportToCr2";
import type { CanonicalFamilyReport } from "../death-report-schema";

function sampleReport(overrides?: Partial<CanonicalFamilyReport>): CanonicalFamilyReport {
  return {
    workflowScenario: "NATURAL_DEATH_HOME",
    sectorCode: "KANDY-01",
    doctorId: null,
    declarationConfirmed: true,
    deceased: {
      identificationStatus: "IDENTIFIED_SRI_LANKAN",
      nic: "550123456V",
      passportCountry: null,
      passportNumber: null,
      fullNameOfficialLanguage: "සුනිල් පෙරේරා",
      fullNameEnglish: "Sunil Perera",
      dateOfBirth: "1950-02-14",
      ageYears: null,
      ageMonths: null,
      ageDays: null,
      nationality: "Sri Lankan",
      gender: "MALE",
      race: "Sinhalese",
      permanentAddress: {
        fullText: "14 Permanent Home, Kandy",
        district: "Kandy",
        dsDivision: "Gangawata Korale",
        gnDivision: "Kandy Central",
      },
      profession: "Retired Teacher",
      pensionStatus: true,
      fatherNic: null,
      fatherName: null,
      motherNic: null,
      motherName: null,
    },
    death: {
      date: "2026-04-20",
      time: "10:15",
      occurredInHospital: false,
      placeOfficialLanguage: "තලාවල පාර, මහනුවර",
      placeEnglish: "22 Lake Road, Kandy",
      placeDistrict: "Kandy",
      placeDsDivision: "Gangawata Korale",
      registrationDivision: "Kandy Registration Division",
      causeKnownByFamily: true,
      familyNarrative: "Family-reported stroke",
      burialOrCremationPlace: "Kandy Crematorium",
    },
    maternal: {
      wasPregnantAtDeath: null,
      gaveBirthWithin42Days: null,
      hadAbortion: null,
      daysSinceBirthOrAbortion: null,
    },
    informant: {
      capacity: "SON_DAUGHTER",
      otherCapacityText: null,
      nicOrPassport: "900123456V",
      fullName: "Anula Perera",
      postalAddress: "88 Informant Avenue, Kandy",
      mobile: "0771234567",
      landline: null,
      email: "anula@example.com",
    },
    ...overrides,
  };
}

describe("prefill mappers", () => {
  it("computes age from date of birth for CR-2 and B-24", () => {
    const report = sampleReport();

    const cr2 = familyReportToCr2(report);
    const b24 = familyReportToB24(report);

    expect(cr2.ageYears).toBe("76");
    expect(cr2.ageMonths).toBe("2");
    expect(cr2.ageDays).toBe("6");
    expect(b24.b24Age).toBe("76y 2m 6d");
  });

  it("branches identity fields for foreign and unidentified deceased", () => {
    const foreignReport = sampleReport({
      deceased: {
        ...sampleReport().deceased,
        identificationStatus: "IDENTIFIED_FOREIGNER",
        nic: null,
        passportCountry: "United Kingdom",
        passportNumber: "P1234567",
      },
    });

    const unidentifiedReport = sampleReport({
      deceased: {
        ...sampleReport().deceased,
        identificationStatus: "NOT_IDENTIFIED",
        nic: null,
        passportCountry: null,
        passportNumber: null,
      },
    });

    const foreignCr2 = familyReportToCr2(foreignReport);
    const unidentifiedCr2 = familyReportToCr2(unidentifiedReport);

    expect(foreignCr2.identificationStatus).toBe("identified");
    expect(foreignCr2.deceasedNic).toBe("");
    expect(foreignCr2.foreignerCountry).toBe("United Kingdom");
    expect(foreignCr2.foreignerPassport).toBe("P1234567");

    expect(unidentifiedCr2.identificationStatus).toBe("not_identified");
    expect(unidentifiedCr2.deceasedNic).toBe("");
    expect(unidentifiedCr2.foreignerCountry).toBe("");
  });
});
