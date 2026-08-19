import { supabase } from './supabase';

let activeAudio: HTMLAudioElement | null = null;

export async function speakWithChildVoice(text: string) {
  activeAudio?.pause();
  activeAudio = null;

  const { data, error } = await supabase.functions.invoke('tts', {
    body: { text },
  });
  if (error) throw new Error(error.message);

  const audio = readAudio(data);
  if (!audio) throw new Error('TTS returned no audio.');

  activeAudio = new Audio(`data:audio/mpeg;base64,${audio}`);
  await activeAudio.play();
}

function readAudio(data: unknown) {
  if (!data || typeof data !== 'object') return '';
  const value = (data as { audio?: unknown }).audio;
  return typeof value === 'string' ? value : '';
}
