import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase-service/supabase-service';
import { Cuotas } from '../../components/cuotas/cuotas';
import { Cuota, CuotasConfig } from '../../entitys/cuotas.interface';

@Injectable({
  providedIn: 'root',
})
export class CuotasService {
  private supabase = inject(SupabaseService);
  client = this.supabase.supabase;

  async listar(year: number): Promise<Cuota[]> {
    const { data, error } = await this.client
      .from('cuotas')
      .select('id, userId:user_id, year, month, paid, paidAt:paid_at, amount')
      .eq('year', year);
    if (error) throw error;
    return (data ?? []).map(c => ({ ...c, amount: c.amount === null ? null : Number(c.amount) })) as Cuota[];
  }



  async listarConfig(): Promise<CuotasConfig[]> {
    const { data, error } = await this.client
      .from('cuotas_config')
      .select('id, year, amount')
      .order('year');
    if (error) throw error;
    return (data ?? []).map(c => ({ ...c, amount: Number(c.amount) })) as CuotasConfig[];
  }

  async pagarCuota(idCuota: string) {
    const { error } = await this.client
      .from("cuotas")
      .update({ "paid": true })
      .eq("id", idCuota);

    if (error) {
      throw error;
    }
  }

  async marcarPaga(userId: string, year: number, month: number, amount: number) {
    const { error } = await this.client.from('cuotas').upsert(
      {
        user_id: userId, year, month, paid: true,
        paid_at: new Date().toISOString().split('T')[0], amount,
      },
      { onConflict: 'user_id,year,month' },
    );
    if (error) throw error;
  }

  async marcarImpaga(userId: string, year: number, month: number) {
    const { error } = await this.client
      .from('cuotas')
      .update({ paid: false, paid_at: null, amount: null })
      .eq('user_id', userId).eq('year', year).eq('month', month);
    if (error) throw error;
  }

  async obtenerUltimaCuota(idUsuario: string) {
    const añoActual = new Date().getFullYear();



    const { data, error } = await this.client
      .from('cuotas')
      .select('*')
      .eq('user_id', idUsuario)
      .eq('year', añoActual)
      .eq('paid', false)
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener cuota:', error);
      throw error;
    }

    return data;




  }

  async obtenerConfiguracionCuota() {
    const { data, error } = await this.client
      .from('cuotas_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

