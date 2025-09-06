import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { TestGenerator } from "../generator/TestGenerator";
import { PlaywrightRunner } from "../runner/PlaywrightRunner";
import { TestReporter } from "../reporter/TestReporter";
import config from "../config";
import { Validator } from "../utils/validator";
import { LoginConfig, TestSuite } from "../types";

async function runPipeline(url: string, options: { deeper?: boolean; login?: LoginConfig }): Promise<{ summary: any; reportPath: string; testSuite: TestSuite }> {
  if (!process.env.GEMINI_API_KEY && !config.gemini.apiKey) {
    throw new Error("GEMINI_API_KEY is required. Set it in env or config.env");
  }
  const apiKey = process.env.GEMINI_API_KEY || config.gemini.apiKey;
  Validator.validateApiKey(apiKey);
  (config as any).gemini.apiKey = apiKey;

  if (options.deeper) {
    config.analysis.maxDepth = Math.max(config.analysis.maxDepth, 3);
    config.analysis.maxPages = Math.max(config.analysis.maxPages, 30);
    config.test.maxTestCases = Math.max(config.test.maxTestCases, 60);
    (config as any).test.maxStepsPerTest = Math.max((config as any).test.maxStepsPerTest || 6, 12);
    (config as any).test.maxTestDurationMs = Math.max((config as any).test.maxTestDurationMs || 20000, 40000);
    config.test.maxConcurrency = Math.max(config.test.maxConcurrency, 3);
    config.playwright.timeout = Math.max(config.playwright.timeout, 45000);
  }

  const generator = new TestGenerator();
  const runner = new PlaywrightRunner();
  const reporter = new TestReporter();

  const testSuite = await generator.generateTestSuite(url);
  const results = await runner.runTestSuite(testSuite, options.login);

  const reportPath = await reporter.generateReport(testSuite);
  const summary = runner.getSummary();
  return { summary, reportPath, testSuite };
}

const server = new Server({
  name: "fagun-playwright-mcp",
  version: "1.0.0",
});

const inputSchema = z.object({
  url: z.string().url(),
  deeper: z.boolean().optional(),
  login: z
    .object({
      required: z.boolean().default(true),
      loginUrl: z.string().url().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      usernameSelector: z.string().optional(),
      passwordSelector: z.string().optional(),
      submitSelector: z.string().optional(),
    })
    .optional(),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_all",
        description: "Analyze site, generate tests with Gemini, run via Playwright, and report.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            deeper: { type: "boolean" },
            login: {
              type: "object",
              properties: {
                required: { type: "boolean" },
                loginUrl: { type: "string" },
                username: { type: "string" },
                password: { type: "string" },
                usernameSelector: { type: "string" },
                passwordSelector: { type: "string" },
                submitSelector: { type: "string" },
              },
              additionalProperties: true,
            },
          },
          required: ["url"],
          additionalProperties: true,
        },
      },
    ],
  } as any;
});

server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
  const { name, arguments: args } = req.params || {};
  if (name !== "run_all") {
    throw new Error(`Unknown tool: ${name}`);
  }
  const parsed = inputSchema.parse(args || {});
  const { summary, reportPath, testSuite } = await runPipeline(parsed.url, { deeper: parsed.deeper, login: parsed.login as LoginConfig | undefined });
  const typeCounts = testSuite.testCases.reduce((acc: Record<string, number>, tc) => {
    const k = (tc.type || "unknown").toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const payload = {
    summary,
    reportPath,
    website: testSuite.website,
    testCountsByType: typeCounts,
    pagesAnalyzed: testSuite.analysis?.pages.length || 0,
    totalElements: testSuite.analysis?.totalElements || 0,
    brokenLinks: testSuite.analysis?.brokenLinks || [],
  };
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload),
      },
    ],
  } as any;
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed:", err);
  process.exit(1);
});


