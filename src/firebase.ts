import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  getDocFromServer, 
  doc,
  initializeFirestore
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC8DDpp7rD4o4SieqWS9Po81T42XDtWygw",
  authDomain: "aura-9151f.firebaseapp.com",
  projectId: "aura-9151f",
  storageBucket: "aura-9151f.firebasestorage.app",
  messagingSenderId: "456299596747",
  appId: "1:456299596747:web:f065ab5a437e6a4b11c44e",
  measurementId: "G-9T5WMERZQ3"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Use initializeFirestore with experimentalForceLongPolling for better local reliability
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);

// --- Firestore Diagnostic Tools ---

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
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
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    // Attempt to fetch a non-existent document to test connectivity
    await getDocFromServer(doc(db, 'system', 'connection-test'));
    console.log("Firestore connection test successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore connection failed: The client is offline. Please check your Firebase configuration or network.");
    }
    // Other errors (like permission denied) are expected if the doc doesn't exist or rules are strict,
    // but they still confirm the backend was reached.
  }
}

testConnection();