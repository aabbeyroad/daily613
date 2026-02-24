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

export const getUserData = async (userId: string): Promise<{ data: UserData; isNew: boolean }> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { data: docSnap.data() as UserData, isNew: false };
  }
  return { data: defaultData, isNew: true };
};

const MAX_RETRIES = 3;

export const saveUserData = async (userId: string, data: Partial<UserData>): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return;
    } catch (error) {
      lastError = error;
      console.error(`Error saving user data (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
};
