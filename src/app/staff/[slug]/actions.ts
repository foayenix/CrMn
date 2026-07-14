"use server";

import { getStaffSlug, verifyStaffPin } from "@/lib/settings";
import { createStaffSession } from "@/lib/session";
import { redirect } from "next/navigation";

export type StaffPinState = { error?: string };

// Verify the shared PIN for a given slug; on success set the staff cookie and
// reload the staff page (which then renders the rota/bookings content).
export async function verifyPinAction(
  _prev: StaffPinState,
  formData: FormData,
): Promise<StaffPinState> {
  const slug = String(formData.get("slug") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();

  const realSlug = await getStaffSlug();
  if (!realSlug || slug !== realSlug) {
    return { error: "This link is no longer valid." };
  }
  if (!(await verifyStaffPin(pin))) {
    return { error: "Incorrect PIN." };
  }
  await createStaffSession();
  redirect(`/staff/${slug}`);
}
