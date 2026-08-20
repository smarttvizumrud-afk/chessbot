import { supabase } from './supabase';
import type { Lang } from './types';

let activeAudio: HTMLAudioElement | null = null;
let activeRequestId = 0;
const silentAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

export type ElevenLabsVoice =
  | 'child'
  | 'school'
  | 'teen'
  | 'adult'
  | 'child_female'
  | 'school_female'
  | 'teen_female';

export class TtsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TtsError';
  }
}

export function createSpeechAudio() {
  const audio = new Audio(silentAudio);
  audio.preload = 'auto';
  activeAudio?.pause();
  activeAudio = audio;
  void audio.play().catch(() => undefined);
  return audio;
}

export async function speakWithElevenLabsVoice(
  text: string,
  voice: ElevenLabsVoice,
  lang: Lang,
  preparedAudio?: HTMLAudioElement,
) {
  const requestId = activeRequestId + 1;
  activeRequestId = requestId;
  if (activeAudio && activeAudio !== preparedAudio) activeAudio.pause();
  activeAudio = null;

  const { data, error } = await supabase.functions.invoke('tts', {
    body: { text, voice, lang },
  });
  if (error) throw new Error(error.message);
  const responseError = readError(data);
  if (responseError) throw new TtsError(responseError);

  const audio = readAudio(data);
  if (!audio) throw new Error('TTS returned no audio.');
  if (requestId !== activeRequestId) return;

  const nextAudio = preparedAudio ?? new Audio();
  nextAudio.src = `data:audio/mpeg;base64,${audio}`;
  activeAudio = nextAudio;
  await playOnce(nextAudio);
  if (activeAudio === nextAudio) activeAudio = null;
}

function playOnce(audio: HTMLAudioElement) {
  return new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onpause = () => resolve();
    audio.onerror = () => reject(new Error('Could not play TTS audio.'));
    audio.play().catch(reject);
  });
}

function readAudio(data: unknown) {
  if (!data || typeof data !== 'object') return '';
  const value = (data as { audio?: unknown }).audio;
  return typeof value === 'string' ? value : '';
}

function readError(data: unknown) {
  if (!data || typeof data !== 'object') return '';
  const value = (data as { error?: unknown }).error;
  return typeof value === 'string' ? value : '';
}
