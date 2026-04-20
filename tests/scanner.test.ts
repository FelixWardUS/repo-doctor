import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanRepository } from "../src/scanner.js";

const fixturesPath = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("scanRepository", () => {
  it("detects common repository files and README sections", async () => {
    const scan = await scanRepository(join(fixturesPath, "healthy-node-repo"));

    expect(scan.files).toEqual({
      readme: true,
      license: true,
      gitignore: true,
      packageJson: true,
      ciWorkflow: true
    });
    expect(scan.packageJson).toEqual({
      name: "healthy-node-repo",
      version: "1.0.0",
      description: undefined,
      license: undefined,
      scripts: {
        build: "tsc -p tsconfig.json",
        test: "vitest run"
      },
      dependencies: {},
      devDependencies: {}
    });
    expect(scan.ci.workflows).toEqual([
      {
        path: ".github/workflows/ci.yml",
        hasTestCommand: true,
        hasBuildCommand: false
      }
    ]);
    expect(scan.ci.hasTestCommand).toBe(true);
    expect(scan.ci.hasBuildCommand).toBe(false);
    expect(scan.readme.headings).toEqual([
      "Healthy Node Repo",
      "Installation",
      "Usage",
      "Testing"
    ]);
    expect(scan.readme.sections).toEqual({
      installation: true,
      usage: true,
      testing: true,
      contributing: false
    });
    expect(scan.readme.hasCodeExamples).toBe(true);
  });

  it("reports missing files without throwing", async () => {
    const scan = await scanRepository(join(fixturesPath, "minimal-repo"));

    expect(scan.files).toEqual({
      readme: true,
      license: false,
      gitignore: false,
      packageJson: false,
      ciWorkflow: false
    });
    expect(scan.packageJson).toBeUndefined();
    expect(scan.ci).toEqual({
      workflows: [],
      hasTestCommand: false,
      hasBuildCommand: false
    });
    expect(scan.readme.headings).toEqual(["Minimal Repo"]);
    expect(scan.readme.sections.installation).toBe(false);
    expect(scan.readme.wordCount).toBeGreaterThan(0);
  });
});
