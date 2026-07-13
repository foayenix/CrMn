"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseDateKey, timeStringToMinutes } from "@/lib/dates";
import { ShiftKind } from "@prisma/client";

function revalidate() {
  revalidatePath("/admin/rota");
}

// ---- staff -----------------------------------------------------------------

export async function addStaff(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const max = await prisma.staffMember.aggregate({ _max: { sortOrder: true } });
  await prisma.staffMember.create({
    data: { name, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  revalidate();
}

export async function renameStaff(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (id && name) {
    await prisma.staffMember.update({ where: { id }, data: { name } });
    revalidate();
  }
}

// Deactivate (not delete) so past shifts stay as history.
export async function setStaffActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (id) {
    await prisma.staffMember.update({ where: { id }, data: { active } });
    revalidate();
  }
}

// ---- shifts ----------------------------------------------------------------

export type SaveShiftState = { error?: string; ok?: boolean };

// Create or update a single slot (staff × day × slot number).
export async function saveShift(
  _prev: SaveShiftState,
  formData: FormData,
): Promise<SaveShiftState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? ""); // existing shift id, or ""
  const staffMemberId = String(formData.get("staffMemberId") ?? "");
  const dateKey = String(formData.get("date") ?? "");
  const slot = Number(formData.get("slot") ?? 1) || 1;
  const kind = String(formData.get("kind") ?? "WORKING") as ShiftKind;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!staffMemberId || !dateKey) return { error: "Missing staff or date." };
  if (!(kind in ShiftKind)) return { error: "Invalid shift type." };

  const date = parseDateKey(dateKey);

  const data: {
    staffMemberId: string;
    date: Date;
    slot: number;
    kind: ShiftKind;
    notes: string | null;
    startMinutes: number | null;
    endMinutes: number | null;
    holidayEnd: Date | null;
  } = {
    staffMemberId,
    date,
    slot,
    kind,
    notes,
    startMinutes: null,
    endMinutes: null,
    holidayEnd: null,
  };

  if (kind === "WORKING") {
    const start = timeStringToMinutes(String(formData.get("start") ?? ""));
    const end = timeStringToMinutes(String(formData.get("end") ?? ""));
    if (start === null || end === null) {
      return { error: "Enter both a start and end time." };
    }
    data.startMinutes = start;
    data.endMinutes = end;
  }

  if (kind === "HOLIDAY") {
    const endKey = String(formData.get("holidayEnd") ?? "");
    data.holidayEnd = endKey ? parseDateKey(endKey) : null;
  }

  if (id) {
    await prisma.shift.update({ where: { id }, data });
  } else {
    await prisma.shift.create({ data });
  }
  revalidate();
  return { ok: true };
}

export async function deleteShift(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.shift.delete({ where: { id } });
    revalidate();
  }
}

// ---- day notes -------------------------------------------------------------

export async function saveDayNote(formData: FormData) {
  await requireAdmin();
  const dateKey = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!dateKey) return;
  const date = parseDateKey(dateKey);
  if (note) {
    await prisma.dayNote.upsert({
      where: { date },
      update: { note },
      create: { date, note },
    });
  } else {
    await prisma.dayNote.deleteMany({ where: { date } });
  }
  revalidate();
}
