import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { OperationType, FirestoreErrorInfo } from "./types";

// User's provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKgtDNEDXHRZ9boxOaE8dyDTn2te9fE84",
  authDomain: "school-website-manager.firebaseapp.com",
  projectId: "school-website-manager",
  storageBucket: "school-website-manager.firebasestorage.app",
  messagingSenderId: "1015808043463",
  appId: "1:1015808043463:web:a7c869aaec010e0d1a11e2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
