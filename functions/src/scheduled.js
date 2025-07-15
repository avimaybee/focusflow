const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore();

exports.resetMonthlyUsage = onSchedule("0 0 1 * *", async (event) => {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("isPremium", "==", false).get();

    if (snapshot.empty) {
        console.log("No free users to reset.");
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        const userRef = usersRef.doc(doc.id);
        batch.update(userRef, {
            "usage.summaries": 0,
            "usage.quizzes": 0,
            "usage.flashcardSets": 0,
            "usage.studyPlans": 0,
            "usage.memoryAids": 0,
            "usage.uploads": 0,
        });
    });

    await batch.commit();
    console.log(`Reset usage for ${snapshot.size} free users.`);
});
