"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
// Load component knowledge base
const componentDataPath = (0, path_1.join)(__dirname, "..", "data", "sds-components.json");
const componentData = JSON.parse((0, fs_1.readFileSync)(componentDataPath, "utf-8"));
// Load system prompt template
const promptTemplatePath = (0, path_1.join)(__dirname, "..", "data", "system-prompt-template.md");
const promptTemplate = (0, fs_1.readFileSync)(promptTemplatePath, "utf-8");
// Build the system prompt by injecting component data
const systemPrompt = promptTemplate.replace("{{COMPONENT_DATA}}", JSON.stringify(componentData, null, 2));
// Initialize Anthropic client
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
function buildComponentKeyMap(data) {
    const map = new Map();
    // Primitives
    if (data.primitives) {
        for (const [name, comp] of Object.entries(data.primitives)) {
            map.set(name.toLowerCase(), {
                componentKey: comp.componentKey,
                figmaNode: comp.figmaNode,
                variantKeys: comp.variantKeys,
            });
            // Related components
            if (comp.relatedComponents) {
                for (const [relName, relComp] of Object.entries(comp.relatedComponents)) {
                    map.set(relName.toLowerCase(), {
                        componentKey: relComp.componentKey,
                        figmaNode: relComp.figmaNode,
                    });
                }
            }
            // Subcomponents (if object map)
            if (comp.subcomponents && typeof comp.subcomponents === "object" && !Array.isArray(comp.subcomponents)) {
                for (const [subName, subComp] of Object.entries(comp.subcomponents)) {
                    if (subComp.componentKey) {
                        map.set(subName.toLowerCase(), {
                            componentKey: subComp.componentKey,
                            figmaNode: subComp.figmaNode,
                        });
                    }
                }
            }
            // Text variants
            if (comp.variants && typeof comp.variants === "object") {
                for (const [varName, varComp] of Object.entries(comp.variants)) {
                    if (typeof varComp === "object" && varComp.componentKey) {
                        map.set(varName.toLowerCase(), {
                            componentKey: varComp.componentKey,
                            figmaNode: varComp.figmaNode,
                        });
                    }
                }
            }
        }
    }
    // Compositions
    if (data.compositions) {
        for (const category of Object.values(data.compositions)) {
            for (const [name, comp] of Object.entries(category)) {
                map.set(name.toLowerCase(), {
                    componentKey: comp.componentKey,
                    figmaNode: comp.figmaNode,
                });
            }
        }
    }
    return map;
}
const componentKeyMap = buildComponentKeyMap(componentData);
// Detect component mentions in Claude's response and attach a placement action
function detectComponentAction(text) {
    // Sort by name length descending so longer names match first (e.g., "ButtonDanger" before "Button")
    const sortedEntries = Array.from(componentKeyMap.entries()).sort((a, b) => b[0].length - a[0].length);
    for (const [name, entry] of sortedEntries) {
        // Skip placeholder keys
        if (entry.componentKey === "YOUR_KEY_HERE")
            continue;
        // Case-insensitive word boundary match
        const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, "i");
        if (regex.test(text)) {
            // Try to detect variant from context
            const variant = detectVariant(text, name);
            // Use variant-specific key if available
            let componentKey = entry.componentKey;
            if (variant && entry.variantKeys) {
                const variantKey = entry.variantKeys[variant.toLowerCase()];
                if (variantKey) {
                    componentKey = variantKey;
                }
            }
            return {
                type: "place_component",
                componentName: name,
                componentKey,
                variant,
            };
        }
    }
    return null;
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function detectVariant(text, componentName) {
    // Case-insensitive lookup in primitives
    const lowerName = componentName.toLowerCase();
    const comp = Object.entries(componentData.primitives || {}).find(([key]) => key.toLowerCase() === lowerName)?.[1];
    if (!comp)
        return null;
    const variants = comp.variants;
    if (!variants || typeof variants !== "object")
        return null;
    const lowerText = text.toLowerCase();
    const variantNames = Object.keys(variants);
    // First: look for explicit "variant: X" or "(variant: X)" pattern in the response
    for (const variantName of variantNames) {
        const pattern = new RegExp(`variant[:\\s]+${escapeRegex(variantName.toLowerCase())}`, "i");
        if (pattern.test(lowerText)) {
            return variantName;
        }
    }
    // Fallback: scan for variant name mentions in the text
    for (const variantName of variantNames) {
        // Use word boundary to avoid partial matches
        const pattern = new RegExp(`\\b${escapeRegex(variantName.toLowerCase())}\\b`, "i");
        if (pattern.test(lowerText)) {
            return variantName;
        }
    }
    return null;
}
// POST /api/chat
app.post("/api/chat", async (req, res) => {
    try {
        const { message, history = [], context } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        // Build context string if Figma selection is provided
        let contextString = "";
        if (context && context.nodeName) {
            contextString = `\n\n[Figma Selection Context]\nSelected element: "${context.nodeName}" (${context.nodeType || "unknown type"}), dimensions: ${context.width || "?"}×${context.height || "?"}px`;
        }
        // Build conversation messages
        const messages = [
            ...history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            {
                role: "user",
                content: message + contextString,
            },
        ];
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 1024,
            system: systemPrompt,
            messages,
        });
        // Extract text from response
        const responseText = response.content[0].type === "text" ? response.content[0].text : "";
        // Check if Claude responded with JSON (placement confirmation)
        try {
            const parsed = JSON.parse(responseText.trim());
            if (parsed.response && parsed.action) {
                return res.json({
                    response: parsed.response,
                    action: parsed.action,
                });
            }
        }
        catch {
            // Not JSON — proceed with text response and auto-detection
        }
        // Auto-detect component action from the text response
        const action = detectComponentAction(responseText);
        return res.json({
            response: responseText,
            ...(action && { action }),
        });
    }
    catch (error) {
        console.error("Chat API error:", error);
        return res.status(500).json({
            error: "Failed to process chat message",
            details: error.message,
        });
    }
});
// POST /api/analyze-frame
app.post("/api/analyze-frame", async (req, res) => {
    try {
        const { frameData } = req.body;
        if (!frameData) {
            return res.status(400).json({ error: "Frame data is required" });
        }
        const analysisPrompt = `You are a design system auditor analyzing a Figma frame for compliance with the Simple Design System (SDS).

Analyze this frame data and provide a structured compliance report:

Frame data:
${JSON.stringify(frameData, null, 2)}

Check for:
1. **Spacing violations** - Should use 4px, 8px, 12px, 16px, 24px, 32px, 48px tokens
2. **Color violations** - Should use SDS color tokens (check fills against design system)
3. **Typography violations** - Should use DM Sans with defined sizes (12px, 14px, 16px, 18px, 20px, 24px, 32px)
4. **Component usage** - Are SDS components used correctly? Are there custom components that should use SDS?
5. **Hierarchy issues** - Proper nesting, spacing, and structure

Provide your analysis in this format:

## Overall Compliance: [X/5] ⭐

## Violations Found

### ❌ Critical Issues
- List critical violations (e.g., incorrect components, missing accessibility)

### ⚠️ Warnings
- List warnings (e.g., non-standard spacing, minor color issues)

### ℹ️ Suggestions
- List improvement suggestions

## Summary
[Brief summary of the frame's compliance and key recommendations]

Be specific - reference actual values from the frame data (colors, spacing, font sizes, component names).`;
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 2048,
            messages: [{ role: "user", content: analysisPrompt }],
        });
        const analysis = response.content[0].type === "text" ? response.content[0].text : "";
        res.json({ analysis });
    }
    catch (error) {
        console.error("Analyze frame API error:", error);
        res.status(500).json({
            error: "Failed to analyze frame",
            details: error.message,
        });
    }
});
// GET /health
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        components: componentKeyMap.size,
    });
});
app.listen(PORT, () => {
    console.log(`System Sidekick API running on http://localhost:${PORT}`);
    console.log(`Component knowledge base loaded: ${componentKeyMap.size} components`);
});
