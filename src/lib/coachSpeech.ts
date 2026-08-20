import { speakWithElevenLabsVoice, type ElevenLabsVoice } from './tts';
import type { Gender, InterfaceMode } from './userOnboarding';

let childVoiceUnavailableUntil = 0;

export function canSpeak() {
  return typeof window !== 'undefined' && 'Audio' in window;
}

export async function speakCoachText(text: string, interfaceMode: InterfaceMode, gender: Gender) {
  if (!canSpeak()) return 'unavailable';
  const cleanText = cleanSpeechText(text);
  const voice = elevenLabsVoice(interfaceMode, gender);

  if (voice === 'child' || voice === 'child_female') {
    if (Date.now() >= childVoiceUnavailableUntil) {
      try {
        await speakWithElevenLabsVoice(cleanText, voice);
        return 'elevenlabs';
      } catch (error) {
        childVoiceUnavailableUntil = Date.now() + 5 * 60 * 1_000;
        console.warn('Could not use child ElevenLabs voice.', error);
      }
    }
    return 'elevenlabs-unavailable';
  }

  await speakWithElevenLabsVoice(cleanText, voice);
  return 'elevenlabs';
}

function elevenLabsVoice(interfaceMode: InterfaceMode, gender: Gender): ElevenLabsVoice {
  const female = gender === 'female';
  if (interfaceMode === 'child') return female ? 'child_female' : 'child';
  if (interfaceMode === 'preschool') return female ? 'school_female' : 'school';
  return female ? 'teen_female' : 'teen';
}

function cleanSpeechText(text: string) {
  return text
    .replace(/[`*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bAI\b/g, 'эй ай')
    .replace(/[^\p{L}\p{N}\s.,!?;:()\-+/%]/gu, '')
    .trim();
}
