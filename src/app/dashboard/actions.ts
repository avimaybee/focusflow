
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';

export interface DashboardStats {
    hoursStudied: number;
    summariesMade: number;
    quizzesTaken: number;
    studyStreak: number;
    weeklyActivity: { subject: string; goal: number; logged: number }[];
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
    
    const sessionsRef = collection(db, 'users', userId, 'studySessions');

    // Get hours studied in last 7 days
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
    
    const goalsBySubject: { [key: string]: number } = {};
    goalsSnapshot.docs.forEach(doc => {
        const goal = doc.data();
        goalsBySubject[goal.subject] = goal.weeklyGoalHours;
    });

    const sessionsBySubject: { [key: string]: number } = {};
    weeklySessionsSnapshot.docs.forEach(doc => {
        const session = doc.data();
        const subject = session.subject;
        const duration = session.durationMinutes / 60;
        sessionsBySubject[subject] = (sessionsBySubject[subject] || 0) + duration;
    });

    const allSubjects = new Set([
        ...Object.keys(goalsBySubject),
        ...Object.keys(sessionsBySubject)
    ]);

    const weeklyActivity = Array.from(allSubjects).map(subject => {
        return {
            subject,
            goal: goalsBySubject[subject] || 0,
            logged: Math.round((sessionsBySubject[subject] || 0) * 10) / 10,
        };
    });

    // Calculate study streak
    const allSessionsQuery = query(sessionsRef, orderBy('date', 'desc'));
    const allSessionsSnapshot = await getDocs(allSessionsQuery);

    const studyDays = new Set<string>();
    allSessionsSnapshot.forEach(doc => {
        const sessionDate = (doc.data().date as Timestamp).toDate();
        studyDays.add(sessionDate.toISOString().split('T')[0]);
    });

    let streak = 0;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Streak can only be active if user studied today or yesterday
    if (studyDays.has(formatDate(today)) || studyDays.has(formatDate(yesterday))) {
        let currentDate = new Date();
        // If they didn't study today, start counting from yesterday
        if (!studyDays.has(formatDate(currentDate))) {
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        while (studyDays.has(formatDate(currentDate))) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
    }
    
    return {
        hoursStudied: Math.round(hoursStudied * 10) / 10,
        summariesMade,
        quizzesTaken,
        studyStreak: streak,
        weeklyActivity,
    };
}
