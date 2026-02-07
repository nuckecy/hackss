#!/usr/bin/env node

/**
 * extract-knowledge.js
 *
 * Extracts component data from a cloned SDS (Simple Design System) repo
 * and generates a knowledge base JSON file for UX Buddy.
 *
 * Usage:
 *   node scripts/extract-knowledge.js /path/to/sds
 *
 * Output:
 *   src/knowledge/components-extracted.json
 *
 * NOTE: This script produces a STARTING POINT. The output will need
 * manual review and enrichment, especially:
 *   - accessibility guidelines
 *   - usage do/dont lists
 *   - descriptions
 */

const fs = require("fs");
const path = require("path");

// ── CLI Args ──

const sdsPath = process.argv[2];

if (!sdsPath) {
  console.error("Usage: node scripts/extract-knowledge.js /path/to/sds");
  console.error("Example: node scripts/extract-knowledge.js ../sds");
  process.exit(1);
}

const resolvedSdsPath = path.resolve(sdsPath);

if (!fs.existsSync(resolvedSdsPath)) {
  console.error(`Error: SDS repo not found at ${resolvedSdsPath}`);
  process.exit(1);
}

const primitivesDir = path.join(resolvedSdsPath, "src", "ui", "primitives");
const figmaDir = path.join(resolvedSdsPath, "src", "figma", "primitives");

if (!fs.existsSync(primitivesDir)) {
  console.error(`Error: primitives directory not found at ${primitivesDir}`);
  process.exit(1);
}

console.log(`\n📂 SDS repo: ${resolvedSdsPath}`);
console.log(`📂 Primitives: ${primitivesDir}`);
console.log(`📂 Figma Code Connect: ${figmaDir}\n`);

// ── Helpers ──

function readFileOrNull(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Extract TypeScript type/interface props from a .tsx file.
 * Looks for patterns like:
 *   type ButtonBaseProps = { size?: "small" | "medium"; variant?: "primary" | "neutral"; }
 *   export type InputProps = SharedFieldProps & { ... }
 */
function extractProps(source, componentName) {
  const properties = {};
  const variants = {};

  // Match type definitions with props
  // Pattern: type XxxProps = { ... }
  const propsRegex =
    /type\s+\w*Props\w*\s*=\s*(?:[\w<>,\s]*&\s*)?{([^}]*)}/gs;
  let propsMatch;

  while ((propsMatch = propsRegex.exec(source)) !== null) {
    const block = propsMatch[1];

    // Extract each property line: name?: "a" | "b" | "c";
    const propRegex =
      /(\w+)\??\s*:\s*([^;]+)/g;
    let propMatch;

    while ((propMatch = propRegex.exec(block)) !== null) {
      const propName = propMatch[1].trim();
      const propType = propMatch[2].trim();

      // Skip internal/inherited props
      if (
        propName.startsWith("_") ||
        ["children", "className", "style", "ref", "key"].includes(propName)
      ) {
        continue;
      }

      const isRequired = !propsMatch[0].includes(`${propName}?`);

      // Check if it's a union of string literals → variant
      const unionMatch = propType.match(
        /^"([^"]+)"(?:\s*\|\s*"([^"]+)")+$/
      );
      if (unionMatch) {
        const values = [];
        const unionRegex = /"([^"]+)"/g;
        let um;
        while ((um = unionRegex.exec(propType)) !== null) {
          values.push(um[1]);
        }
        variants[propName] = values;
        properties[propName] = {
          type: "enum",
          required: isRequired,
          description: `${propName} variant`,
        };
      } else {
        // Simplify complex types
        let simpleType = propType;
        if (propType.includes("ComponentPropsWithoutRef")) {
          simpleType = "string";
        } else if (propType.includes("ReactNode") || propType.includes("JSX")) {
          simpleType = "ReactNode";
        } else if (propType.includes("=>")) {
          simpleType = "function";
        } else if (propType === "boolean") {
          simpleType = "boolean";
        } else if (propType === "string") {
          simpleType = "string";
        } else if (propType === "number") {
          simpleType = "number";
        }

        properties[propName] = {
          type: simpleType,
          required: isRequired,
          description: "",
        };
      }
    }
  }

  return { properties, variants };
}

/**
 * Extract CSS custom properties and class-name variant patterns from a .css file.
 * Looks for:
 *   - SDS token references: var(--sds-color-*)
 *   - Variant classes: .button-variant-primary, .button-size-small
 *   - State selectors: [data-hovered], [data-disabled]
 */
function extractCss(source, componentName) {
  const tokens = {};
  const cssVariants = {};

  // Extract --sds-* token references
  const tokenRegex = /var\((--sds-[\w-]+)\)/g;
  let tokenMatch;
  const seenTokens = new Set();

  while ((tokenMatch = tokenRegex.exec(source)) !== null) {
    const token = tokenMatch[1];
    if (!seenTokens.has(token)) {
      seenTokens.add(token);

      // Categorize token
      if (token.includes("-color-")) {
        tokens[token] = "color";
      } else if (token.includes("-size-space-")) {
        tokens[token] = "spacing";
      } else if (token.includes("-size-radius-")) {
        tokens[token] = "radius";
      } else if (token.includes("-font-") || token.includes("-typography-")) {
        tokens[token] = "typography";
      } else if (token.includes("-size-")) {
        tokens[token] = "size";
      } else {
        tokens[token] = "other";
      }
    }
  }

  // Extract variant class patterns: .component-variant-xxx, .component-size-xxx
  const lowerName = componentName.toLowerCase();
  const variantClassRegex = new RegExp(
    `\\.${lowerName}-(\\w+)-(\\w[\\w-]*)`,
    "g"
  );
  let variantClassMatch;

  while ((variantClassMatch = variantClassRegex.exec(source)) !== null) {
    const category = variantClassMatch[1]; // e.g., "variant", "size"
    const value = variantClassMatch[2]; // e.g., "primary", "small"

    if (!cssVariants[category]) {
      cssVariants[category] = [];
    }
    if (!cssVariants[category].includes(value)) {
      cssVariants[category].push(value);
    }
  }

  // Extract state selectors
  const states = [];
  const stateRegex = /\[data-([\w-]+)\]/g;
  let stateMatch;
  const seenStates = new Set();

  while ((stateMatch = stateRegex.exec(source)) !== null) {
    const state = stateMatch[1];
    if (!seenStates.has(state)) {
      seenStates.add(state);
      states.push(state);
    }
  }

  return { tokens, cssVariants, states };
}

/**
 * Extract Figma Code Connect mappings from a .figma.tsx file.
 * Looks for figma.enum(), figma.string(), figma.boolean(), figma.instance() calls.
 */
function extractFigmaConnect(source) {
  const figmaProps = {};

  // figma.enum("PropName", { FigmaValue: "codeValue", ... })
  const enumRegex =
    /figma\.enum\(\s*"([^"]+)"\s*,\s*\{([^}]*)\}\s*\)/gs;
  let enumMatch;

  while ((enumMatch = enumRegex.exec(source)) !== null) {
    const propName = enumMatch[1];
    const mappingsBlock = enumMatch[2];
    const mappings = {};

    const mappingRegex = /(\w+)\s*:\s*(?:"([^"]+)"|(\w+))/g;
    let mm;
    while ((mm = mappingRegex.exec(mappingsBlock)) !== null) {
      mappings[mm[1]] = mm[2] || mm[3];
    }

    figmaProps[propName] = {
      type: "enum",
      mappings,
    };
  }

  // figma.string("PropName")
  const stringRegex = /figma\.string\(\s*"([^"]+)"\s*\)/g;
  let stringMatch;
  while ((stringMatch = stringRegex.exec(source)) !== null) {
    figmaProps[stringMatch[1]] = { type: "string" };
  }

  // figma.boolean("PropName", ...)
  const boolRegex = /figma\.boolean\(\s*"([^"]+)"/g;
  let boolMatch;
  while ((boolMatch = boolRegex.exec(source)) !== null) {
    figmaProps[boolMatch[1]] = { type: "boolean" };
  }

  // figma.instance("PropName")
  const instanceRegex = /figma\.instance\(\s*"([^"]+)"\s*\)/g;
  let instanceMatch;
  while ((instanceMatch = instanceRegex.exec(source)) !== null) {
    figmaProps[instanceMatch[1]] = { type: "instance" };
  }

  // figma.children(["..."])
  const childrenRegex = /figma\.children\(\s*\[([^\]]*)\]\s*\)/g;
  let childrenMatch;
  while ((childrenMatch = childrenRegex.exec(source)) !== null) {
    figmaProps["_children"] = {
      type: "children",
      value: childrenMatch[1].replace(/"/g, "").split(",").map((s) => s.trim()),
    };
  }

  return figmaProps;
}

/**
 * Extract component description from JSDoc comments or the first export.
 */
function extractDescription(source, componentName) {
  // Look for JSDoc above the component
  const jsdocRegex = new RegExp(
    `/\\*\\*\\s*\\n([\\s\\S]*?)\\*/\\s*\\n\\s*(?:export|const|function)\\s+${componentName}`,
    "m"
  );
  const jsdocMatch = source.match(jsdocRegex);
  if (jsdocMatch) {
    return jsdocMatch[1]
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, "").trim())
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

/**
 * Determine component category from its characteristics.
 */
function categorize(componentName, props, cssTokens) {
  const name = componentName.toLowerCase();
  const formComponents = [
    "input", "checkbox", "radio", "select", "switch", "textarea", "slider", "search",
  ];
  const feedbackComponents = ["notification", "tooltip", "dialog"];
  const navigationComponents = ["navigation", "tab", "pagination", "menu", "link"];
  const dataDisplayComponents = [
    "tag", "badge", "avatar", "table", "text", "image", "icon", "logo",
  ];

  if (formComponents.includes(name)) return "forms";
  if (feedbackComponents.includes(name)) return "feedback";
  if (navigationComponents.includes(name)) return "navigation";
  if (dataDisplayComponents.includes(name)) return "data-display";
  if (["button", "iconbutton"].includes(name)) return "actions";
  if (["accordion", "listbox"].includes(name)) return "disclosure";
  if (["fieldset"].includes(name)) return "layout";
  return "general";
}

/**
 * Extract imported component names to determine related components.
 */
function extractRelated(source) {
  const related = [];
  const importRegex = /import\s+{([^}]+)}\s+from\s+["']\.\.\/(\w+)/g;
  let importMatch;
  while ((importMatch = importRegex.exec(source)) !== null) {
    related.push(importMatch[2]);
  }
  return [...new Set(related)];
}

// ── Main Extraction ──

console.log("🔍 Scanning components...\n");

const componentDirs = fs
  .readdirSync(primitivesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

console.log(`Found ${componentDirs.length} component directories.\n`);

const results = [];
let propsExtracted = 0;
let tokensExtracted = 0;
let figmaMatches = 0;

for (const dirName of componentDirs) {
  const componentDir = path.join(primitivesDir, dirName);

  // Find the main .tsx file (PascalCase name)
  const tsxFiles = fs
    .readdirSync(componentDir)
    .filter((f) => f.endsWith(".tsx") && !f.includes(".test.") && !f.includes(".stories."));

  const mainTsx = tsxFiles.find((f) => f === `${dirName}.tsx`) || tsxFiles[0];
  if (!mainTsx) {
    console.log(`  ⚠️  ${dirName}: No .tsx file found, skipping.`);
    continue;
  }

  const tsxSource = readFileOrNull(path.join(componentDir, mainTsx));
  if (!tsxSource) {
    console.log(`  ⚠️  ${dirName}: Could not read ${mainTsx}, skipping.`);
    continue;
  }

  // Find CSS file
  const cssFiles = fs
    .readdirSync(componentDir)
    .filter((f) => f.endsWith(".css"));
  const cssFile = cssFiles[0];
  const cssSource = cssFile
    ? readFileOrNull(path.join(componentDir, cssFile))
    : null;

  // Find Figma Code Connect file
  const figmaFile = fs.existsSync(figmaDir)
    ? fs
        .readdirSync(figmaDir)
        .find(
          (f) =>
            f.toLowerCase().startsWith(dirName.toLowerCase()) &&
            f.endsWith(".figma.tsx")
        )
    : null;
  const figmaSource = figmaFile
    ? readFileOrNull(path.join(figmaDir, figmaFile))
    : null;

  // Extract data
  const { properties, variants: tsVariants } = extractProps(tsxSource, dirName);
  const cssData = cssSource ? extractCss(cssSource, dirName) : { tokens: {}, cssVariants: {}, states: [] };
  const figmaProps = figmaSource ? extractFigmaConnect(figmaSource) : {};
  const description = extractDescription(tsxSource, dirName);
  const related = extractRelated(tsxSource);

  // Merge variants from TS and CSS
  const mergedVariants = { ...tsVariants };
  for (const [cat, vals] of Object.entries(cssData.cssVariants)) {
    if (!mergedVariants[cat]) {
      mergedVariants[cat] = vals;
    } else {
      // Add any CSS variants not already in TS variants
      for (const v of vals) {
        if (!mergedVariants[cat].includes(v)) {
          mergedVariants[cat].push(v);
        }
      }
    }
  }

  // Build token map (simplified)
  const tokenMap = {};
  for (const [token, category] of Object.entries(cssData.tokens)) {
    tokenMap[token] = category;
  }

  // Merge Figma enum values into variants
  for (const [figmaProp, figmaData] of Object.entries(figmaProps)) {
    if (figmaData.type === "enum" && figmaData.mappings) {
      const codeValues = Object.values(figmaData.mappings).filter(
        (v) => typeof v === "string"
      );
      const propNameLower = figmaProp.toLowerCase();
      if (!mergedVariants[propNameLower] && codeValues.length > 0) {
        mergedVariants[propNameLower] = codeValues;
      }
    }
  }

  // Build the ComponentEntry
  const entry = {
    id: dirName.toLowerCase(),
    name: dirName,
    description: description || `${dirName} component from the Simple Design System.`,
    category: categorize(dirName, properties, cssData.tokens),
    variants: mergedVariants,
    properties,
    tokens: tokenMap,
    accessibility: {
      role: "PLACEHOLDER — fill in the correct ARIA role",
      min_touch_target: "PLACEHOLDER — specify if applicable",
      contrast_ratio: "PLACEHOLDER — specify requirements",
      focus_indicator: "PLACEHOLDER — describe focus style",
      aria_label: "PLACEHOLDER — describe labeling requirements",
      keyboard: "PLACEHOLDER — describe keyboard interactions",
    },
    usage: {
      do: ["PLACEHOLDER — add usage guidelines"],
      dont: ["PLACEHOLDER — add anti-patterns"],
    },
    related_components: related,
    _metadata: {
      css_states: cssData.states,
      figma_props: Object.keys(figmaProps).length > 0 ? figmaProps : undefined,
      source_files: {
        tsx: mainTsx,
        css: cssFile || null,
        figma: figmaFile || null,
      },
    },
  };

  results.push(entry);

  const propCount = Object.keys(properties).length;
  const tokenCount = Object.keys(tokenMap).length;
  const hasFigma = Object.keys(figmaProps).length > 0;

  propsExtracted += propCount;
  tokensExtracted += tokenCount;
  if (hasFigma) figmaMatches++;

  console.log(
    `  ✅ ${dirName.padEnd(16)} ${String(propCount).padStart(2)} props  ${String(tokenCount).padStart(3)} tokens  ${
      Object.keys(mergedVariants).length
    } variant groups  ${hasFigma ? "🎨 Figma" : ""}`
  );
}

// ── Write Output ──

const outputPath = path.join(
  __dirname,
  "..",
  "src",
  "knowledge",
  "components-extracted.json"
);

fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

console.log(`\n${"─".repeat(60)}`);
console.log(`\n📊 Extraction Summary:`);
console.log(`   Components found:      ${results.length}`);
console.log(`   Properties extracted:   ${propsExtracted}`);
console.log(`   CSS tokens referenced:  ${tokensExtracted}`);
console.log(`   Figma Code Connect:     ${figmaMatches} components matched`);
console.log(`\n📝 Output written to: ${outputPath}`);
console.log(`\n⚠️  IMPORTANT: The extracted data needs manual review!`);
console.log(`   - accessibility: fields are PLACEHOLDERS — fill in ARIA roles, keyboard behavior, etc.`);
console.log(`   - usage.do / usage.dont: are PLACEHOLDERS — add real guidelines.`);
console.log(`   - descriptions: may be empty — add meaningful component descriptions.`);
console.log(`   - _metadata: is for reference only and can be removed from the final KB.\n`);
