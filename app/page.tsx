"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, ShieldCheck, Sparkles, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import { DeathDeclarationForm } from "../components/death-declaration-CR02/death-declaration-form";
import { B24Form } from "../components/B24-report/b24-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { NotificationBell } from "../components/NotificationBell";

import { FamilyDashboard } from "../components/dashboards/FamilyDashboard";
import { DoctorDashboard } from "../components/dashboards/DoctorDashboard";
import { GNDashboard } from "../components/dashboards/GNDashboard";
import { RegistrarDashboard } from "../components/dashboards/RegistrarDashboard";
import { CemeteryDashboard } from "../components/dashboards/CemeteryDashboard";

const ROLE_LABELS: Record<string, string> = {
  FAMILY: "Family",
  DOCTOR: "Doctor",
  GN: "Grama Niladhari",
  GRAMA_NILADHARI: "Grama Niladhari",
  REGISTRAR: "Registrar",
  CEMETERY: "Cemetery",
};

const ROLE_COPY: Record<string, { eyebrow: string; title: string; description: string }> = {
  FAMILY: {
    eyebrow: "Family Workspace",
    title: "Follow each aftercare step in a wider, calmer workspace.",
    description:
      "Create cases, track progress, and move through the registration journey with more room for forms, case history, and next actions.",
  },
  DOCTOR: {
    eyebrow: "Medical Review",
    title: "Review medical certifications with a cleaner, full-width layout.",
    description:
      "Pending certifications, case details, and decision controls now sit in a broader workspace that is easier to scan and act on.",
  },
  GN: {
    eyebrow: "GN Review Desk",
    title: "Process verifications and reports in a browser-fit review workspace.",
    description:
      "Switch between pending cases and B-24 preparation in a layout that gives your review tools and case context more breathing room.",
  },
  GRAMA_NILADHARI: {
    eyebrow: "GN Review Desk",
    title: "Process verifications and reports in a browser-fit review workspace.",
    description:
      "Switch between pending cases and B-24 preparation in a layout that gives your review tools and case context more breathing room.",
  },
  REGISTRAR: {
    eyebrow: "Registrar Console",
    title: "Finalize records with more space for review and issuance.",
    description:
      "Case handling, CR02 review, and final issuance now sit inside a fuller-screen shell designed for dense administrative work.",
  },
  CEMETERY: {
    eyebrow: "Cemetery Operations",
    title: "Manage burial coordination in a layout that stretches with the browser.",
    description:
      "Appointments, operational updates, and booking details now have a wider canvas that better matches day-to-day coordination work.",
  },
};

const TAB_LIST_CLASS =
  "mb-6 flex h-auto w-full flex-col gap-2 rounded-[1.25rem] bg-slate-100/90 p-2 sm:flex-row";
const TAB_TRIGGER_CLASS =
  "rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition data-[state=active]:border-slate-200/80 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_12px_24px_-18px_rgba(15,23,42,0.55)]";

export default function Page() {
  const { currentRole, setCurrentRole, currentUsername } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (currentRole === "GUEST") {
      router.push("/login");
    }
  }, [currentRole, router]);

  if (!isMounted || currentRole === "GUEST") return null;

  const handleLogout = () => {
    setCurrentRole("GUEST");
    router.push("/login");
  };

  const roleDisplayName = ROLE_LABELS[currentRole] ?? currentRole;
  const roleCopy = ROLE_COPY[currentRole] ?? {
    eyebrow: "Portal Workspace",
    title: "Use the portal in a layout that fits the full browser.",
    description:
      "Your workspace is stretched to use the available screen area while keeping actions and navigation easier to reach.",
  };

  const statusCards = [
    {
      label: "Signed In",
      value: currentUsername || "Authenticated session",
      note: "Your notifications and available workflows follow this account.",
      icon: <User className="h-5 w-5" />,
    },
    {
      label: "Current Role",
      value: roleDisplayName,
      note: "Role-specific tools are surfaced here without the previous narrow page cap.",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      label: "Workspace",
      value: "Full-browser fit",
      note: "Forms, case lists, and review steps now expand with the viewport.",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
  ];

  const renderRoleContent = () => {
    if (currentRole === "FAMILY") {
      return <FamilyDashboard />;
    }

    if (currentRole === "DOCTOR") {
      return <DoctorDashboard />;
    }

    if (currentRole === "GN" || currentRole === "GRAMA_NILADHARI") {
      return (
        <Tabs defaultValue="cases" className="w-full">
          <TabsList className={TAB_LIST_CLASS}>
            <TabsTrigger value="cases" className={TAB_TRIGGER_CLASS}>
              Pending Verifications (B-24 Phase)
            </TabsTrigger>
            <TabsTrigger value="standalone" className={TAB_TRIGGER_CLASS}>
              Create Standalone B-24 Report
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cases">
            <GNDashboard />
          </TabsContent>
          <TabsContent value="standalone">
            <B24Form />
          </TabsContent>
        </Tabs>
      );
    }

    if (currentRole === "REGISTRAR") {
      return (
        <Tabs defaultValue="cases" className="w-full">
          <TabsList className={TAB_LIST_CLASS}>
            <TabsTrigger value="cases" className={TAB_TRIGGER_CLASS}>
              Final Issuance (B-2 Phase)
            </TabsTrigger>
            <TabsTrigger value="standalone" className={TAB_TRIGGER_CLASS}>
              Standalone CR02 Review
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cases">
            <RegistrarDashboard />
          </TabsContent>
          <TabsContent value="standalone">
            <DeathDeclarationForm />
          </TabsContent>
        </Tabs>
      );
    }

    if (currentRole === "CEMETERY") {
      return <CemeteryDashboard />;
    }

    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
        <div className="max-w-lg space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Welcome to the portal</h2>
          <p className="text-sm leading-6 text-slate-600">
            There are no role-specific forms assigned to your account at the moment.
          </p>
        </div>
      </div>
    );
  };

  return (
    <main className="relative min-h-screen min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.85),_rgba(248,250,252,0.98)_42%,_rgba(224,231,255,0.78)_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-sky-200/55 blur-3xl" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-indigo-200/45 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen min-h-[100dvh] w-full flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:py-6 xl:px-10 2xl:px-12">
        <header className="rounded-[2rem] border border-slate-900/5 bg-slate-950 px-5 py-5 text-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.7)] sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">
                <Sparkles className="h-3.5 w-3.5" />
                {roleCopy.eyebrow}
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {roleCopy.title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  {roleCopy.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <div className="rounded-full bg-white/10 px-3 py-1.5 text-slate-100">
                  Signed in as{" "}
                  <span className="font-semibold text-white">
                    {currentUsername || "Portal user"}
                  </span>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1.5 text-slate-100">
                  Role <span className="font-semibold text-white">{roleDisplayName}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start xl:justify-end">
              <div className="rounded-2xl border border-white/10 bg-white/95 p-1 shadow-lg shadow-slate-950/20">
                <NotificationBell />
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {statusCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sky-100">
                  {card.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-2 text-base font-semibold text-white">{card.value}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{card.note}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                Workspace
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Role-specific tools, stretched for the full browser width.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                The main shell now scales with the browser instead of stopping at a narrow
                content column, giving dashboards and forms more room to breathe.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Session protected
            </div>
          </div>

          <div className="min-h-0 flex-1">{renderRoleContent()}</div>
        </section>
      </div>
    </main>
  );
}
