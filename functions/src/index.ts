"use server";

import {onCallGenkit} from "firebase-functions/v2/https";
import {chat as chatFlow} from "../../src/ai/flows/chat-flow";

export const chat = onCallGenkit({
  authPolicy: (auth) => !!auth,
}, chatFlow);
