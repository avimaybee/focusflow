"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreSessionStore = void 0;
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("./firebase");
class FirestoreSessionStore {
    async get(sessionId) {
        const sessionRef = (0, firestore_1.doc)(firebase_1.db, 'sessions', sessionId);
        const sessionSnap = await (0, firestore_1.getDoc)(sessionRef);
        if (sessionSnap.exists()) {
            return sessionSnap.data();
        }
        return undefined;
    }
    async save(sessionId, sessionData) {
        const sessionRef = (0, firestore_1.doc)(firebase_1.db, 'sessions', sessionId);
        await (0, firestore_1.setDoc)(sessionRef, sessionData);
    }
}
exports.FirestoreSessionStore = FirestoreSessionStore;
//# sourceMappingURL=firestore-session-store.js.map