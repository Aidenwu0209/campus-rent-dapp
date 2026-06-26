const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const frontDir = path.join(rootDir, "Front");
const children = new Set();

function command(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

function spawnChild(cmd, args, options = {}) {
  const child = spawn(cmd, args, {
    cwd: rootDir,
    stdio: options.stdio || "inherit",
    env: process.env
  });

  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rpcReady() {
  return new Promise((resolve) => {
    const request = http.request({
      method: "POST",
      hostname: "127.0.0.1",
      port: 7545,
      path: "/",
      timeout: 1000,
      headers: {
        "content-type": "application/json"
      }
    }, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });

    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.end(JSON.stringify({
      jsonrpc: "2.0",
      method: "net_version",
      params: [],
      id: 1
    }));
  });
}

async function waitForRpc(child) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error("Ganache exited before the RPC server became ready.");
    }

    if (await rpcReady()) {
      return;
    }

    await wait(500);
  }

  throw new Error("Timed out waiting for Ganache on http://127.0.0.1:7545.");
}

function runCommand(cmd, args, cwd = rootDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      env: process.env
    });

    children.add(child);
    child.on("exit", (code) => {
      children.delete(child);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log("Starting Ganache on http://127.0.0.1:7545, Chain ID 1337...");
  const ganache = spawnChild(command("npx"), [
    "ganache",
    "--wallet.deterministic",
    "--wallet.totalAccounts",
    "10",
    "--chain.chainId",
    "1337",
    "--chain.networkId",
    "1337",
    "--server.host",
    "127.0.0.1",
    "--server.port",
    "7545"
  ]);

  await waitForRpc(ganache);
  console.log("Ganache is ready. Deploying contracts...");
  await runCommand(command("npx"), ["truffle", "migrate", "--network", "development", "--reset"]);

  console.log("Starting frontend on http://127.0.0.1:5173/ ...");
  const frontend = spawn(command("npm"), ["run", "dev"], {
    cwd: frontDir,
    stdio: "inherit",
    env: process.env
  });
  children.add(frontend);
  frontend.on("exit", (code) => {
    children.delete(frontend);
    stopChildren();
    process.exit(code || 0);
  });
}

process.on("SIGINT", () => {
  stopChildren();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopChildren();
  process.exit(0);
});

main().catch((error) => {
  console.error(error.message);
  stopChildren();
  process.exit(1);
});
