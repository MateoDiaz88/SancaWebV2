import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase-service/supabase-service';
import { Evento, EventoForm } from '../../entitys/evento.interface';

@Injectable({
  providedIn: 'root',
})
export class EventosService {
  private client = inject(SupabaseService).supabase;
  private columnas =
    'id, titulo, descripcion, tipo, lugar, rama, creado_por, fecha, fechaFin:fecha_fin, hora';

  private aFila = (d: EventoForm) => ({
    titulo: d.titulo, descripcion: d.descripcion, tipo: d.tipo, lugar: d.lugar,
    rama: d.rama, fecha: d.fecha, fecha_fin: d.fechaFin, hora: d.hora,
  });

  // eventos que se pisan con el rango [desde, hasta]
  async listar(desde: string, hasta: string): Promise<Evento[]> {
    const { data, error } = await this.client
      .from('eventos')
      .select(this.columnas)
      .lte('fecha', hasta)
      .gte('fecha_fin', desde)
      .order('fecha')
      .order('hora', { nullsFirst: true });

    if (error) throw error;

    const eventos = (data ?? []) as unknown as Evento[];

    return eventos.map(e => ({
      ...e,
      hora: e.hora ? e.hora.slice(0, 5) : null
    }));
  }

  async crear(d: EventoForm) {
    const { error } = await this.client.from('eventos').insert(this.aFila(d));
    if (error) throw error;
  }

  async actualizar(id: string, d: EventoForm) {
    const { error } = await this.client.from('eventos').update(this.aFila(d)).eq('id', id);
    if (error) throw error;
  }

  async eliminar(id: string) {
    const { error } = await this.client.from('eventos').delete().eq('id', id);
    if (error) throw error;
  }


  async obtenerProximoEvento(
    rama: string | null,
    rol: string | null
  ): Promise<Evento | null> {

    const hoy = new Date().toISOString().split('T')[0];
    console.log("EJECUTANDO FUNCION")

    let query = this.client
      .from('eventos')
      .select('*')
      .gte('fecha_fin', hoy);

    // Si no es administrador, filtra por su rama
    if (rol !== 'admin') {
      if (!rama) return null;

      query = query.or(`rama.eq.${rama},rama.is.null`);
    }

    const { data, error } = await query
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data as Evento | null;
  }
}
