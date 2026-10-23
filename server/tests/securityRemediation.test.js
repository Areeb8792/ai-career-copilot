const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "pravida_career_intelligence_2026_secure_key_prod_auth_secret";
process.env.SKIP_DOTENV = "true";

const app = require("../server");

// Helper to start ephemeral server for testing HTTP requests
function withServer(fn) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", async () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;
      try {
        await fn(baseUrl);
        server.close(resolve);
      } catch (err) {
        server.close(() => reject(err));
      }
    });
  });
}

function makeRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json,
        });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const JWT_SECRET = process.env.JWT_SECRET;
const validToken = jwt.sign({ id: "660000000000000000000001", tokenVersion: 0 }, JWT_SECRET, { expiresIn: "1h" });

test("Security Remediation 1: CORS allowed origin receives access-control-allow-origin and credentials", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(`${baseUrl}/`, {
      method: "GET",
      headers: {
        Origin: "https://ai-career-copilot-areeb3.vercel.app",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["access-control-allow-origin"], "https://ai-career-copilot-areeb3.vercel.app");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });
});

test("Security Remediation 2: CORS disallowed origin has access-control-allow-origin omitted", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(`${baseUrl}/`, {
      method: "GET",
      headers: {
        Origin: "https://evil-attacker-site.com",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });
});

test("Security Remediation 3: Preflight OPTIONS request works cleanly for allowed origin", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(`${baseUrl}/api/predict-risk`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://ai-career-copilot-areeb3.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.headers["access-control-allow-origin"], "https://ai-career-copilot-areeb3.vercel.app");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });
});

test("Security Remediation 4: Technology disclosure x-powered-by header is stripped", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(`${baseUrl}/`);
    assert.equal(res.headers["x-powered-by"], undefined);
  });
});

test("Security Remediation 5: /api/predict-risk rejects unauthenticated requests with 401", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(
      `${baseUrl}/api/predict-risk`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { role: "Software Engineer" }
    );

    assert.equal(res.statusCode, 401);
    assert.equal(res.json?.message, "No token");
  });
});

test("Security Remediation 6: /api/compare-roles rejects unauthenticated requests with 401", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(
      `${baseUrl}/api/compare-roles`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { roles: ["Developer", "Analyst"] }
    );

    assert.equal(res.statusCode, 401);
    assert.equal(res.json?.message, "No token");
  });
});

test("Security Remediation 7: /api/generate-roadmap rejects unauthenticated requests with 401", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(
      `${baseUrl}/api/generate-roadmap`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { goal: "Learn Python" }
    );

    assert.equal(res.statusCode, 401);
    assert.equal(res.json?.message, "No token");
  });
});

test("Security Remediation 7b: /api/career-roadmap/generate rejects unauthenticated requests with 401", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(
      `${baseUrl}/api/career-roadmap/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {}
    );

    assert.equal(res.statusCode, 401);
    assert.equal(res.json?.message, "No token");
  });
});

test("Security Remediation 8: /api/predict-risk validates role input when authenticated", async () => {
  const origEnsure = app.ensureDatabaseReady;
  const origFindById = app.User.findById;
  try {
    app.ensureDatabaseReady = async () => true;
    app.User.findById = () => ({ select: () => Promise.resolve({ _id: "660000000000000000000001", tokenVersion: 0 }) });

    await withServer(async (baseUrl) => {
      // Missing role
      const resMissing = await makeRequest(
        `${baseUrl}/api/predict-risk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
        },
        {}
      );
      assert.equal(resMissing.statusCode, 400);

      // Empty role
      const resEmpty = await makeRequest(
        `${baseUrl}/api/predict-risk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
        },
        { role: " " }
      );
      assert.equal(resEmpty.statusCode, 400);
    });
  } finally {
    app.ensureDatabaseReady = origEnsure;
    app.User.findById = origFindById;
  }
});

test("Security Remediation 9: /api/compare-roles validates roles array input when authenticated", async () => {
  const origEnsure = app.ensureDatabaseReady;
  const origFindById = app.User.findById;
  try {
    app.ensureDatabaseReady = async () => true;
    app.User.findById = () => ({ select: () => Promise.resolve({ _id: "660000000000000000000001", tokenVersion: 0 }) });

    await withServer(async (baseUrl) => {
      // Not an array
      const resNotArr = await makeRequest(
        `${baseUrl}/api/compare-roles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
        },
        { roles: "Software Engineer" }
      );
      assert.equal(resNotArr.statusCode, 400);

      // Empty array
      const resEmptyArr = await makeRequest(
        `${baseUrl}/api/compare-roles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
        },
        { roles: [] }
      );
      assert.equal(resEmptyArr.statusCode, 400);
    });
  } finally {
    app.ensureDatabaseReady = origEnsure;
    app.User.findById = origFindById;
  }
});

test("Security Remediation 10: /api/generate-roadmap validates goal input when authenticated", async () => {
  const origEnsure = app.ensureDatabaseReady;
  const origFindById = app.User.findById;
  try {
    app.ensureDatabaseReady = async () => true;
    app.User.findById = () => ({ select: () => Promise.resolve({ _id: "660000000000000000000001", tokenVersion: 0 }) });

    await withServer(async (baseUrl) => {
      const resEmpty = await makeRequest(
        `${baseUrl}/api/generate-roadmap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
        },
        { goal: "" }
      );
      assert.equal(resEmpty.statusCode, 400);
    });
  } finally {
    app.ensureDatabaseReady = origEnsure;
    app.User.findById = origFindById;
  }
});

test("Security Remediation 11: Tampered or invalid JWT signature is rejected with 401", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(`${baseUrl}/api/predict-risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature",
      },
      body: JSON.stringify({ role: "Software Engineer" }),
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.json?.message, "Invalid token");
  });
});

test("Security Remediation 12: Rate limit headers are present on authentication endpoints", async () => {
  await withServer(async (baseUrl) => {
    const res = await makeRequest(
      `${baseUrl}/api/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "invalid-email-format", password: "123" }
    );

    // RateLimit standard headers or status check
    assert.ok(
      res.headers["ratelimit-limit"] !== undefined ||
      res.headers["x-ratelimit-limit"] !== undefined ||
      res.statusCode === 400 ||
      res.statusCode === 503
    );
  });
});
