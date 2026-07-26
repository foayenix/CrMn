import { createECDH, createHmac, createCipheriv, randomBytes } from "crypto";
import { SignJWT, importJWK } from "jose";

// Web Push, implemented against RFC 8291 (message encryption), RFC 8188
// (aes128gcm content coding) and RFC 8292 (VAPID) using Node's crypto and the
// `jose` this repo already has.
//
// No new dependency: the repo's independence is the point, and a push library
// would be a third-party package sitting on the path between the boss and the
// only alert this app ever sends.
//
// Everything here is for the *boss*, on the admin side. The staff app has no
// push, no badges and no counts — that rule is absolute and lives elsewhere.

const KEY_LENGTH = 16;
const NONCE_LENGTH = 12;
const RECORD_SIZE = 4096;
const AUTH_TAG_LENGTH = 16;

export type PushKeys = { publicKey: string; privateKey: string; subject: string };

export function vapidKeys(): PushKeys | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return {
    publicKey,
    privateKey,
    // RFC 8292 wants a contact for the push service operator.
    subject: process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
  };
}

export function isPushConfigured(): boolean {
  return vapidKeys() !== null;
}

const b64url = (b: Buffer) => b.toString("base64url");
const fromB64url = (s: string) => Buffer.from(s, "base64url");

function hmac(key: Buffer, data: Buffer): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

// HKDF, with the single-block expand this protocol always uses (every output
// here is 32 bytes or fewer).
function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number): Buffer {
  const prk = hmac(salt, ikm);
  return hmac(prk, Buffer.concat([info, Buffer.from([1])])).subarray(0, length);
}

export type Subscription = { endpoint: string; p256dh: string; auth: string };

// RFC 8291 §3.4 — encrypt a payload for one subscription.
export function encryptPayload(
  subscription: Subscription,
  payload: string,
): Buffer {
  const uaPublic = fromB64url(subscription.p256dh);
  const authSecret = fromB64url(subscription.auth);
  if (uaPublic.length !== 65) throw new Error("p256dh must be 65 bytes");
  if (authSecret.length < 16) throw new Error("auth must be at least 16 bytes");

  // A fresh application-server keypair per message.
  const ecdh = createECDH("prime256v1");
  const asPublic = ecdh.generateKeys();
  const sharedSecret = ecdh.computeSecret(uaPublic);

  // The shared secret is stretched with the auth secret and both public keys,
  // so a message can only be read by the subscription it was sealed for.
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0", "ascii"),
    uaPublic,
    asPublic,
  ]);
  const ikm = hkdf(authSecret, sharedSecret, keyInfo, 32);

  const salt = randomBytes(KEY_LENGTH);
  const cek = hkdf(salt, ikm, Buffer.from("Content-Encoding: aes128gcm\0", "ascii"), KEY_LENGTH);
  const nonce = hkdf(salt, ikm, Buffer.from("Content-Encoding: nonce\0", "ascii"), NONCE_LENGTH);

  // One record, so the padding delimiter is 0x02 ("last record").
  const plaintext = Buffer.concat([Buffer.from(payload, "utf8"), Buffer.from([2])]);
  if (plaintext.length + AUTH_TAG_LENGTH > RECORD_SIZE) {
    throw new Error("Push payload too long for a single record");
  }

  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const body = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  // RFC 8188 §2 header: salt | record size | key id length | key id.
  const header = Buffer.alloc(KEY_LENGTH + 4 + 1);
  salt.copy(header, 0);
  header.writeUInt32BE(RECORD_SIZE, KEY_LENGTH);
  header.writeUInt8(asPublic.length, KEY_LENGTH + 4);

  return Buffer.concat([header, asPublic, body]);
}

// RFC 8292 — a short-lived signed token proving the sender is us.
async function vapidHeader(endpoint: string, keys: PushKeys): Promise<string> {
  const audience = new URL(endpoint).origin;
  const publicKey = fromB64url(keys.publicKey);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: b64url(publicKey.subarray(1, 33)),
    y: b64url(publicKey.subarray(33, 65)),
    d: keys.privateKey,
  };
  const privateKey = await importJWK(jwk, "ES256");

  const token = await new SignJWT({ sub: keys.subject })
    .setProtectedHeader({ typ: "JWT", alg: "ES256" })
    .setAudience(audience)
    .setIssuedAt()
    // Twelve hours: well inside the 24-hour ceiling push services enforce.
    .setExpirationTime("12h")
    .sign(privateKey);

  return `vapid t=${token}, k=${keys.publicKey}`;
}

export type SendResult =
  | { ok: true }
  | { ok: false; gone: true }
  | { ok: false; gone: false; error: string };

// A push service that accepts the connection and then never answers is worse
// than one that's plainly down: without this, `fetch` waits five minutes.
const REQUEST_TIMEOUT_MS = 10_000;

// Deliver one notification. Never throws and never hangs: a push service having
// a bad night must not take down the thing that triggered it.
export async function sendPush(
  subscription: Subscription,
  payload: string,
  ttlSeconds = 60 * 60 * 12,
): Promise<SendResult> {
  const keys = vapidKeys();
  if (!keys) return { ok: false, gone: false, error: "Push isn't configured" };

  try {
    const body = encryptPayload(subscription, payload);
    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: await vapidHeader(subscription.endpoint, keys),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: String(ttlSeconds),
      },
      body: new Uint8Array(body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    // The subscription has been revoked or expired — stop sending to it.
    if (res.status === 404 || res.status === 410) return { ok: false, gone: true };
    if (!res.ok) {
      return { ok: false, gone: false, error: `Push service returned ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      gone: false,
      error: e instanceof Error ? e.message : "Could not reach the push service",
    };
  }
}
