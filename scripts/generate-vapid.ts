/**
 * Generate the VAPID keypair that identifies this app to push services.
 *
 *   npm run vapid
 *
 * Paste the output into .env (or Coolify's Environment tab). Generating a new
 * pair invalidates every existing subscription — the boss would have to turn
 * notifications on again on each device — so do it once and keep it.
 */
import { createECDH } from "crypto";

const ecdh = createECDH("prime256v1");
const publicKey = ecdh.generateKeys();
const privateKey = ecdh.getPrivateKey();

console.log(`
VAPID_PUBLIC_KEY="${publicKey.toString("base64url")}"
VAPID_PRIVATE_KEY="${privateKey.toString("base64url")}"
VAPID_SUBJECT="mailto:boss@crescentmoonbar.co.uk"
`);
