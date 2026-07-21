import { access, cp, lstat, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const distDir = path.join(projectDir, "dist");
const serverDir = path.join(distDir, "server");
const outputCandidates = [
  path.join(projectDir, ".worker-next"),
  path.join(projectDir, ".open-next"),
];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function findOutputDir() {
  for (const candidate of outputCandidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }
  throw new Error("Missing OpenNext output. Run the build first.");
}

async function main() {
  const outputDir = await findOutputDir();
  const hostingSource = path.join(projectDir, ".openai", "hosting.json");
  const hostingTarget = path.join(distDir, ".openai", "hosting.json");
  const pgStubDir = path.join(
    serverDir,
    "server-functions",
    "default",
    ".next",
    "node_modules",
    "pg-587764f78a6c7a9c",
  );

  await rm(distDir, { recursive: true, force: true });
  await mkdir(serverDir, { recursive: true });

  await cp(outputDir, serverDir, { recursive: true });
  if (await exists(hostingSource)) {
    await mkdir(path.dirname(hostingTarget), { recursive: true });
    await cp(hostingSource, hostingTarget);
  }
  await rm(path.join(serverDir, "cache"), { recursive: true, force: true });
  await rm(
    path.join(
      serverDir,
      "server-functions",
      "default",
      ".next",
      "cache",
    ),
    { recursive: true, force: true },
  );
  if (await exists(pgStubDir)) {
    const stats = await lstat(pgStubDir);
    if (stats.isSymbolicLink()) {
      await rm(pgStubDir, { recursive: true, force: true });
      await mkdir(pgStubDir, { recursive: true });
      await writeFile(
        path.join(pgStubDir, "package.json"),
        JSON.stringify(
          {
            name: "pg",
            version: "8.22.0",
            main: "index.js",
            type: "commonjs",
          },
          null,
          2,
        ) + "\n",
      );
      await writeFile(
        path.join(pgStubDir, "index.js"),
        [
          "class Pool {",
          "  constructor() {}",
          "  async query() {",
          "    return { rows: [], rowCount: 0 };",
          "  }",
          "  async end() {}",
          "  async connect() {",
          "    return {",
          "      query: this.query.bind(this),",
          "      release() {},",
          "    };",
          "  }",
          "}",
          "",
          "module.exports = { Pool };",
          "",
        ].join("\n"),
      );
    }
  }

  const workerFile = path.join(serverDir, "worker.js");
  const entryFile = path.join(serverDir, "index.js");
  if (await exists(workerFile)) {
    await rm(entryFile, { force: true });
    await rename(workerFile, entryFile);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
