const { spawn, spawnSync } = require("child_process");

const port = Number(process.env.PANTAVION_SMOKE_PORT || 3027);
const baseUrl = `http://127.0.0.1:${port}`;
const provider = process.env.PANTAVION_TRANSLATE_PROVIDER || "mymemory";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function commandName(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

async function waitForServer() {
  const deadline = Date.now() + 60000;
  let lastError = "";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { method: "GET" });

      if (response.status < 500) {
        return;
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error && error.message ? error.message : String(error);
    }

    await sleep(1500);
  }

  throw new Error(`Next dev server did not become ready on ${baseUrl}. Last error: ${lastError}`);
}

function stopServer(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32" && child.pid) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

async function main() {
  console.log("PANTAVION REAL TRANSLATION SMOKE: START");
  console.log(`Provider: ${provider}`);
  console.log(`Port: ${port}`);

  const child = spawn(commandName("npm"), ["run", "dev", "--", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PANTAVION_TRANSLATE_PROVIDER: provider,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";

  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
    process.stdout.write(chunk);
  });

  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
    process.stderr.write(chunk);
  });

  try {
    await waitForServer();

    const payload = {
      text: "Hello George, Pantavion translation is now live.",
      sourceLanguage: "en",
      targetLanguage: "el",
      mode: "text",
      sessionId: "pantavion-real-translation-smoke",
    };

    const response = await fetch(`${baseUrl}/api/translate/universal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log("PANTAVION REAL TRANSLATION RESULT:");
    console.log(JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(`Translation API returned HTTP ${response.status}`);
    }

    if (!result || result.ok !== true || result.status !== "translated") {
      throw new Error("Translation did not complete with status translated.");
    }

    if (typeof result.translatedText !== "string" || result.translatedText.trim().length === 0) {
      throw new Error("Translation returned empty translatedText.");
    }

    console.log("PANTAVION REAL TRANSLATION SMOKE: PASSED");
  } finally {
    stopServer(child);
  }
}

main().catch((error) => {
  console.error("PANTAVION REAL TRANSLATION SMOKE: FAILED");
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});
