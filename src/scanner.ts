import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { PackageMetadata, ReadmeScan, RepositoryScan } from "./types.js";

const readmePattern = /^readme(?:\.(?:md|markdown|txt))?$/i;
const licensePattern = /^(?:license|licence)(?:\.(?:md|txt))?$/i;

export async function scanRepository(targetPath: string): Promise<RepositoryScan> {
  const absolutePath = resolve(targetPath);
  const entries = await readDirectoryNames(absolutePath);

  const readmeFile = entries.find((entry) => readmePattern.test(entry));
  const licenseFile = entries.some((entry) => licensePattern.test(entry));
  const hasGitignore = entries.includes(".gitignore");
  const hasPackageJson = entries.includes("package.json");

  return {
    targetPath: absolutePath,
    files: {
      readme: Boolean(readmeFile),
      license: licenseFile,
      gitignore: hasGitignore,
      packageJson: hasPackageJson,
      ciWorkflow: await hasGithubActionsWorkflow(absolutePath)
    },
    readme: readmeFile
      ? await scanReadme(join(absolutePath, readmeFile), readmeFile)
      : emptyReadmeScan(),
    packageJson: hasPackageJson
      ? await scanPackageJson(join(absolutePath, "package.json"))
      : undefined
  };
}

async function readDirectoryNames(path: string): Promise<string[]> {
  return readdir(path);
}

async function hasGithubActionsWorkflow(targetPath: string): Promise<boolean> {
  try {
    const workflowPath = join(targetPath, ".github", "workflows");
    const workflows = await readdir(workflowPath);
    return workflows.some((file) => /\.(?:ya?ml)$/i.test(file));
  } catch {
    return false;
  }
}

async function scanReadme(path: string, filename: string): Promise<ReadmeScan> {
  const content = await readFile(path, "utf8");

  return {
    path: filename,
    wordCount: countWords(content),
    hasCodeExamples: /```/.test(content),
    sections: {
      installation: hasHeading(content, ["installation", "install", "setup"]),
      usage: hasHeading(content, ["usage", "getting started", "quick start"]),
      testing: hasHeading(content, ["testing", "tests", "test"]),
      contributing: hasHeading(content, ["contributing", "contribution"])
    }
  };
}

async function scanPackageJson(path: string): Promise<PackageMetadata> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as {
    name?: unknown;
    version?: unknown;
    scripts?: Record<string, unknown>;
  };

  return {
    name: typeof parsed.name === "string" ? parsed.name : undefined,
    version: typeof parsed.version === "string" ? parsed.version : undefined,
    scripts: normalizeScripts(parsed.scripts)
  };
}

function normalizeScripts(scripts: Record<string, unknown> | undefined): Record<string, string> {
  if (!scripts) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(scripts).filter((entry): entry is [string, string] => {
      return typeof entry[1] === "string";
    })
  );
}

function hasHeading(content: string, labels: string[]): boolean {
  return labels.some((label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^#{2,6}\\s+${escaped}\\b`, "im").test(content);
  });
}

function countWords(content: string): number {
  const words = content.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function emptyReadmeScan(): ReadmeScan {
  return {
    wordCount: 0,
    hasCodeExamples: false,
    sections: {
      installation: false,
      usage: false,
      testing: false,
      contributing: false
    }
  };
}
