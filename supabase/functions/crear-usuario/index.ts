// supabase/functions/crear-usuario/index.ts
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

const ROLES = ['protagonista', 'educador', 'admin'];
const RAMAS = ['manada', 'unidad', 'caminantes', 'rover'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  // 1. ¿Quién llama y es admin?
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return responder({ error: 'No autenticado.' }, 401);

  const { data: yo } = await admin.from('perfiles').select('rol').eq('id', user.id).single();
  if (yo?.rol !== 'admin') return responder({ error: 'No tenés permisos para crear usuarios.' }, 403);

  // 2. Validar
  const d = await req.json();
  if (!/^\d{7,8}$/.test(d.dni ?? '')) return responder({ error: 'DNI inválido.' }, 400);
  if (!d.nombre?.trim() || !d.apellido?.trim()) return responder({ error: 'Nombre y apellido son obligatorios.' }, 400);
  if (!/^\S+@\S+\.\S+$/.test(d.email ?? '')) return responder({ error: 'Correo inválido.' }, 400);
  if ((d.password ?? '').length < 6) return responder({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
  if (!d.fechaNacimiento) return responder({ error: 'La fecha de nacimiento es obligatoria.' }, 400);
  if (!ROLES.includes(d.rol)) return responder({ error: 'Rol inválido.' }, 400);

  const rama = d.rol === 'admin' ? null : d.rama;
  if (d.rol !== 'admin' && !RAMAS.includes(rama)) return responder({ error: 'Seleccioná una rama.' }, 400);

  // 3. Crear la cuenta en Auth
  const { data: creado, error: errAuth } = await admin.auth.admin.createUser({
    email: d.email,
    password: d.password,
    email_confirm: true,
  });
  if (errAuth) {
    const duplicado = errAuth.message.toLowerCase().includes('already');
    return responder({ error: duplicado ? 'Ya existe una cuenta con ese correo.' : errAuth.message }, 400);
  }

  // 4. Crear el perfil; si falla, deshacer la cuenta
  const { data: perfil, error: errPerfil } = await admin
    .from('perfiles')
    .insert({
      id: creado.user.id,
      dni: d.dni,
      nombre: d.nombre.trim(),
      apellido: d.apellido.trim(),
      email: d.email,
      fecha_nacimiento: d.fechaNacimiento,
      rol: d.rol,
      rama,
    })
    .select('id, dni, nombre, apellido, email, fecha_nacimiento, rol, rama, activo')
    .single();

  if (errPerfil) {
    await admin.auth.admin.deleteUser(creado.user.id);
    const duplicado = errPerfil.code === '23505';
    return responder({ error: duplicado ? 'Ya existe un usuario con ese DNI o correo.' : 'No se pudo guardar el perfil.' }, 400);
  }

  // misma forma que el modelo Usuario de Angular
  return responder({
    id: perfil.id,
    dni: perfil.dni,
    nombre: perfil.nombre,
    apellido: perfil.apellido,
    email: perfil.email,
    fechaNacimiento: perfil.fecha_nacimiento,
    rol: perfil.rol,
    rama: perfil.rama,
    activo: perfil.activo,
  });
});