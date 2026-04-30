import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FamilyDashboard } from "./FamilyDashboard";

const { toast, push, getMyCases, createCase, getCaseDetail, assignDoctor } = vi.hoisted(() => ({
  toast: vi.fn(),
  push: vi.fn(),
  getMyCases: vi.fn(),
  createCase: vi.fn(),
  getCaseDetail: vi.fn(),
  assignDoctor: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("../../contexts/auth-context", () => ({
  useAuth: () => ({ token: "token" }),
}));

vi.mock("../../hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

vi.mock("../../lib/api", () => ({
  getMyCases,
  createCase,
  getCaseDetail,
  assignDoctor,
}));

describe("FamilyDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyCases.mockResolvedValue({ content: [] });
  });

  it("blocks create-case submission when the canonical report is invalid", async () => {
    const user = userEvent.setup();
    render(<FamilyDashboard />);

    await waitFor(() => expect(getMyCases).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Report a Death" }));
    await user.click(screen.getByRole("button", { name: "Submit Report" }));

    expect(createCase).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Validation Error",
      }),
    );
  });
});
