import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GNDashboard } from "./GNDashboard";

const { toast, getMyCases, getCaseDetail, gnAction, issueB24, buildIssueB24Payload } = vi.hoisted(() => ({
  toast: vi.fn(),
  getMyCases: vi.fn(),
  getCaseDetail: vi.fn(),
  gnAction: vi.fn(),
  issueB24: vi.fn(),
  buildIssueB24Payload: vi.fn(() => ({ built: true })),
}));

vi.mock("../../contexts/auth-context", () => ({
  useAuth: () => ({ token: "token" }),
}));

vi.mock("../../hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

vi.mock("../../lib/api", () => ({
  getMyCases,
  getCaseDetail,
  gnAction,
  issueB24,
  buildIssueB24Payload,
}));

vi.mock("../ui/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../B24-report/b24-form", () => ({
  B24Form: ({ onVerificationSubmit }: { onVerificationSubmit: (data: Record<string, string>) => Promise<void> }) => (
    <button
      onClick={() =>
        onVerificationSubmit({
          b24GramaDivision: "Kandy Central",
          b24RegistrarDivision: "Kandy Registration Division",
          b24DeathYear: "2026",
          b24DeathMonth: "4",
          b24DeathDay: "20",
          b24PlaceOfDeath: "22 Lake Road, Kandy",
          b24FullName: "Sunil Perera",
          b24Sex: "male",
          b24Age: "76y 2m 6d",
          b24CauseOfDeath: "Myocardial infarction",
          b24InformantName: "Anula Perera",
          b24InformantAddress: "88 Informant Avenue, Kandy",
          b24SignDate: "2026-04-21",
          b24GNSignature: "GN Officer",
          b24Confirmed: "true",
        })
      }
    >
      Submit Mock B24
    </button>
  ),
}));

describe("GNDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyCases.mockResolvedValue({
      content: [
        {
          caseId: 101,
          status: "PENDING_GN_REVIEW",
          deceasedFullName: "Sunil Perera",
          deceasedNic: "550123456V",
          applicantFullName: "Anula Perera",
          causeOfDeath: "Myocardial infarction",
          b12Icd10Code: "I21.9",
          b12DoctorName: "Doctor Officer",
          b12DoctorId: "DOC-123456",
        },
      ],
    });
    getCaseDetail.mockResolvedValue({
      caseId: 101,
      b24Prefill: {
        b24FullName: "Sunil Perera",
      },
    });
    issueB24.mockResolvedValue({});
  });

  it("submits B-24 through the case workflow endpoint", async () => {
    const user = userEvent.setup();
    render(<GNDashboard />);

    await waitFor(() => expect(getMyCases).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Open B-24" }));
    await waitFor(() => expect(getCaseDetail).toHaveBeenCalledWith(101, "token"));

    await user.click(screen.getByRole("button", { name: "Submit Mock B24" }));

    expect(buildIssueB24Payload).toHaveBeenCalled();
    expect(issueB24).toHaveBeenCalledWith(101, { built: true }, "token");
  });
});
