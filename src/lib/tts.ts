import { supabase } from './supabase';

let activeAudio: HTMLAudioElement | null = null;
let activeRequestId = 0;

export async function speakWithChildVoice(text: string) {
  const requestId = activeRequestId + 1;
  activeRequestId = requestId;
  activeAudio?.pause();
  activeAudio = null;

  const { data, error } = await supabase.functions.invoke('tts', {
    body: { text },
  });
  if (error) throw new Error(error.message);

  const audio = readAudio(data);
  if (!audio) throw new Error('TTS returned no audio.');
  if (requestId !== activeRequestId) return;

  const nextAudio = new Audio(`data:audio/mpeg;base64,${audio}`);
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
