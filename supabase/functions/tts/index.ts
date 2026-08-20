const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const CHILD_VOICE_ID = Deno.env.get('ELEVENLABS_CHILD_VOICE_ID') ?? 'KGm9JQce2gqC2w6y4q3p';
const SCHOOL_VOICE_ID = Deno.env.get('ELEVENLABS_SCHOOL_VOICE_ID') ?? CHILD_VOICE_ID;
const ADULT_VOICE_ID = Deno.env.get('ELEVENLABS_ADULT_VOICE_ID') ?? CHILD_VOICE_ID;
const TEEN_VOICE_ID = Deno.env.get('ELEVENLABS_TEEN_VOICE_ID') ?? ADULT_VOICE_ID;
const SCHOOL_MALE_VOICE_ID = Deno.env.get('ELEVENLABS_SCHOOL_MALE_VOICE_ID') ?? TEEN_VOICE_ID;
const CHILD_FEMALE_VOICE_ID = Deno.env.get('ELEVENLABS_CHILD_FEMALE_VOICE_ID') ?? CHILD_VOICE_ID;
const SCHOOL_FEMALE_VOICE_ID = Deno.env.get('ELEVENLABS_SCHOOL_FEMALE_VOICE_ID') ?? SCHOOL_VOICE_ID;
const TEEN_FEMALE_VOICE_ID = Deno.env.get('ELEVENLABS_TEEN_FEMALE_VOICE_ID') ?? TEEN_VOICE_ID;
const KAZAKH_VOICE_ID =
  Deno.env.get('ELEVENLABS_PAP_VOICE_ID') ??
  Deno.env.get('ELEVENLABS_KAZAKH_VOICE_ID') ??
  'eCXtdAm4Y1qWFZvJePPF';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use a POST request.' }, 405);

  try {
    if (!ELEVENLABS_API_KEY) return json({ error: 'ElevenLabs key is not configured.' }, 503);

    const body = (await req.json()) as { text?: unknown; voice?: unknown; lang?: unknown };
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const voiceId = voiceIdFor(body.voice, body.lang);
    if (!text) return json({ error: 'Text is required.' }, 400);
    if (text.length > 2_000) return json({ error: 'Text is too long.' }, 400);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: voiceSettingsFor(body.lang),
        }),
      },
    );

    if (!response.ok) {
      console.error('ElevenLabs request failed', response.status, await response.text());
      return json({ error: 'Could not generate speech.' }, 502);
    }

    return json({ audio: base64(await response.arrayBuffer()) });
  } catch (error) {
    console.error('TTS function failed', error);
    return json({ error: 'Could not generate speech.' }, 500);
  }
});

function voiceIdFor(voice: unknown, lang: unknown) {
  if (lang === 'kk') return KAZAKH_VOICE_ID;
  if (voice === 'adult') return TEEN_VOICE_ID;
  if (voice === 'child_female') return CHILD_FEMALE_VOICE_ID;
  if (voice === 'school_female') return SCHOOL_FEMALE_VOICE_ID;
  if (voice === 'teen_female') return TEEN_FEMALE_VOICE_ID;
  if (voice === 'school') return SCHOOL_MALE_VOICE_ID;
  if (voice === 'teen') return TEEN_VOICE_ID;
  return CHILD_VOICE_ID;
}

function voiceSettingsFor(lang: unknown) {
  if (lang === 'kk') {
    return {
      stability: 0.34,
      similarity_boost: 0.9,
      style: 0.58,
      use_speaker_boost: true,
    };
  }

  return {
    stability: 0.38,
    similarity_boost: 0.86,
    style: 0.48,
    use_speaker_boost: true,
  };
}

function base64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}
