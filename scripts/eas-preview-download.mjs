#!/usr/bin/env node
/**
 * EAS Preview Build + Download
 *
 * Usage:
 *   EXPO_TOKEN=<your-token> node scripts/eas-preview-download.mjs [ios|android]
 *
 * Get your token at: https://expo.dev/accounts/[account]/settings/access-tokens
 * Or log in first: npx eas-cli login
 */

import { execSync, spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";

const platform = process.argv[2] || "android";
if (!["ios", "android"].includes(platform)) {
	console.error("Usage: node scripts/eas-preview-download.mjs [ios|android]");
	process.exit(1);
}

const PROJECT_ID = "bc0d8dba-6403-4495-a213-2222d6008812";
const token = process.env.EXPO_TOKEN;

// ── 1. Trigger the build ──────────────────────────────────────────────────────

console.log(`\nTriggering EAS preview build for ${platform}...\n`);

const buildCmd = [
	"npx",
	"eas-cli",
	"build",
	"--profile",
	"preview",
	"--platform",
	platform,
	"--non-interactive",
	"--json",
	"--no-wait",
];

if (token) buildCmd.splice(1, 0, "--yes"); // skip update prompts

let buildId;
try {
	const env = { ...process.env };
	const raw = execSync(buildCmd.join(" "), { env, encoding: "utf8" });
	// eas build --json outputs one JSON object (or array) to stdout
	const parsed = JSON.parse(raw.trim());
	const build = Array.isArray(parsed) ? parsed[0] : parsed;
	buildId = build.id;
	console.log(`Build queued: ${buildId}`);
	console.log(`Track progress: https://expo.dev/accounts/-/projects/Musea/builds/${buildId}\n`);
} catch (err) {
	console.error("Failed to queue build:", err.message);
	process.exit(1);
}

// ── 2. Poll until the build finishes ─────────────────────────────────────────

const headers = token
	? { Authorization: `Bearer ${token}` }
	: {};

async function getBuild(id) {
	const res = await fetch(`https://api.expo.dev/v2/builds/${id}`, { headers });
	if (!res.ok) throw new Error(`EAS API ${res.status}: ${await res.text()}`);
	return (await res.json()).data;
}

console.log("Waiting for build to finish (this can take 10-30 min)...");
const POLL_MS = 30_000;
let build;
while (true) {
	build = await getBuild(buildId);
	const { status } = build;
	process.stdout.write(`  status: ${status}\r`);
	if (status === "FINISHED") break;
	if (status === "ERRORED" || status === "CANCELED") {
		console.error(`\nBuild ${status.toLowerCase()}.`);
		process.exit(1);
	}
	await new Promise((r) => setTimeout(r, POLL_MS));
}

const downloadUrl = build.artifacts?.buildUrl;
if (!downloadUrl) {
	console.error("\nBuild finished but no download URL found.");
	process.exit(1);
}

// ── 3. Download the artifact ──────────────────────────────────────────────────

const ext = platform === "ios" ? "ipa" : "apk";
const outDir = join(process.cwd(), "builds");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `musea-preview-${platform}-${buildId.slice(0, 8)}.${ext}`);

console.log(`\nDownloading to ${outPath} ...`);
const dlRes = await fetch(downloadUrl);
if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);

await pipeline(dlRes.body, createWriteStream(outPath));
console.log(`\nDone!  ${outPath}`);
if (platform === "ios") {
	console.log("\nInstall via: xcrun simctl install booted <path>.ipa");
	console.log("Or distribute with: npx eas-cli device:create then share the URL");
}
