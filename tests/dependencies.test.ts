import { describe, expect, it } from "vitest";
import { collectDependencyDiagnostics } from "../src/dependencies.js";

describe("collectDependencyDiagnostics", () => {
  it("summarizes npm audit and outdated results", async () => {
    const calls: string[][] = [];

    const diagnostics = await collectDependencyDiagnostics("/repo", async (args) => {
      calls.push(args);

      if (args[0] === "audit") {
        return {
          exitCode: 1,
          stdout: JSON.stringify({
            metadata: {
              vulnerabilities: {
                info: 0,
                low: 1,
                moderate: 2,
                high: 0,
                critical: 0,
                total: 3
              }
            }
          }),
          stderr: ""
        };
      }

      return {
        exitCode: 1,
        stdout: JSON.stringify({
          commander: {
            current: "12.1.0",
            wanted: "12.1.0",
            latest: "14.0.3"
          }
        }),
        stderr: ""
      };
    });

    expect(calls).toEqual([
      ["audit", "--json"],
      ["outdated", "--json"]
    ]);
    expect(diagnostics.audit).toEqual({
      total: 3,
      bySeverity: {
        info: 0,
        low: 1,
        moderate: 2,
        high: 0,
        critical: 0
      }
    });
    expect(diagnostics.outdated).toEqual([
      {
        name: "commander",
        current: "12.1.0",
        wanted: "12.1.0",
        latest: "14.0.3"
      }
    ]);
  });
});
