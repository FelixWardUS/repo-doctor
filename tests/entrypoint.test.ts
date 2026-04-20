import { execFile } from "node:child_process";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixturesPath = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("bin entrypoint", () => {
  it("runs when invoked through a symlink created by npm link", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "repo-doctor-bin-"));
    const linkedBin = join(tempDir, "repo-doctor");

    try {
      await symlink(join(projectRoot, "src", "cli.ts"), linkedBin);

      const { stdout } = await execFileAsync(process.execPath, [
        "--import",
        "tsx",
        linkedBin,
        "scan",
        join(fixturesPath, "healthy-node-repo")
      ], {
        cwd: projectRoot
      });

      expect(stdout).toContain("Repo Doctor");
      expect(stdout).toContain("Score: 100/100");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
