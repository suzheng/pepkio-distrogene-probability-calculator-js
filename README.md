# Pepkio DistroGene Probability Calculator

ESM TypeScript and Node.js client library with CLI for computing genomic probability distributions, CRISPR guide coverage, hypergeometric pathway enrichment, rare variant detection thresholds, and barcode collision rates via the hosted Pepkio Tools API.

# What It Does

In molecular genomics and high-throughput assays, calculating exact statistical distributions is essential for experimental design, sequencing depth planning, and significance testing. This package calls the hosted Pepkio DistroGene Probability Calculator over REST so researchers and bioinformaticians can compute probabilities programmatically from Node.js (≥18) scripts, applications, and automated pipelines without implementing complex discrete distribution algorithms locally.

Calculations run on Pepkio servers using exact statistical formulations that prevent numerical overflow. Each completed run returns calculated probabilities, distribution parameters, statistical interpretations, publication Methods text, and an optional permalink for reproducible sharing.

# Features

- **Genomic Distribution Scenarios**: Poisson CRISPR guide coverage, Hypergeometric GO and pathway enrichment, Binomial low-frequency variant detection, occupancy-based UMI/barcode collisions, and serial dilutions
- **Forward and Reverse Solvers**: Compute cumulative probabilities from experimental values or invert models to solve for required sequencing reads or sample sizes given target confidence
- **Exact Tail Evaluations**: Evaluate exact point probabilities ($P(X = k)$) and cumulative tails ($P(X \ge k)$, $P(X \le k)$, $P(X > k)$, $P(X < k)$)
- **Model Organism Presets**: Background gene counts for *Homo sapiens*, *Mus musculus*, *Drosophila melanogaster*, *Caenorhabditis elegans*, *Saccharomyces cerevisiae*, and *Arabidopsis thaliana*
- **Convenience Helpers**: Dedicated helper methods for `calculateCrisprCoverage`, `calculateGoEnrichment`, `calculateVariantDetection`, and `calculateBarcodeCollision`
- **Typed ESM Client**: Full TypeScript definitions with Zod schema validation and Promise-based API
- **Command-Line Interface (CLI)**: Introspect manifest examples and execute calculations directly from the terminal
- **Reproducible Outputs**: Formatted results with shareable permalinks and publication-ready Methods descriptions

# Installation

```bash
npm install pepkio-distrogene-probability-calculator
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before invoking `run()`:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create and manage keys in your [Pepkio Account](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (required for `run`) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```typescript
import { PepkioClient } from "pepkio-distrogene-probability-calculator";

const client = new PepkioClient({ apiKey: process.env.PEPKIO_API_KEY });

// 1. Run a named manifest example (e.g. CRISPR library coverage)
const input = await client.getExampleInput("crispr_coverage");
const result = await client.run(input);

console.log("Status:", result.status);
console.log("Probability:", result.result?.probability);
console.log("Interpretation:", result.result?.interpretation);
console.log("Permalink:", result.permalink);

// 2. Or use convenience helpers directly
const crispr = await client.calculateCrisprCoverage({
  librarySize: 80000,
  totalReads: 40000000,
  thresholdK: 100,
});
console.log("CRISPR guide coverage probability:", crispr.result?.probability);
```

# CLI

```bash
# List available manifest examples
npx pepkio-distrogene-probability-calculator manifest --examples

# Run a calculation example
npx pepkio-distrogene-probability-calculator run --example crispr_coverage
```

Pass `--base-url` and `--api-key` to override environment defaults.

# Typical Use Cases

- **CRISPR Screen Guide Representation** (`crispr_coverage`) — Determine total sequencing reads needed so that guides in an 80,000-sgRNA library meet $\ge 100\times$ coverage under Poisson sampling.
- **Gene Ontology & Pathway Enrichment** (`go_enrichment`) — Compute hypergeometric overrepresentation $p$-values for differential expression gene lists against organism reference backgrounds.
- **Low-Frequency Variant Detection** (`variant_detection`) — Calculate required depth to detect a 1% allele frequency variant with $\ge 3$ supporting reads at 95% statistical power.
- **Single-Cell UMI / Barcode Collisions** — Model collision risk when indexing single cells in microfluidic droplets.

# Scientific Background

In molecular genomics, discrete probability distributions describe sampling and counting phenomena:
- The **Poisson distribution** models read arrival across guide RNAs in pooled CRISPR screens ($P(X \ge k)$).
- The **Hypergeometric distribution** models sampling without replacement for gene set enrichment (Fisher's exact test equivalent).
- The **Binomial distribution** evaluates the probability of sampling rare mutant alleles given sequencing depth and base error rates.
- **Occupancy models** predict unique barcode recovery and collision rates given library complexity.

The Pepkio engine evaluates exact tails and inverts parameters using root-finding algorithms to avoid numerical instability and floating-point overflow common in spreadsheets.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/distrogene-probability-calculator

The web application provides interactive parameter sliders, distribution charts, organism presets, publication Methods text generation, and shareable permalinks. The npm package uses the same calculation engine via the REST API.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-distrogene-probability-calculator-js

Web Application: https://www.pepkio.com/tools/distrogene-probability-calculator

Python client (PyPI): https://pypi.org/project/pepkio-distrogene-probability-calculator/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/f558282e483cf0cd9d109099eefdf746d0263f0775c7abc672debf1b872dc87d)
