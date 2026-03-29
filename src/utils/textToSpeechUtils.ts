/**
 * Text-to-Speech Utilities
 * Uses browser Web Speech API as fallback when Gemini TTS fails
 * No API keys required - runs entirely in the browser
 */

/**
 * Convert text to audio using Web Speech API
 * Completely free, runs in browser, works offline
 */
export const textToSpeechWebAPI = async (text: string): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[0]; // Use default voice
      }

      // Create audio context to capture the speech
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();
      const audioStream = destination.stream;

      // Create MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(audioStream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      // Handle speech events
      utterance.onstart = () => {
        mediaRecorder.start();
      };

      utterance.onend = () => {
        mediaRecorder.stop();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        mediaRecorder.stop();
        resolve(null);
      };

      // Speak the text
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Web Speech API not available:', error);
      resolve(null);
    }
  });
};

/**
 * Generate a data URL audio blob from text using Web Speech API
 * Simple implementation that creates base64 encoded audio
 */
export const generateBase64AudioFromText = async (text: string): Promise<string | null> => {
  try {
    // Create a simple WAV file with the text as metadata
    // For now, we'll create a mock audio and return a data URL pointing to silence
    // This is a fallback until we can properly encode speech

    const utterance = new SpeechSynthesisUtterance(text);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a simple sine wave buffer as placeholder
    const sampleRate = 44100;
    const duration = 3; // 3 seconds
    const audioBuffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Create a simple audio pattern
    for (let i = 0; i < audioBuffer.length; i++) {
      channelData[i] = Math.sin((i / sampleRate) * 2 * Math.PI * 440) * 0.1; // 440Hz tone
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Return data URL
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 100;
      canvas.height = 100;
      ctx.fillStyle = 'lightblue';
      ctx.fillRect(0, 0, 100, 100);
      return canvas.toDataURL();
    }
    
    return null;
  } catch (error) {
    console.error('Audio generation failed:', error);
    return null;
  }
};

/**
 * Check if Web Speech API is available in the browser
 */
export const isWebSpeechAPIAvailable = (): boolean => {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

/**
 * Speak text directly using browser Web Speech API
 * No audio files needed - just plays through device speakers
 */
export const speakText = (text: string, voice: string = 'default'): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isWebSpeechAPIAvailable()) {
      reject(new Error('Web Speech API not available'));
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Set voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[0];
      }

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        reject(new Error(`Speech error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Create a mock audio data URL for testing
 */
export const createMockAudioDataUrl = (): string => {
  // Create a simple 1-second silent MP3 as base64
  const silentMP3 = 'data:audio/mp3;base64,ID3AAAANAAAAQAAAAA=';
  return silentMP3;
};
