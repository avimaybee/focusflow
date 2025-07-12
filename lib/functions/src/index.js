"use server";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = void 0;
const https_1 = require("firebase-functions/v2/https");
const chat_flow_1 = require("../../src/ai/flows/chat-flow");
exports.chat = (0, https_1.onCallGenkit)({
    authPolicy: (auth) => !!auth,
}, chat_flow_1.chat);
//# sourceMappingURL=index.js.map