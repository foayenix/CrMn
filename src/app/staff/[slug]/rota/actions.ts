"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, parseDateKey } from "@/lib/dates";
import { WEEKDAYS, describeUnavailability } from "@/lib/availability";
import { notifySwapNeedsApproval, notifyUnavailable } from "@/lib/notify";
import { LIVE_STATUSES, firstSwappableDate, shiftLine } from "@/lib/swaps";
import { requireStaff } from "../access";

// "Can't work" and shift swaps, signed by whoever's PIN is in.
//
// Every action re-checks ownership and timing on the server: the screens only
// offer what's allowed, but two people can tap at once and a phone can sit on
// a stale page overnight.

// A date range longer than this is a leaving date, not a day off.
const MAX_RANGE_DAYS = 62;

function back(slug: string, screen: "cant-work" | "swaps", msg?: string): never {
  revalidatePath(`/staff/${slug}/rota/${screen}`);
  revalidatePath(`/staff/${slug}/rota`);
  revalidatePath(`/staff/${slug}`);
  revalidatePath("/admin", "layout");
  redirect(`/staff/${slug}/rota/${screen}${msg ? `?m=${msg}` : ""}`);
}

function isDateKey(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

// ---- can't work ------------------------------------------------------------

export async function addUnavailabilityAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);
  const mode = String(formData.get("mode") ?? "dates") === "weekly" ? "WEEKLY" : "DATES";
  const note = String(formData.get("note") ?? "").trim().slice(0, 140) || null;

  if (mode === "WEEKLY") {
    const days = formData
      .getAll("weekday")
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    if (days.length === 0) back(slug, "cant-work", "pick-day");

    const existing = await prisma.unavailability.findMany({
      where: { staffMemberId: me.id, kind: "WEEKLY", weekday: { in: days } },
      select: { weekday: true },
    });
    const fresh = days.filter((d) => !existing.some((e) => e.weekday === d));
    if (fresh.length) {
      await prisma.unavailability.createMany({
        data: fresh.map((weekday) => ({ staffMemberId: me.id, kind: "WEEKLY" as const, weekday, note })),
      });
      notifyUnavailable({
        by: me.name,
        when: fresh.map((d) => `every ${WEEKDAYS[d]}`).join(", "),
        note,
      });
    }
    back(slug, "cant-work", "saved");
  }

  const fromKey = String(formData.get("from") ?? "");
  const toKey = String(formData.get("to") ?? "") || fromKey;
  if (!isDateKey(fromKey) || !isDateKey(toKey)) back(slug, "cant-work", "pick-date");
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (from < firstSwappableDate()) back(slug, "cant-work", "past");
  if (to < from) back(slug, "cant-work", "backwards");
  if (to > addDays(from, MAX_RANGE_DAYS)) back(slug, "cant-work", "too-long");

  const row = await prisma.unavailability.create({
    data: { staffMemberId: me.id, kind: "DATES", startDate: from, endDate: to, note },
  });
  notifyUnavailable({ by: me.name, when: describeUnavailability(row), note });
  back(slug, "cant-work", "saved");
}

export async function removeUnavailabilityAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);
  const id = String(formData.get("id") ?? "");
  // deleteMany so someone else's id simply matches nothing.
  await prisma.unavailability.deleteMany({ where: { id, staffMemberId: me.id } });
  back(slug, "cant-work");
}

// ---- swaps -----------------------------------------------------------------

export async function offerShiftAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);
  const shiftId = String(formData.get("shiftId") ?? "");

  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, staffMemberId: me.id, kind: "WORKING", date: { gte: firstSwappableDate() } },
  });
  if (!shift) back(slug, "swaps", "gone");

  const live = await prisma.shiftSwap.findFirst({
    where: { status: { in: [...LIVE_STATUSES] }, OR: [{ shiftId }, { returnShiftId: shiftId }] },
  });
  if (!live) {
    await prisma.shiftSwap.create({ data: { shiftId, fromId: me.id } });
  }
  back(slug, "swaps", "offered");
}

// Withdraw your offer, whether or not anyone has taken it yet.
export async function cancelOfferAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);
  const id = String(formData.get("id") ?? "");
  await prisma.shiftSwap.updateMany({
    where: { id, fromId: me.id, status: { in: [...LIVE_STATUSES] } },
    data: { status: "CANCELLED" },
  });
  back(slug, "swaps");
}

export async function takeShiftAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);
  const id = String(formData.get("id") ?? "");
  const returnShiftId = String(formData.get("returnShiftId") ?? "") || null;

  const swap = await prisma.shiftSwap.findFirst({
    where: { id, status: "OFFERED", fromId: { not: me.id }, shift: { date: { gte: firstSwappableDate() } } },
    include: { shift: true, from: { select: { name: true } } },
  });
  if (!swap) back(slug, "swaps", "gone");

  let returnShift = null;
  if (returnShiftId) {
    returnShift = await prisma.shift.findFirst({
      where: { id: returnShiftId, staffMemberId: me.id, kind: "WORKING", date: { gte: firstSwappableDate() } },
    });
    const tied = await prisma.shiftSwap.findFirst({
      where: {
        status: { in: [...LIVE_STATUSES] },
        OR: [{ shiftId: returnShiftId }, { returnShiftId }],
      },
    });
    if (!returnShift || tied) back(slug, "swaps", "return-gone");
  }

  // Conditional on still being OFFERED: if a colleague took it a moment ago,
  // this matches nothing and they keep it.
  const { count } = await prisma.shiftSwap.updateMany({
    where: { id, status: "OFFERED" },
    data: { status: "ACCEPTED", toId: me.id, returnShiftId, acceptedAt: new Date() },
  });
  if (count === 0) back(slug, "swaps", "gone");

  notifySwapNeedsApproval({
    from: swap!.from.name,
    to: me.name,
    shift: shiftLine(swap!.shift),
    returnShift: returnShift ? shiftLine(returnShift) : null,
  });
  back(slug, "swaps", "taken");
}

// Changed your mind before the boss decided: the shift goes back up for grabs.
export async function releaseShiftAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);
  const id = String(formData.get("id") ?? "");
  await prisma.shiftSwap.updateMany({
    where: { id, toId: me.id, status: "ACCEPTED" },
    data: { status: "OFFERED", toId: null, returnShiftId: null, acceptedAt: null },
  });
  back(slug, "swaps");
}
