import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("loads format and fail-under defaults from .repo-doctor.json", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "repo-doctor-config-"));

    try {
      await writeFile(join(tempDir, ".repo-doctor.json"), JSON.stringify({
        format: "markdown",
        failUnder: 85
      }));

      await expect(loadConfig(tempDir)).resolves.toEqual({
        format: "markdown",
        failUnder: 85
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("uses an empty config when the file does not exist", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "repo-doctor-config-"));

    try {
      await expect(loadConfig(tempDir)).resolves.toEqual({});
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
