// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { DEFAULT_API_BASE_URL, TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("DistroGene Probability Calculator");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("crispr_coverage");
      expect(names).toContain("go_enrichment");
      expect(names).toContain("variant_detection");
    },
    30_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs crispr_coverage example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("crispr_coverage");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.ready).toBe(true);
      expect(result.result?.scenario).toBe("crispr_coverage");
      expect(result.result?.probability).toBeGreaterThan(0.9);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs go_enrichment example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("go_enrichment");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.ready).toBe(true);
      expect(result.result?.scenario).toBe("go_enrichment");
      expect(result.result?.fold_enrichment).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs variant_detection example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("variant_detection");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.ready).toBe(true);
      expect(result.result?.scenario).toBe("variant_detection");
      expect(result.result?.probability).toBe(1);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs and fetches run via getRun()",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("crispr_coverage");
      const initial = await client.run(input);

      expect(initial.run_id).toBeTruthy();
      const fetched = await client.getRun(initial.run_id);
      expect(fetched.run_id).toBe(initial.run_id);
      expect(fetched.status).toBe("completed");
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("DistroGene Probability Calculator");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("crispr_coverage");
      expect(names).toContain("go_enrichment");
      expect(names).toContain("variant_detection");
    },
    30_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs crispr_coverage example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("crispr_coverage");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.ready).toBe(true);
      expect(result.result?.scenario).toBe("crispr_coverage");
      expect(result.result?.probability).toBeGreaterThan(0.9);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs go_enrichment example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("go_enrichment");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.ready).toBe(true);
      expect(result.result?.scenario).toBe("go_enrichment");
      expect(result.result?.fold_enrichment).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs variant_detection example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("variant_detection");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.ready).toBe(true);
      expect(result.result?.scenario).toBe("variant_detection");
      expect(result.result?.probability).toBe(1);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs and fetches run via getRun()",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("crispr_coverage");
      const initial = await client.run(input);

      expect(initial.run_id).toBeTruthy();
      const fetched = await client.getRun(initial.run_id);
      expect(fetched.run_id).toBe(initial.run_id);
      expect(fetched.status).toBe("completed");
    },
    60_000,
  );
});

describe("integration: config defaults", () => {
  it("uses production base URL by default", () => {
    expect(DEFAULT_API_BASE_URL).toBe("https://tools.pepkio.com");
  });
});
