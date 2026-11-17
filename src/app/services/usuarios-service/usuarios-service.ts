import { inject, Injectable } from '@angular/core';
import { UsuarioFormValue } from '../../components/usuario-form/usuario-form';
import { SupabaseService } from '../supabase-service/supabase-service';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Usuario } from '../../entitys/usuario.interface';
import { Evento } from '../../entitys/evento.interface';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private supabaseService = inject(SupabaseService);

  supabase = this.supabaseService.supabase;


  async crear(datos: UsuarioFormValue): Promise<Usuario> {
    const { data, error } = await this.supabase.functions.invoke<Usuario>('crear-usuario', {
      body: datos,
    });

    if (error) {
      let mensaje = 'No se pudo crear el usuario.';
      if (error instanceof FunctionsHttpError) {
        const cuerpo = await error.context.json();
        mensaje = cuerpo.error ?? mensaje;
      }
      throw new Error(mensaje);
    }

    return data!;
  }

  async cargarUsuarios(): Promise<Usuario[]> {
    const { data, error } = await this.supabase.from("perfiles").select("*");

    if (error) {
      throw error;
    }

    return data;

  }

  async desactivarUsuario(id: string) {
    const { error } = await this.supabase.from("perfiles")
      .update({ "activo": false })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }



  
}

