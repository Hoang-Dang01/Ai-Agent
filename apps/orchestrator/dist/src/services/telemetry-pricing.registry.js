"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTokensCost = calculateTokensCost;
// Versionable Pricing Registry mapping model names to rates per 1,000,000 tokens
const PRICING_REGISTRY = {
    "gemini-1.5-flash": {
        inputPerMillion: 0.075,
        outputPerMillion: 0.30,
    },
    "gemini-1.5-pro": {
        inputPerMillion: 1.25,
        outputPerMillion: 5.00,
    },
    "gemini-2.0-flash-exp": {
        inputPerMillion: 0.075,
        outputPerMillion: 0.30,
    },
    // Default fallback if model doesn't exist
    "default": {
        inputPerMillion: 0.075,
        outputPerMillion: 0.30,
    }
};
/**
 * Calculates model costs at write-time based on the Pricing Registry.
 */
function calculateTokensCost(modelName, inputTokens, outputTokens) {
    const model = modelName || "default";
    const input = inputTokens || 0;
    const output = outputTokens || 0;
    const config = PRICING_REGISTRY[model] || PRICING_REGISTRY["default"];
    const calculatedInputCostUsd = (input / 1000000) * config.inputPerMillion;
    const calculatedOutputCostUsd = (output / 1000000) * config.outputPerMillion;
    const estimatedCostUsd = calculatedInputCostUsd + calculatedOutputCostUsd;
    return {
        calculatedInputCostUsd: parseFloat(calculatedInputCostUsd.toFixed(8)),
        calculatedOutputCostUsd: parseFloat(calculatedOutputCostUsd.toFixed(8)),
        estimatedCostUsd: parseFloat(estimatedCostUsd.toFixed(8))
    };
}
