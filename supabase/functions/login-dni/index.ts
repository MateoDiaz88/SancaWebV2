// supabase/functions/login-dni/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const responder = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { dni, password } = await req.json();
  const invalido = () => responder({ error: 'Credenciales incorrectas.' }, 401);

  if (!/^\d{7,8}$/.test(dni ?? '') || !password) return invalido();

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // 1. DNI -> email (solo usuarios activos)
  const { data: perfil } = await admin
    .from('perfiles')
    .select('email')
    .eq('dni', dni)
    .eq('activo', true)
    .maybeSingle();
  if (!perfil) return invalido();

  // 2. Iniciar sesión con ese email
  const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data, error } = await anon.auth.signInWithPassword({
    email: perfil.email,
    password,
  });
  if (error || !data.session) return invalido();

  // 3. Devolver solo la sesión
  return responder({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});