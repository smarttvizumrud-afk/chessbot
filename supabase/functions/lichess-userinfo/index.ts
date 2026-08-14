const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LichessAccount = {
  id?: unknown;
  username?: unknown;
  perfs?: unknown;
  profile?: {
    firstName?: unknown;
    lastName?: unknown;
  };
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'GET') return json({ error: 'Use a GET request.' }, 405);

  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return json({ error: 'Missing Lichess access token.' }, 401);
  }

  const response = await fetch('https://lichess.org/api/account', {
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
  });

  const account = (await response.json()) as LichessAccount;
  if (!response.ok) {
    console.error('Lichess account request failed', response.status, account);
    return json({ error: 'Could not load Lichess account.' }, 502);
  }

  const id = typeof account.id === 'string' ? account.id : '';
  const username = typeof account.username === 'string' ? account.username : id;
  if (!id) return json({ error: 'Lichess account did not include an id.' }, 502);

  const firstName = typeof account.profile?.firstName === 'string' ? account.profile.firstName : '';
  const lastName = typeof account.profile?.lastName === 'string' ? account.profile.lastName : '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || username;

  return json({
    sub: id,
    id,
    name: fullName,
    preferred_username: username,
    username,
    custom_claims: {
      lichess_id: id,
      lichess_username: username,
    },
  });
});
