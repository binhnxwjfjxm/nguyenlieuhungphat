import { access, cp, mkdir, rename, rm } from "node:fs/promises";
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

  await rm(distDir, { recursive: true, force: true });
  await mkdir(serverDir, { recursive: true });

  await cp(outputDir, serverDir, { recursive: true, dereference: true });
  if (await exists(hostingSource)) {
    await mkdir(path.dirname(hostingTarget), { recursive: true });
    await cp(hostingSource, hostingTarget);
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
