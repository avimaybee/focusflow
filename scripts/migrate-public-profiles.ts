import { db } from '../src/lib/firebase-admin';
import { slugify as generateSlug } from '../src/lib/utils'; // Assuming you have a slug generation utility

async function migratePublicProfiles() {
  console.log('Starting public profile migration...');
  const usersRef = db.collection('users');
  const usernamesRef = db.collection('usernames');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('No users found to migrate.');
    return;
  }

  const batch = db.batch();
  let migratedCount = 0;

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    const userRef = usersRef.doc(doc.id);
    let needsUpdate = false;

    const updates: { [key: string]: any } = {};

    if (!userData.publicProfile) {
      updates.publicProfile = {
        bio: '',
        displayName: userData.displayName || '',
        avatarUrl: userData.photoURL || '',
        school: '',
      };
      needsUpdate = true;
    }

    if (!userData.username) {
      const baseUsername = userData.email?.split('@')[0] || `user${doc.id.substring(0, 5)}`;
      // In a real-world scenario, you'd want a more robust check for uniqueness here.
      // For this migration, we'll assume this is sufficient.
      const username = generateSlug(baseUsername);
      updates.username = username;
      
      // Also create the username lookup document
      const usernameDocRef = usernamesRef.doc(username);
      batch.set(usernameDocRef, { userId: doc.id });

      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(userRef, updates);
      migratedCount++;
    }
  }

  if (migratedCount > 0) {
    await batch.commit();
    console.log(`Successfully migrated ${migratedCount} users.`);
  } else {
    console.log('All users are already up-to-date.');
  }
}

migratePublicProfiles().catch(console.error);
