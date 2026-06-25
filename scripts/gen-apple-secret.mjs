import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const KEY_ID = "724AYQ5SV7";
const TEAM_ID = "W66QMS7GXQ";
const CLIENT_ID = "com.ibo.musea.service";
const KEY_PATH = "C:\\Users\\ibo\\Downloads\\AuthKey_724AYQ5SV7.p8";

const privateKey = readFileSync(KEY_PATH, "utf8");
const now = Math.floor(Date.now() / 1000);

const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: KEY_ID })).toString("base64url");
const payload = Buffer.from(JSON.stringify({
  iss: TEAM_ID,
  iat: now,
  exp: now + 15777000, // ~6 months
  aud: "https://appleid.apple.com",
  sub: CLIENT_ID,
})).toString("base64url");

const signingInput = `${header}.${payload}`;
const sign = createSign("SHA256");
sign.update(signingInput);
const signature = sign.sign({ key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");

console.log(`\nYour APPLE_CLIENT_SECRET:\n\n${signingInput}.${signature}\n`);
