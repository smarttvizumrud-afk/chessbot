import { createSpeechAudio, speakWithElevenLabsVoice, TtsError, type ElevenLabsVoice } from './tts';
import type { Lang } from './types';
import type { Gender, InterfaceMode } from './userOnboarding';

let childVoiceUnavailableUntil = 0;

export function canSpeak() {
  return typeof window !== 'undefined' && 'Audio' in window;
}

export function createCoachSpeechAudio() {
  return canSpeak() ? createSpeechAudio() : undefined;
}

export async function speakCoachText(
  text: string,
  interfaceMode: InterfaceMode,
  gender: Gender,
  lang: Lang,
  preparedAudio?: HTMLAudioElement,
) {
  if (!canSpeak()) return 'unavailable';
  const cleanText = prepareSpeechText(text);
  const voice = elevenLabsVoice(interfaceMode, gender);

  if (voice === 'child' || voice === 'child_female') {
    if (Date.now() >= childVoiceUnavailableUntil) {
      try {
        await speakWithElevenLabsVoice(cleanText, voice, lang, preparedAudio);
        return 'elevenlabs';
      } catch (error) {
        childVoiceUnavailableUntil = Date.now() + 5 * 60 * 1_000;
        console.warn('Could not use child ElevenLabs voice.', error);
      }
    }
    return 'elevenlabs-unavailable';
  }

  await speakWithElevenLabsVoice(cleanText, voice, lang, preparedAudio);
  return 'elevenlabs';
}

function elevenLabsVoice(interfaceMode: InterfaceMode, gender: Gender): ElevenLabsVoice {
  const female = gender === 'female';
  if (interfaceMode === 'child') return female ? 'child_female' : 'child';
  if (interfaceMode === 'preschool') return female ? 'school_female' : 'school';
  return female ? 'teen_female' : 'teen';
}

function prepareSpeechText(text: string) {
  return cleanSpeechText(text)
    .replace(/^[^:]{1,24}:\s*/, '')
    .replace(/\bAI\b/g, 'эй ай')
    .replace(/\bO-O-O\b/g, 'длинная рокировка')
    .replace(/\bO-O\b/g, 'короткая рокировка')
    .replace(/\b([KQRBN])x([a-h][1-8])\b/g, (_match, piece: string, square: string) => `${pieceNameForSpeech(piece)} бьет на ${square}`)
    .replace(/\b([KQRBN])([a-h][1-8])\b/g, (_match, piece: string, square: string) => `${pieceNameForSpeech(piece)} на ${square}`)
    .replace(/\b([a-h])x([a-h][1-8])\b/g, 'пешка бьет на $2')
    .replace(/\b([a-h][1-8])\b/g, 'поле $1')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSpeechText(text: string) {
  return text
    .replace(/[`*_#>]/g, '')
    .replace(/[•|]/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\bAI\b/g, 'эй ай')
    .replace(/[^\p{L}\p{N}\s.,!?;:()\-+/%]/gu, '')
    .trim();
}

function pieceNameForSpeech(piece: string) {
  if (piece === 'K') return 'король';
  if (piece === 'Q') return 'ферзь';
  if (piece === 'R') return 'ладья';
  if (piece === 'B') return 'слон';
  if (piece === 'N') return 'конь';
  return 'фигура';
}

export function speechErrorText(lang: Lang, error?: unknown) {
  const message = error instanceof TtsError ? error.message : '';
  if (lang === 'en') {
    if (message.includes('key is not configured')) return 'Voice is not configured yet. Run npm run tts:secret and npm run tts:deploy.';
    if (message.includes('generate speech')) return 'ElevenLabs could not generate audio. Check the key, voice ID, or account credits.';
    return 'Voice did not start. Try pressing Audio again.';
  }
  if (lang === 'kk') {
    if (message.includes('key is not configured')) return 'Dauys ali qosylmagan. npm run tts:secret jane npm run tts:deploy komandalaryn orynda.';
    if (message.includes('generate speech')) return 'ElevenLabs audio jasai almady. Kilt, voice ID nemese account creditin tekser.';
    return 'Dauys bastalmady. Audio batyrmasyn qaita basyp kor.';
  }
  if (message.includes('key is not configured')) return 'Озвучка ещё не подключена. Запусти npm run tts:secret и npm run tts:deploy.';
  if (message.includes('generate speech')) return 'ElevenLabs не смог создать аудио. Проверь ключ, voice ID или кредиты аккаунта.';
  return 'Голос не запустился. Нажми Audio ещё раз.';
}
