'use server';

import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface TrackerData {
    subject: string;
    goal: number;
    logged: number;
}

async function processTrackerData(userId: string, goalDocs: any[]): Promise<TrackerData[]> {
    const sessionsRef = collection(db, 'users', userId, 'studySessions');

    const now = new Date();
    const dayOfWeek = now.getDay(); // Sunday - 0, Monday - 1, etc.
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekTimestamp = Timestamp.fromDate(startOfWeek);

    const sessionsQuery = query(sessionsRef, where('date', '>=', startOfWeekTimestamp));
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    const sessionsBySubject: { [key: string]: number } = {};

    sessionsSnapshot.docs.forEach(doc => {
        const session = doc.data();
        const subject = session.subject;
        const duration = session.durationMinutes / 60; // convert minutes to hours
        sessionsBySubject[subject] = (sessionsBySubject[subject] || 0) + duration;
    });

    const trackerData = goalDocs.map(doc => {
        const goal = doc.data();
        const subject = goal.subject;
        return {
            subject: subject,
            goal: goal.weeklyGoalHours,
            logged: sessionsBySubject[subject] || 0,
        };
    });

    return trackerData;
}


export async function getTrackerData(userId: string): Promise<TrackerData[]> {
    const goalsRef = collection(db, 'users', userId, 'goals');
    const goalsSnapshot = await getDocs(goalsRef);

    if (goalsSnapshot.empty) {
        // Add some default goals if none exist for a better first-time experience
        const defaultGoals = [
            { subject: 'Math', weeklyGoalHours: 10 },
            { subject: 'History', weeklyGoalHours: 8 },
            { subject: 'Biology', weeklyGoalHours: 12 },
        ];
        const newGoalDocs = [];
        for (const goal of defaultGoals) {
            const docRef = await addDoc(goalsRef, goal);
            // Create a mock doc structure for processTrackerData
            newGoalDocs.push({ id: docRef.id, data: () => goal });
        }
        return processTrackerData(userId, newGoalDocs);
    }
    
    return processTrackerData(userId, goalsSnapshot.docs);
}

export async function logStudySession(userId: string, formData: { subject: string; hours: number }) {
    if (!userId) throw new Error('User not authenticated');

    const sessionsRef = collection(db, 'users', userId, 'studySessions');
    await addDoc(sessionsRef, {
        subject: formData.subject,
        durationMinutes: formData.hours * 60,
        date: Timestamp.now(),
    });

    revalidatePath('/tracker');
    return { success: true };
}


export async function setOrUpdateGoal(userId: string, formData: { subject: string; goal: number }) {
    if (!userId) throw new Error('User not authenticated');
    
    const goalsRef = collection(db, 'users', userId, 'goals');
    const q = query(goalsRef, where('subject', '==', formData.subject));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        await addDoc(goalsRef, {
            subject: formData.subject,
            weeklyGoalHours: formData.goal,
        });
    } else {
        const goalDocRef = doc(db, 'users', userId, 'goals', querySnapshot.docs[0].id);
        await updateDoc(goalDocRef, {
            weeklyGoalHours: formData.goal,
        });
    }

    revalidatePath('/tracker');
    return { success: true };
}
