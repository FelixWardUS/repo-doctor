import type { HealthCheck, HealthReport, RepositoryScan } from "./types.js";

export function evaluateRepository(scan: RepositoryScan): HealthReport {
  const checks: HealthCheck[] = [
    binaryCheck({
      id: "readme",
      label: "README",
      passed: scan.files.readme,
      weight: 20,
      passMessage: "README.md exists.",
      failMessage: "No README file found.",
      suggestion: "Add a README.md that explains what the project does."
    }),
    binaryCheck({
      id: "license",
      label: "License",
      passed: scan.files.license,
      weight: 15,
      passMessage: "A license file exists.",
      failMessage: "No LICENSE file found.",
      suggestion: "Add a LICENSE file so visitors know how the project can be used."
    }),
    binaryCheck({
      id: "gitignore",
      label: "Git ignore",
      passed: scan.files.gitignore,
      weight: 10,
      passMessage: ".gitignore exists.",
      failMessage: "No .gitignore file found.",
      suggestion: "Add a .gitignore file for generated files and local dependencies."
    }),
    binaryCheck({
      id: "ci-workflow",
      label: "CI workflow",
      passed: scan.files.ciWorkflow,
      weight: 10,
      passMessage: "A GitHub Actions workflow exists.",
      failMessage: "No GitHub Actions workflow found.",
      suggestion: "Add a CI workflow that runs tests and builds the project."
    }),
    binaryCheck({
      id: "readme-installation",
      label: "README installation",
      passed: scan.readme.sections.installation,
      weight: 10,
      passMessage: "README includes installation instructions.",
      failMessage: "README is missing installation instructions.",
      suggestion: "Add an Installation section to README.md."
    }),
    binaryCheck({
      id: "readme-usage",
      label: "README usage",
      passed: scan.readme.sections.usage,
      weight: 10,
      passMessage: "README includes usage instructions.",
      failMessage: "README is missing usage instructions.",
      suggestion: "Add a Usage section to README.md."
    }),
    binaryCheck({
      id: "readme-testing",
      label: "README testing",
      passed: scan.readme.sections.testing,
      weight: 10,
      passMessage: "README explains how to run tests.",
      failMessage: "README is missing testing instructions.",
      suggestion: "Add a Testing section to README.md."
    }),
    binaryCheck({
      id: "readme-examples",
      label: "README examples",
      passed: scan.readme.hasCodeExamples,
      weight: 5,
      passMessage: "README includes command examples.",
      failMessage: "README has no fenced code examples.",
      suggestion: "Add at least one command example to README.md."
    }),
    packageMetadataCheck(scan),
    nodeScriptCheck(scan, "test", "node-test-script", "Node test script", "Add a test script to package.json."),
    nodeScriptCheck(scan, "build", "node-build-script", "Node build script", "Add a build script to package.json.")
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const totalPoints = checks.reduce((sum, check) => sum + check.points, 0);
  const score = totalWeight === 0 ? 0 : Math.round((totalPoints / totalWeight) * 100);

  return {
    targetPath: scan.targetPath,
    score,
    summary: {
      passed: checks.filter((check) => check.status === "pass").length,
      warned: checks.filter((check) => check.status === "warn").length,
      failed: checks.filter((check) => check.status === "fail").length
    },
    checks,
    recommendations: checks
      .filter((check) => check.status !== "pass" && check.suggestion)
      .map((check) => check.suggestion as string)
  };
}

function binaryCheck(input: {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  passMessage: string;
  failMessage: string;
  suggestion: string;
}): HealthCheck {
  return {
    id: input.id,
    label: input.label,
    status: input.passed ? "pass" : "fail",
    message: input.passed ? input.passMessage : input.failMessage,
    suggestion: input.passed ? undefined : input.suggestion,
    weight: input.weight,
    points: input.passed ? input.weight : 0
  };
}

function packageMetadataCheck(scan: RepositoryScan): HealthCheck {
  if (!scan.packageJson) {
    return {
      id: "package-metadata",
      label: "Package metadata",
      status: "warn",
      message: "No package.json found; Node package checks are informational.",
      suggestion: "Add package metadata if this repository is distributed as a Node package.",
      weight: 0,
      points: 0
    };
  }

  const hasMetadata = Boolean(scan.packageJson.name && scan.packageJson.version);
  return {
    id: "package-metadata",
    label: "Package metadata",
    status: hasMetadata ? "pass" : "fail",
    message: hasMetadata
      ? "package.json includes name and version."
      : "package.json is missing name or version.",
    suggestion: hasMetadata ? undefined : "Add name and version fields to package.json.",
    weight: 5,
    points: hasMetadata ? 5 : 0
  };
}

function nodeScriptCheck(
  scan: RepositoryScan,
  scriptName: string,
  id: string,
  label: string,
  suggestion: string
): HealthCheck {
  if (!scan.packageJson) {
    return {
      id,
      label,
      status: "warn",
      message: "No package.json found; this Node script check was skipped.",
      weight: 0,
      points: 0
    };
  }

  const hasScript = Boolean(scan.packageJson.scripts[scriptName]);
  const weight = scriptName === "test" ? 10 : 5;

  return {
    id,
    label,
    status: hasScript ? "pass" : "fail",
    message: hasScript
      ? `package.json defines a ${scriptName} script.`
      : `package.json is missing a ${scriptName} script.`,
    suggestion: hasScript ? undefined : suggestion,
    weight,
    points: hasScript ? weight : 0
  };
}
