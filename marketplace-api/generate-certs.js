#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const CERT_DIR = path.join(__dirname, "certs");
const CERT_FILE = path.join(CERT_DIR, "cert.pem");
const KEY_FILE = path.join(CERT_DIR, "key.pem");

// Ensure certs directory exists
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

// Check if certificates already exist
if (fs.existsSync(CERT_FILE) && fs.existsSync(KEY_FILE)) {
  console.log("✅ SSL certificates already exist at:");
  console.log(`   - ${CERT_FILE}`);
  console.log(`   - ${KEY_FILE}`);
  process.exit(0);
}

// Generate self-signed certificate using OpenSSL
console.log("🔐 Generating self-signed SSL certificate...");
console.log("   This certificate is for development only.");
console.log("");

const command = `openssl req -x509 -newkey rsa:2048 -keyout "${KEY_FILE}" -out "${CERT_FILE}" -days 365 -nodes -subj "/CN=localhost/O=Fresh Republic/C=US"`;

console.log("Running: openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes");

const result = spawnSync("openssl", [
  "req",
  "-x509",
  "-newkey", "rsa:2048",
  "-keyout", KEY_FILE,
  "-out", CERT_FILE,
  "-days", "365",
  "-nodes",
  "-subj", "/CN=localhost/O=Fresh Republic/C=US"
]);

if (result.error) {
  console.error("❌ Error: OpenSSL is not installed or not in PATH");
  console.error("   Please install OpenSSL:");
  console.error("   - Windows: https://slproweb.com/products/Win32OpenSSL.html");
  console.error("   - macOS: brew install openssl");
  console.error("   - Linux: apt-get install openssl");
  process.exit(1);
}

if (result.status === 0) {
  console.log("");
  console.log("✅ SSL certificates generated successfully!");
  console.log(`   - Certificate: ${CERT_FILE}`);
  console.log(`   - Private key: ${KEY_FILE}`);
  console.log("");
  console.log("📝 To start the server with HTTPS:");
  console.log("   npm run start:https");
  console.log("   or");
  console.log("   npm run dev:https");
  console.log("");
  console.log("⚠️  Browser will warn about the self-signed certificate - this is normal for development.");
  console.log("");
} else {
  console.error("❌ Failed to generate certificates");
  console.error(result.stderr.toString());
  process.exit(1);
}
