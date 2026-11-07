import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppData } from '../types';

// Initialize Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the exact database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection to Firestore on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, working with local cache.');
      return false;
    }
    // Non-fatal if test doc doesn't exist or is permission-blocked
    return true;
  }
}

// Authenticate via Google Sign-In (Popup is required in iframe environments)
export async function signInWithGooglePopup(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign out
export async function logout(): Promise<void> {
  await signOut(auth);
}

// Sync user profile document in Firestore
export async function syncUserProfile(user: User): Promise<void> {
  if (!user) return;
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save complete building data to Firestore
export async function saveBuildingDataToCloud(userId: string, data: AppData): Promise<void> {
  if (!userId) return;
  const path = `buildings/${userId}`;
  try {
    const buildingRef = doc(db, 'buildings', userId);
    await setDoc(buildingRef, {
      id: userId,
      ownerId: userId,
      settings: data.settings,
      apartments: data.apartments,
      cycles: data.cycles,
      activeCycleId: data.activeCycleId,
      version: data.version || 1,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Load building data once from Firestore
export async function loadBuildingDataFromCloud(userId: string): Promise<AppData | null> {
  if (!userId) return null;
  const path = `buildings/${userId}`;
  try {
    const buildingRef = doc(db, 'buildings', userId);
    const snap = await getDoc(buildingRef);
    if (snap.exists()) {
      const d = snap.data();
      return {
        settings: d.settings,
        apartments: d.apartments || [],
        cycles: d.cycles || [],
        activeCycleId: d.activeCycleId || (d.cycles?.[0]?.id ?? '2026-10'),
        version: d.version || 1,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Listen for live real-time updates from cloud
export function subscribeToBuildingData(
  userId: string,
  onData: (data: AppData) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) return () => {};
  const path = `buildings/${userId}`;

  return onSnapshot(
    doc(db, 'buildings', userId),
    (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        onData({
          settings: d.settings,
          apartments: d.apartments || [],
          cycles: d.cycles || [],
          activeCycleId: d.activeCycleId || (d.cycles?.[0]?.id ?? '2026-10'),
          version: d.version || 1,
        });
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
