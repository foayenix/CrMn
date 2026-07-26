import { prisma } from "@/lib/prisma";
import { vapidKeys } from "@/lib/web-push";
import { SubscribeButton } from "./subscribe";
import { DeviceList } from "./devices";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const keys = vapidKeys();
  const devices = keys ? await prisma.pushSubscription.findMany({ orderBy: { createdAt: "asc" } }) : [];

  return (
    <div>
      <h1 className="admin-h1">Notifications</h1>
      <p className="admin-sub">
        A buzz on your phone when the floor flags something low, so you can
        order it before the delivery cut-off. This is yours alone —{" "}
        <strong>the staff app has no notifications at all</strong>, by design:
        nobody there is nagged, badged or counted at.
      </p>

      {!keys ? (
        <div className="card">
          <h2>Not set up yet</h2>
          <p style={{ fontSize: 13 }}>
            Push needs a signing keypair. Generate one and add it to the
            environment:
          </p>
          <code style={{ display: "block", padding: 12, background: "var(--sand)", fontSize: 13 }}>
            npm run vapid
          </code>
          <p className="muted" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.7 }}>
            Paste the three lines it prints into <code>.env</code> (or Coolify&apos;s
            Environment tab) and restart. Until then nothing is lost: the count
            beside <strong>Low stock</strong> in the sidebar is the same
            information, and it works everywhere.
          </p>
        </div>
      ) : (
        <>
          <div className="card">
            <h2>This device</h2>
            <SubscribeButton
              vapidPublicKey={keys.publicKey}
              subscribedEndpoints={devices.map((d) => d.endpoint)}
            />
          </div>

          <DeviceList
            devices={devices.map((d) => ({
              id: d.id,
              label: d.label ?? "A device",
              added: d.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              }),
              lastSent: d.lastSentAt
                ? d.lastSentAt.toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  })
                : null,
              host: new URL(d.endpoint).host,
            }))}
          />
        </>
      )}

      <div className="card">
        <h2>If notifications never work</h2>
        <p style={{ fontSize: 13, margin: 0, lineHeight: 1.8 }}>
          Nothing breaks. Every flagged item shows as a count beside{" "}
          <strong>Low stock</strong> in the sidebar and as a block on the
          dashboard, on every device, with no permissions and no set-up. Push is
          the convenience; the badge is the guarantee.
        </p>
      </div>
    </div>
  );
}
