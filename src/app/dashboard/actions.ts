'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface DashboardStats {
    hoursStudied: number;
    summariesMade: number;
    quizzesTaken: number;
    weeklyActivity: { subject: string; logged: number }[];
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    const dayOfWeek = now.getDay(); // Sunday - 0, Monday - 1, etc.
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek -1)); // Assuming week starts on Monday
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekTimestamp = Timestamp.fromDate(startOfWeek);
    
    // Get hours studied in last 7 days
    const sessionsRef = collection(db, 'users', userId, 'studySessions');
    const sessionsLast7DaysQuery = query(sessionsRef, where('date', '>=', sevenDaysAgoTimestamp));
    const sessionsSnapshot = await getDocs(sessionsLast7DaysQuery);
    const hoursStudied = sessionsSnapshot.docs.reduce((total, doc) => total + (doc.data().durationMinutes || 0), 0) / 60;

    // Get summaries made in last 7 days
    const summariesRef = collection(db, 'users', userId, 'summaries');
    const summariesQuery = query(summariesRef, where('createdAt', '>=', sevenDaysAgoTimestamp));
    const summariesSnapshot = await getDocs(summariesQuery);
    const summariesMade = summariesSnapshot.size;

    // Get quizzes created in last 7 days
    const quizzesRef = collection(db, 'users', userId, 'quizzes');
    const quizzesQuery = query(quizzesRef, where('createdAt', '>=', sevenDaysAgoTimestamp));
    const quizzesSnapshot = await getDocs(quizzesQuery);
    const quizzesTaken = quizzesSnapshot.size;

    // Get weekly activity for chart
    const goalsRef = collection(db, 'users', userId, 'goals');
    const goalsSnapshot = await getDocs(goalsRef);
    const weeklySessionsQuery = query(sessionsRef, where('date', '>=', startOfWeekTimestamp));
    const weeklySessionsSnapshot = await getDocs(weeklySessionsQuery);
    
    const sessionsBySubject: { [key: string]: number } = {};
    weeklySessionsSnapshot.docs.forEach(doc => {
        const session = doc.data();
        const subject = session.subject;
        const duration = session.durationMinutes / 60;
        sessionsBySubject[subject] = (sessionsBySubject[subject] || 0) + duration;
    });

    const allSubjects = new Set([
        ...goalsSnapshot.docs.map(doc => doc.data().subject),
        ...Object.keys(sessionsBySubject)
    ]);

    const weeklyActivity = Array.from(allSubjects).map(subject => {
        return {
            subject,
            logged: Math.round((sessionsBySubject[subject] || 0) * 10) / 10,
        };
    });
    
    return {
        hoursStudied: Math.round(hoursStudied * 10) / 10,
        summariesMade,
        quizzesTaken,
        weeklyActivity,
    };
}
