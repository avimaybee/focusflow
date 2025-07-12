"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
const beta_1 = require("genkit/beta");
const googleai_1 = require("@genkit-ai/googleai");
exports.ai = (0, beta_1.genkit)({
    plugins: [(0, googleai_1.googleAI)()],
    // We set a default model here for general-purpose tasks and as a fallback.
    model: 'googleai/gemini-1.5-flash',
});
//# sourceMappingURL=genkit.js.map