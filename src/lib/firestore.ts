// ========================================
// Firestore 데이터 접근 레이어
// predecide_households/{id} - 가정 데이터 (부부 공유)
// predecide_users/{uid}     - 개인 프로필
// ========================================

import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { Household, UserProfile } from '../types';

// undefined 값 제거 (Firestore는 undefined를 허용하지 않음)
const removeUndefined = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined) as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) result[key] = removeUndefined(value);
    }
    return result as T;
  }
  return obj;
};

const MAX_RETRIES = 3;

const withRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

// ── 사용자 프로필 ──

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'predecide_users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const saveUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<void> => {
  await withRetry(() =>
    setDoc(doc(db, 'predecide_users', userId), removeUndefined(profile), { merge: true })
  );
};

// ── 가정 데이터 ──

export const getHousehold = async (householdId: string): Promise<Household | null> => {
  const snap = await getDoc(doc(db, 'predecide_households', householdId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Household) : null;
};

export const saveHousehold = async (household: Household): Promise<void> => {
  const { id, ...data } = household;
  await withRetry(() =>
    setDoc(doc(db, 'predecide_households', id), removeUndefined({
      ...data,
      updatedAt: new Date().toISOString(),
    }))
  );
};

// 초대 코드로 가정 찾기
export const findHouseholdByInviteCode = async (code: string): Promise<Household | null> => {
  const q = query(
    collection(db, 'predecide_households'),
    where('inviteCode', '==', code.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Household;
};
