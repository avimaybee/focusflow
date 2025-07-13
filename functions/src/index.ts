"use server";

import {onCallGenkit} from "firebase-functions/v2/https";
import {chatFlow} from "./chat-flow";
import * as admin from "firebase-admin";

admin.initializeApp();

// This will be deployed as a callable function named 'chat'.
export const chat = onCallGenkit(
  {
    // Require authentication for this function
    authPolicy: (auth) => !!auth,
  },
  chatFlow
);
