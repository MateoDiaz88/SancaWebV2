import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase-service/supabase-service';
import { Aviso } from '../../entitys/avisos.interface';

@Injectable({
  providedIn: 'root',
})
export class AvisosService {
  supabaseService = inject(SupabaseService);


  async cargarAvisos(rama: string | null): Promise<Aviso[]> {
    let query = this.supabaseService.supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    // avisos generales + los de su rama
    if (rama) {
      query = query.or(`rama.is.null,rama.eq.${rama}`);
    } else {
      query = query.is('rama', null);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data ?? []) as Aviso[];
  }


  async crearAviso(aviso: {
    titulo: string;
    texto: string;
    rama: string | null;
    importante: boolean;
  }): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('avisos')
      .insert(aviso);

    if (error) throw error;
  }
}
