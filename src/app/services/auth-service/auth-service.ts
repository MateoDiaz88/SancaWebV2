import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '../supabase-service/supabase-service';


type RolUsuario = 'admin' | 'educador' | 'protagonista';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  supabase = this.supabaseService.supabase;

  usuarioLogueado = signal(false);
  rol = signal<RolUsuario | null>(null);
  rama = signal<string | null>(null);
  idUsuario = signal<string|null>(null)
  cargandoAuth = signal(true);

  async login(dni: string, password: string) {
    const { data, error } = await this.supabase.functions.invoke('login-dni', {
      body: { dni, password },
    });

    if (error || !data?.access_token) {
      throw new Error('Credenciales incorrectas');
    }
    const { error: errSesion } =
      await this.supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

    if (errSesion) {
      throw new Error('No se pudo iniciar sesión');
    }

    await this.cargarPerfil();

    if (!this.usuarioLogueado()) {
      await this.supabase.auth.signOut();
      throw new Error('No se pudo cargar el perfil del usuario');
    }

  }


  async logout() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error('No se pudo cerrar la sesión');
    }
  }

  async cargarPerfil() {
    const { data: { user }, error } =
      await this.supabase.auth.getUser();

    if (error || !user?.email) {
      this.usuarioLogueado.set(false);
      this.rol.set(null);
      this.rama.set(null)
      this.idUsuario.set(null)
      return;
    }

    const { data: perfil, error: errorPerfil } =
      await this.supabase
        .from('perfiles')
        .select('id, rol, rama,activo')
        .eq('email', user.email)
        .maybeSingle();

    if (errorPerfil || !perfil || !perfil.activo) {
      this.usuarioLogueado.set(false);
      this.rol.set(null);
      this.rama.set(null)
      this.idUsuario.set(null)
      return;
    }

    this.usuarioLogueado.set(true);
    this.rol.set(perfil.rol as RolUsuario);
    this.rama.set(perfil.rama);
    this.idUsuario.set(perfil.id)
  }

  async inicializarAuth() {
    this.cargandoAuth.set(true);

    try {
      await this.cargarPerfil();
    } finally {
      this.cargandoAuth.set(false);
    }
  }
}
