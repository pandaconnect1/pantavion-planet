const { runTick } = require("./pantavion-agent-tick.cjs");

const intervalMs = Math.max(
  5000,
  Number(process.env.PANTAVION_AGENT_DAEMON_INTERVAL_MS || 30000)
);

const maxTicks = Math.max(
  1,
  Math.min(1000, Number(process.env.PANTAVION_AGENT_DAEMON_TICKS || 5))
);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(
    JSON.stringify(
      {
        ok: true,
        daemon: "pantavion_agent_local_daemon_v1",
        intervalMs,
        maxTicks,
        mode: "local_bounded_daemon",
        note:
          "Default daemon is bounded for safety. Cloud/forever scheduling requires founder approval, durable storage, queue, auth, and monitoring."
      },
      null,
      2
    )
  );

  for (let index = 0; index < maxTicks; index += 1) {
    const result = runTick("daemon");
    console.log(JSON.stringify(result.tick, null, 2));

    if (index < maxTicks - 1) {
      await sleep(intervalMs);
    }
  }

  console.log("PANTAVION AGENT LOCAL DAEMON: COMPLETED");
}

main().catch((error) => {
  console.error("PANTAVION AGENT LOCAL DAEMON: FAILED");
  console.error(error);
  process.exitCode = 1;
});
