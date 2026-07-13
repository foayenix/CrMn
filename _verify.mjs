import { chromium } from "playwright";
const S = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();

// login
await p.goto("http://localhost:3000/admin/login");
await p.fill('input[name="email"]', "boss@crescentmoonbar.co.uk");
await p.fill('input[name="password"]', "changeme123");
await p.click('button[type="submit"]');
await p.waitForLoadState("networkidle");

// go to whats-on
await p.goto("http://localhost:3000/admin/whats-on", { waitUntil: "networkidle" });
await p.click('button:has-text("Add entry")');
await p.fill('input[name="schedule"]', "Thursdays");
await p.fill('input[name="title"]', "Vinyl & Vermouth");
await p.fill('textarea[name="description"]', "DJ sets and a short vermouth list.");
await p.click('button:has-text("Save entry")');
await p.waitForTimeout(1200);
const listed = await p.locator('text=Vinyl & Vermouth').count();
console.log("entry listed in admin:", listed > 0);
await p.screenshot({ path: S + "/whatson-admin.png", fullPage: true });

// public homepage should now show it (live, no redeploy)
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
const onSite = await p.locator('text=Vinyl & Vermouth').count();
console.log("entry visible on public homepage:", onSite > 0);

// reorder: move it up once, then hide it, confirm it disappears from public
await p.goto("http://localhost:3000/admin/whats-on", { waitUntil: "networkidle" });
// hide the new entry
const card = p.locator('.card', { hasText: 'Vinyl & Vermouth' });
await card.locator('button:has-text("Hide")').click();
await p.waitForTimeout(1000);
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
const hiddenOnSite = await p.locator('text=Vinyl & Vermouth').count();
console.log("after Hide, visible on public homepage:", hiddenOnSite > 0, "(should be false)");

// cleanup: delete it
await p.goto("http://localhost:3000/admin/whats-on", { waitUntil: "networkidle" });
p.on("dialog", (d) => d.accept());
const card2 = p.locator('.card', { hasText: 'Vinyl & Vermouth' });
await card2.locator('button:has-text("Delete")').click();
await p.waitForTimeout(1000);
const afterDel = await p.locator('text=Vinyl & Vermouth').count();
console.log("after Delete, present in admin:", afterDel > 0, "(should be false)");

await b.close();
