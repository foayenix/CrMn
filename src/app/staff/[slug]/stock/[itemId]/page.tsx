import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "../../access";
import { StaffShell } from "../../shell";
import { ReportForm } from "./report-form";

export const dynamic = "force-dynamic";

// One screen for both cases: a menu item picked from the list, or the free-text
// row for the off-menu things — tonic, till roll, blue roll.
export default async function ReportScreen({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const { device } = await requireStaff(slug);
  const isPad = device === "ipad";

  const item =
    itemId === "other"
      ? null
      : await prisma.stockItem.findFirst({ where: { id: itemId, active: true } });

  if (itemId !== "other" && !item) redirect(`/staff/${slug}/stock`);

  // Already flagged by someone else while this screen was on its way open.
  if (item) {
    const already = await prisma.stockReport.findFirst({
      where: { itemId: item.id, resolvedAt: null },
    });
    if (already) redirect(`/staff/${slug}/stock`);
  }

  const clock = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return (
    <StaffShell slug={slug} section="stock" isPad={isPad} title="Report">
      <ReportForm
        slug={slug}
        itemId={itemId}
        itemName={item?.name ?? null}
        category={item?.category ?? null}
        clock={clock}
      />
    </StaffShell>
  );
}
