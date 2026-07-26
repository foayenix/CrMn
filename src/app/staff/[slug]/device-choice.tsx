import { setDeviceAction } from "./actions";

// Asked once, before the first PIN of a new device, because the answer decides
// how long a session lives. A phone is personal and follows the OS lock; the
// bar iPad locks itself after two minutes, since nothing on it may assume the
// person holding it is the person who unlocked it.
//
// It's a question, not a guess: user agents can't tell a phone in a pocket from
// a phone in a stand behind the bar.
export function DeviceChoice({ slug }: { slug: string }) {
  return (
    <div className="staff-page" style={{ justifyContent: "center", gap: 26 }}>
      <div>
        <div className="staff-eyebrow">Set up&nbsp;·&nbsp;asked once</div>
        <h1 className="staff-serif" style={{ fontSize: 42, lineHeight: 1.05, margin: "10px 0 0" }}>
          Whose device is this?
        </h1>
        <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--dim)" }}>
          It only changes how long you stay unlocked. You can be asked again by
          a manager at any time.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <form action={setDeviceAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="device" value="phone" />
          <button type="submit" className="staff-button filled" style={{ height: 88, flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "'Cormorant', serif", fontSize: 26, letterSpacing: 0, textTransform: "none" }}>
              This is my phone
            </span>
            <span style={{ fontSize: 10.5, letterSpacing: ".26em" }}>Stays unlocked</span>
          </button>
        </form>

        <form action={setDeviceAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="device" value="ipad" />
          <button type="submit" className="staff-button" style={{ height: 88, flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "'Cormorant', serif", fontSize: 26, letterSpacing: 0, textTransform: "none" }}>
              This is the bar iPad
            </span>
            <span style={{ fontSize: 10.5, letterSpacing: ".26em" }}>Locks after 2 minutes</span>
          </button>
        </form>
      </div>
    </div>
  );
}
