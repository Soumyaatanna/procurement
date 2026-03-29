/**
 * Firebase Configuration Re-export
 * Ensures single initialization by importing from main firebase.ts
 */

export { db, auth } from '../firebase';
import { getApp } from 'firebase/app';
import { getAI } from 'firebase/ai';
import { GoogleAIBackend } from 'firebase/ai';

// Get the existing initialized app from firebase.ts
const app = getApp();

// Export AI instance
export const ai = getAI(app, { backend: new GoogleAIBackend() });
