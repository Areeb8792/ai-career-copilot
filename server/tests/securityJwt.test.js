const test = require("node:test");
const assert = require("node:assert/strict");
const cp = require("node:child_process");
const path = require("node:path");
const jwt = require("jsonwebtoken");

test("Security Audit: Server refuses to start with insecure or default JWT_SECRET", () => {
  const insecureSecrets = [
    "secretkey",
    "default",
    "changeme",
    "jwt_secret",
    "secret",
    "placeholder",
    "short",
    "",
    undefined,
  ];

  for (const badSecret of insecureSecrets) {
    let processFailed = false;
    let exitCode = 0;
    const childEnv = { ...process.env };
    if (badSecret === undefined) {
      delete childEnv.JWT_SECRET;
      childEnv.SKIP_DOTENV = "true";
    } else {
      childEnv.JWT_SECRET = badSecret;
    }

    try {
      cp.execSync('node -e "require(\'./server.js\')"', {
        cwd: path.resolve(__dirname, ".."),
        env: childEnv,
        stdio: "pipe",
        timeout: 5000,
      });
    } catch (err) {
      processFailed = true;
      exitCode = err.status;
    }

    assert.equal(
      processFailed,
      true,
      `Expected server to fail with bad JWT_SECRET: "${badSecret}"`
    );
    assert.equal(exitCode, 1);
  }
});

test("Security Audit: Server successfully boots and authenticates tokens with secure JWT_SECRET", () => {
  const secureKey = "pravida_career_intelligence_2026_secure_key_prod_auth_secret";

  // Verify server process boots cleanly and exits 0 when required with secure JWT_SECRET
  let bootError = null;
  try {
    cp.execSync('node -e "require(\'./server.js\')"', {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, JWT_SECRET: secureKey },
      stdio: "pipe",
      timeout: 5000,
    });
  } catch (err) {
    bootError = err;
  }
  assert.equal(bootError, null, "Server should boot without error when secure JWT_SECRET is provided");

  // Verify jwt signing and verification
  const token = jwt.sign({ id: "user_test_123" }, secureKey, { expiresIn: "7d" });
  assert.ok(typeof token === "string");

  const decoded = jwt.verify(token, secureKey);
  assert.equal(decoded.id, "user_test_123");

  // Verify tampering fails
  assert.throws(() => {
    jwt.verify(token, "wrong_tampered_key_12345678");
  });
});
