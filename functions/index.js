/**
 * @fileoverview This file contains the Cloud Functions for the application.
 */
const { onUserCreate } = require("firebase-functions/v2/auth");
const { getFirestore, serverTimestamp } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Triggered when a new user is created in Firebase Authentication.
 * This function creates a corresponding user document in Firestore.
 */
exports.createUserDocument = onUserCreate(async (event) => {
  const user = event.data; // The user record created
  const { uid, email, displayName, photoURL } = user;

  const userRef = db.collection("users").doc(uid);

  try {
    await userRef.set({
      uid,
      email: email || null,
      displayName: displayName || email?.split('@')[0] || "Anonymous User",
      photoURL: photoURL || null,
      createdAt: serverTimestamp(),
      isPremium: false,
      preferredPersona: "neutral",
      favoritePrompts: [],
      usage: {
        summaries: 0,
        quizzes: 0,
        flashcardSets: 0,
        studyPlans: 0,
        memoryAids: 0,
        uploads: 0,
      }
    });
    console.log(`Successfully created user document for UID: ${uid}`);
  } catch (error) {
    console.error(`Error creating user document for UID: ${uid}`, error);
  }
});

exports.scheduled = require('./src/scheduled');
