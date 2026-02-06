import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Routine, DailyRecord, Reflection, AppSettings } from '../types';

export interface UserData {
  routines: Routine[];
  records: DailyRecord[];
  reflections: Reflection[];
  keywords: string[];
  settings: AppSettings;
  updatedAt: string;
}

const defaultData: UserData = {
  routines: [],
  records: [],
  reflections: [],
  keywords: [],
  settings: { discordWebhookUrl: '', darkMode: false, username: '' },
  updatedAt: new Date().toISOString(),
};

export const getUserData = async (userId: string): Promise<UserData> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
    return defaultData;
  } catch (error) {
    console.error('Error loading user data:', error);
    return defaultData;
  }
};

export const saveUserData = async (userId: string, data: Partial<UserData>): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};
