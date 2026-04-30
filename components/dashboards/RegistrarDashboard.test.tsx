import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrarDashboard } from "./RegistrarDashboard";

const { toast, getMyCases, getCaseDetail, issueCr2 } = vi.hoisted(() => ({
  toast: vi.fn(),
  getMyCases: vi.fn(),
  getCaseDetail: vi.fn(),
  issueCr2: vi.fn(),
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
  issueCr2,
}));

vi.mock("../death-declaration-CR02/death-declaration-form", () => ({
  DeathDeclarationForm: ({ initialData }: { initialData: Record<string, string> }) => (
    <pre data-testid="cr2-prefill">{JSON.stringify(initialData, null, 2)}</pre>
  ),
}));

describe("RegistrarDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyCases.mockResolvedValue({
      content: [
        {
          caseId: 201,
          status: "PENDING_REGISTRAR_REVIEW",
          deceasedFullName: "Sunil Perera",
          deceasedNic: "550123456V",
          applicantFullName: "Anula Perera",
          causeOfDeath: "Myocardial infarction",
        },
      ],
    });
    getCaseDetail.mockResolvedValue({
      caseId: 201,
      cr2Prefill: {
        permAddressFullText: "14 Permanent Home, Kandy",
        placeInEnglish: "22 Lake Road, Kandy",
        informantAddress: "88 Informant Avenue, Kandy",
        causeOfDeath: "Myocardial infarction",
      },
    });
  });

  it("renders the mapped CR-2 prefill from backend values", async () => {
    const user = userEvent.setup();
    render(<RegistrarDashboard />);

    await waitFor(() => expect(getMyCases).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Review and Issue CR-2" }));
    await waitFor(() => expect(getCaseDetail).toHaveBeenCalledWith(201, "token"));

    const prefill = await screen.findByTestId("cr2-prefill");
    expect(prefill.textContent).toContain("14 Permanent Home, Kandy");
    expect(prefill.textContent).toContain("22 Lake Road, Kandy");
    expect(prefill.textContent).toContain("88 Informant Avenue, Kandy");
    expect(prefill.textContent).toContain("Myocardial infarction");
  });
});
