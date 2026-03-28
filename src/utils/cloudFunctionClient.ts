/**
 * Firebase Cloud Function Client
 * Helper utilities to call Cloud Functions securely from the client
 */

const FUNCTION_BASE_URL = import.meta.env.VITE_FUNCTIONS_URL || 
  'http://localhost:5001/aura-news-13e0a/us-central1';

export const callCloudFunction = async <T>(
  functionName: string,
  data: any
): Promise<T> => {
  const url = `${FUNCTION_BASE_URL}/${functionName}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Cloud Function ${functionName} failed`);
  }

  return response.json() as Promise<T>;
};

// Specific function callers
export const callGenerateBriefing = (persona: string, topic: string) =>
  callCloudFunction<{ briefing: string; sources: Array<{ title: string; url: string }> }>(
    'generateBriefing',
    { persona, topic }
  );

export const callGenerateFeed = (persona: string, interests: string[]) =>
  callCloudFunction<{ feed: string[] }>(
    'generateFeed',
    { persona, interests }
  );

export const callTranslateNews = (text: string, targetLanguage: string) =>
  callCloudFunction<{ translation: string }>(
    'translateNews',
    { text, targetLanguage }
  );

export const callGetEntityDetails = (entity: string) =>
  callCloudFunction<{ text: string; sources: Array<{ title: string; url: string }> }>(
    'getEntityDetails',
    { entity }
  );
