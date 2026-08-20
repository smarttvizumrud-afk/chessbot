import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const DEFAULT_CHILD_VOICE_ID = 'KGm9JQce2gqC2w6y4q3p';

function fail(message) {
  console.error(`TTS secret setup failed: ${message}`);
  process.exit(1);
}

function readValue(source, name) {
  const line = source
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith('#') && item.startsWith(`${name}=`));

  if (!line) return '';
  return line.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
}

let source;
try {
  source = await readFile('.env', 'utf8');
} catch {
  fail('.env is missing');
}

const apiKey = readValue(source, 'ELEVENLABS_API_KEY');
const voiceId = readValue(source, 'ELEVENLABS_CHILD_VOICE_ID') || DEFAULT_CHILD_VOICE_ID;
const schoolVoiceId = readValue(source, 'ELEVENLABS_SCHOOL_VOICE_ID') || voiceId;
const schoolMaleVoiceId = readValue(source, 'ELEVENLABS_SCHOOL_MALE_VOICE_ID') || voiceId;
const adultVoiceId = readValue(source, 'ELEVENLABS_ADULT_VOICE_ID') || voiceId;
const teenVoiceId = readValue(source, 'ELEVENLABS_TEEN_VOICE_ID') || adultVoiceId;
const childFemaleVoiceId = readValue(source, 'ELEVENLABS_CHILD_FEMALE_VOICE_ID') || voiceId;
const schoolFemaleVoiceId = readValue(source, 'ELEVENLABS_SCHOOL_FEMALE_VOICE_ID') || schoolVoiceId;
const teenFemaleVoiceId = readValue(source, 'ELEVENLABS_TEEN_FEMALE_VOICE_ID') || teenVoiceId;
if (!apiKey) fail('ELEVENLABS_API_KEY is missing in .env');

const tempDirectory = await mkdtemp(join(tmpdir(), 'nfact-tts-secret-'));
const secretFile = join(tempDirectory, 'tts.env');
const supabaseCli = fileURLToPath(
  new URL('../node_modules/supabase/dist/supabase.js', import.meta.url),
);

let uploadError = '';
try {
  await writeFile(secretFile, [
    `ELEVENLABS_API_KEY=${apiKey}`,
    `ELEVENLABS_CHILD_VOICE_ID=${voiceId}`,
    `ELEVENLABS_SCHOOL_VOICE_ID=${schoolVoiceId}`,
    `ELEVENLABS_SCHOOL_MALE_VOICE_ID=${schoolMaleVoiceId}`,
    `ELEVENLABS_ADULT_VOICE_ID=${adultVoiceId}`,
    `ELEVENLABS_TEEN_VOICE_ID=${teenVoiceId}`,
    `ELEVENLABS_CHILD_FEMALE_VOICE_ID=${childFemaleVoiceId}`,
    `ELEVENLABS_SCHOOL_FEMALE_VOICE_ID=${schoolFemaleVoiceId}`,
    `ELEVENLABS_TEEN_FEMALE_VOICE_ID=${teenFemaleVoiceId}`,
    '',
  ].join('\n'), { mode: 0o600 });
  const result = spawnSync(process.execPath, [supabaseCli, 'secrets', 'set', '--env-file', secretFile], {
    stdio: 'inherit',
  });
  if (result.error) uploadError = result.error.message;
  else if (result.status !== 0) uploadError = 'Supabase CLI could not upload the secret';
} catch (error) {
  uploadError = error instanceof Error ? error.message : String(error);
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}

if (uploadError) fail(uploadError);
console.log('ElevenLabs TTS secrets uploaded to Supabase.');
