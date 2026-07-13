import { prisma } from "@/lib/prisma";
import { WhatsOnManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function WhatsOnPage() {
  const entries = await prisma.whatsOnEntry.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="admin-h1">What&apos;s On</h1>
      <p className="admin-sub">
        These entries appear in the &ldquo;What&apos;s On&rdquo; section of the
        homepage. Changes go live immediately — no redeploy needed. Only{" "}
        <strong>active</strong> entries are shown to the public.
      </p>
      <WhatsOnManager
        entries={entries.map((e) => ({
          id: e.id,
          title: e.title,
          schedule: e.schedule,
          description: e.description,
          date: e.date ? e.date.toISOString().slice(0, 10) : "",
          active: e.active,
        }))}
      />
    </div>
  );
}
