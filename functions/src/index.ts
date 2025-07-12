"use server";

import {onCallGenkit} from "firebase-functions/v2/https";
import {chatFlow} from "../../src/ai/flows/chat-flow";

// This will be deployed as a callable function named 'chat'.
export const chat = onCallGenkit(
  {
    // You can configure auth policies here.
    // For example, to require authentication:
    // authPolicy: (auth) => !!auth,
  },
  chatFlow
);
