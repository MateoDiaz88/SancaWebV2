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
  idUsuario = signal<string | null>(null);
  nombre = signal<string | null>(null);
  apellido = signal<string | null>(null)
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
      this.limpiarPerfil();
      return;
    }

    const { data: perfil, error: errorPerfil } =
      await this.supabase
        .from('perfiles')
        .select('id, rol, rama,activo, nombre, apellido')
        .eq('email', user.email)
        .maybeSingle();

    if (errorPerfil || !perfil || !perfil.activo || !perfil.nombre || !perfil.apellido) {
      this.limpiarPerfil();
      return;
    }

    this.usuarioLogueado.set(true);
    this.rol.set(perfil.rol as RolUsuario);
    this.rama.set(perfil.rama);
    this.idUsuario.set(perfil.id)
    this.nombre.set(perfil.nombre);
    this.apellido.set(perfil.apellido);
  }

  async inicializarAuth() {
    this.cargandoAuth.set(true);

    try {
      await this.cargarPerfil();
    } catch (error) {
      console.error('Error al inicializar autenticación:', error);
      this.limpiarPerfil();
    } finally {
      this.cargandoAuth.set(false);
    }
  }

  private limpiarPerfil() {
    this.usuarioLogueado.set(false);
    this.rol.set(null);
    this.rama.set(null);
    this.idUsuario.set(null);
    this.nombre.set(null);
    this.apellido.set(null);
  }

}
