import { db } from '../src/lib/firebase-admin';

async function migrateUsers() {
  console.log('Starting user migration...');
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('No users found to migrate.');
    return;
  }

  const batch = db.batch();
  let migratedCount = 0;

  snapshot.forEach(doc => {
    const userData = doc.data();
    const userRef = usersRef.doc(doc.id);
    let needsUpdate = false;

    const updates: { [key: string]: any } = {};

    if (userData.streakCount === undefined) {
      updates.streakCount = 0;
      needsUpdate = true;
    }
    if (userData.lastStudyDate === undefined) {
      updates.lastStudyDate = null; // or a default timestamp
      needsUpdate = true;
    }
    if (userData.achievements === undefined) {
      updates.achievements = [];
      needsUpdate = true;
    }
    if (userData.studyTime === undefined) {
      updates.studyTime = {};
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(userRef, updates);
      migratedCount++;
    }
  });

  if (migratedCount > 0) {
    await batch.commit();
    console.log(`Successfully migrated ${migratedCount} users.`);
  } else {
    console.log('All users are already up-to-date.');
  }
}

migrateUsers().catch(console.error);
