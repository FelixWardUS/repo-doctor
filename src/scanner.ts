import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { CiScan, CiWorkflowFile, PackageMetadata, ReadmeScan, RepositoryScan } from "./types.js";

const readmePattern = /^readme(?:\.(?:md|markdown|txt))?$/i;
const licensePattern = /^(?:license|licence)(?:\.(?:md|txt))?$/i;

export async function scanRepository(targetPath: string): Promise<RepositoryScan> {
  const absolutePath = resolve(targetPath);
  const entries = await readDirectoryNames(absolutePath);

  const readmeFile = entries.find((entry) => readmePattern.test(entry));
  const licenseFile = entries.some((entry) => licensePattern.test(entry));
  const hasGitignore = entries.includes(".gitignore");
  const hasPackageJson = entries.includes("package.json");
  const ci = await scanGithubActionsWorkflows(absolutePath);

  return {
    targetPath: absolutePath,
    files: {
      readme: Boolean(readmeFile),
      license: licenseFile,
      gitignore: hasGitignore,
      packageJson: hasPackageJson,
      ciWorkflow: ci.workflows.length > 0
    },
    readme: readmeFile
      ? await scanReadme(join(absolutePath, readmeFile), readmeFile)
      : emptyReadmeScan(),
    ci,
    packageJson: hasPackageJson
      ? await scanPackageJson(join(absolutePath, "package.json"))
      : undefined
  };
}

async function readDirectoryNames(path: string): Promise<string[]> {
  return readdir(path);
}

async function scanGithubActionsWorkflows(targetPath: string): Promise<CiScan> {
  try {
    const workflowPath = join(targetPath, ".github", "workflows");
    const workflowFiles = (await readdir(workflowPath))
      .filter((file) => /\.(?:ya?ml)$/i.test(file))
      .sort();
    const workflows = await Promise.all(
      workflowFiles.map(async (file): Promise<CiWorkflowFile> => {
        const content = await readFile(join(workflowPath, file), "utf8");

        return {
          path: join(".github", "workflows", file),
          hasTestCommand: hasCommand(content, "test"),
          hasBuildCommand: hasCommand(content, "build")
        };
      })
    );

    return {
      workflows,
      hasTestCommand: workflows.some((workflow) => workflow.hasTestCommand),
      hasBuildCommand: workflows.some((workflow) => workflow.hasBuildCommand)
    };
  } catch {
    return emptyCiScan();
  }
}

async function scanReadme(path: string, filename: string): Promise<ReadmeScan> {
  const content = await readFile(path, "utf8");

  return {
    path: filename,
    wordCount: countWords(content),
    hasCodeExamples: /```/.test(content),
    headings: extractHeadings(content),
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
    description?: unknown;
    license?: unknown;
    scripts?: Record<string, unknown>;
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
  };

  return {
    name: typeof parsed.name === "string" ? parsed.name : undefined,
    version: typeof parsed.version === "string" ? parsed.version : undefined,
    description: typeof parsed.description === "string" ? parsed.description : undefined,
    license: typeof parsed.license === "string" ? parsed.license : undefined,
    scripts: normalizeStringMap(parsed.scripts),
    dependencies: normalizeStringMap(parsed.dependencies),
    devDependencies: normalizeStringMap(parsed.devDependencies)
  };
}

function normalizeStringMap(value: Record<string, unknown> | undefined): Record<string, string> {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => {
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

function extractHeadings(content: string): string[] {
  return [...content.matchAll(/^#{1,6}\s+(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function hasCommand(content: string, command: "test" | "build"): boolean {
  return new RegExp(`\\b(?:npm|pnpm|yarn|bun)\\s+(?:run\\s+)?${command}\\b`, "i").test(content);
}

function countWords(content: string): number {
  const words = content.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function emptyReadmeScan(): ReadmeScan {
  return {
    wordCount: 0,
    hasCodeExamples: false,
    headings: [],
    sections: {
      installation: false,
      usage: false,
      testing: false,
      contributing: false
    }
  };
}

function emptyCiScan(): CiScan {
  return {
    workflows: [],
    hasTestCommand: false,
    hasBuildCommand: false
  };
}
