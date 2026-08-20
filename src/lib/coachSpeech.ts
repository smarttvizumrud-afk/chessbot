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
  const cleanText = prepareSpeechText(text, lang);
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

function prepareSpeechText(text: string, lang: Lang) {
  return cleanSpeechText(text)
    .replace(/^[^:]{1,24}:\s*/, '')
    .replace(/\bAI\b/g, aiText(lang))
    .replace(/\bO-O-O\b/g, castleText(lang, 'long'))
    .replace(/\bO-O\b/g, castleText(lang, 'short'))
    .replace(/\b([KQRBN])x([a-h][1-8])\b/g, (_match, piece: string, square: string) => captureText(lang, piece, square))
    .replace(/\b([KQRBN])([a-h][1-8])\b/g, (_match, piece: string, square: string) => moveText(lang, piece, square))
    .replace(/\b([a-h])x([a-h][1-8])\b/g, (_match, _file: string, square: string) => pawnCaptureText(lang, square))
    .replace(/\b([a-h][1-8])\b/g, (_match, square: string) => squareText(lang, square))
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

function aiText(lang: Lang) {
  if (lang === 'en') return 'A I';
  return 'эй ай';
}

function castleText(lang: Lang, side: 'short' | 'long') {
  if (lang === 'kk') return side === 'short' ? 'қысқа рокировка' : 'ұзын рокировка';
  if (lang === 'en') return side === 'short' ? 'short castle' : 'long castle';
  return side === 'short' ? 'короткая рокировка' : 'длинная рокировка';
}

function captureText(lang: Lang, piece: string, square: string) {
  if (lang === 'en') return `${pieceName(piece, lang)} takes on ${square}`;
  if (lang === 'kk') return `${pieceName(piece, lang)} ${square} шаршысында алады`;
  return `${pieceName(piece, lang)} бьет на ${square}`;
}

function moveText(lang: Lang, piece: string, square: string) {
  if (lang === 'en') return `${pieceName(piece, lang)} to ${square}`;
  if (lang === 'kk') return `${pieceName(piece, lang)} ${square} шаршысына жүреді`;
  return `${pieceName(piece, lang)} на ${square}`;
}

function pawnCaptureText(lang: Lang, square: string) {
  if (lang === 'en') return `pawn takes on ${square}`;
  if (lang === 'kk') return `пешка ${square} шаршысында алады`;
  return `пешка бьет на ${square}`;
}

function squareText(lang: Lang, square: string) {
  if (lang === 'en') return `square ${square}`;
  if (lang === 'kk') return `${square} шаршысы`;
  return `поле ${square}`;
}

function pieceName(piece: string, lang: Lang) {
  const names: Record<string, Record<Lang, string>> = {
    K: { ru: 'король', en: 'king', kk: 'король' },
    Q: { ru: 'ферзь', en: 'queen', kk: 'ферзі' },
    R: { ru: 'ладья', en: 'rook', kk: 'ладья' },
    B: { ru: 'слон', en: 'bishop', kk: 'піл' },
    N: { ru: 'конь', en: 'knight', kk: 'ат' },
  };
  return names[piece]?.[lang] ?? (lang === 'en' ? 'piece' : 'фигура');
}

export function speechErrorText(lang: Lang, error?: unknown) {
  const message = error instanceof TtsError ? error.message : '';
  if (lang === 'en') {
    if (message.includes('key is not configured')) return 'Voice is not configured yet. Run npm run tts:secret and npm run tts:deploy.';
    if (message.includes('generate speech')) return 'ElevenLabs could not generate audio. Check the key, voice ID, or account credits.';
    return 'Voice did not start. Try pressing Audio again.';
  }
  if (lang === 'kk') {
    if (message.includes('key is not configured')) return 'Дауыс әлі қосылмаған. npm run tts:secret және npm run tts:deploy командаларын орында.';
    if (message.includes('generate speech')) return 'ElevenLabs аудио жасай алмады. Кілтті, voice ID немесе аккаунт кредитін тексер.';
    return 'Дауыс басталмады. Audio батырмасын қайта басып көр.';
  }
  if (message.includes('key is not configured')) return 'Озвучка ещё не подключена. Запусти npm run tts:secret и npm run tts:deploy.';
  if (message.includes('generate speech')) return 'ElevenLabs не смог создать аудио. Проверь ключ, voice ID или кредиты аккаунта.';
  return 'Голос не запустился. Нажми Audio ещё раз.';
}
