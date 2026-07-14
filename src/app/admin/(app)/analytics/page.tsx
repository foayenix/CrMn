export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const shared = process.env.PLAUSIBLE_SHARED_LINK;
  const base = process.env.NEXT_PUBLIC_PLAUSIBLE_URL;
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <div>
      <h1 className="admin-h1">Analytics</h1>
      <p className="admin-sub">Website visitor stats from your self-hosted Plausible.</p>

      {shared ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <iframe
            title="Plausible analytics"
            src={shared + (shared.includes("?") ? "&" : "?") + "embed=true&theme=light"}
            loading="lazy"
            style={{ width: "100%", height: "1600px", border: "none" }}
          />
        </div>
      ) : (
        <div className="card">
          <h2>Not connected yet</h2>
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>
            Once Plausible is deployed to Coolify:
          </p>
          <ol style={{ fontSize: 13, lineHeight: 1.9 }}>
            <li>Add the site <code>{domain || "your-domain"}</code> in Plausible.</li>
            <li>In Plausible → Site Settings → Visibility, create a <strong>shared link</strong>.</li>
            <li>Set <code>PLAUSIBLE_SHARED_LINK</code> to that URL and{" "}
              <code>NEXT_PUBLIC_PLAUSIBLE_URL</code> to your Plausible origin{base ? "" : " (e.g. https://plausible.crescentmoonbar.co.uk)"}.</li>
          </ol>
          <p style={{ fontSize: 13 }}>
            The tracking script is added to the public site automatically once{" "}
            <code>NEXT_PUBLIC_PLAUSIBLE_URL</code> is set.
          </p>
        </div>
      )}
    </div>
  );
}
