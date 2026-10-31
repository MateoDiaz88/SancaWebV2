import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Rama, Usuario } from '../../entitys/usuario.interface';
import { Pago, PAGOS_MOCK } from '../../shared/utils/cuotas.mock';
import { LucideCheck, LucideX } from '@lucide/angular';
import { CuotasService } from '../../services/cuotas-service/cuotas-service';
import { Cuota, CuotasConfig } from '../../entitys/cuotas.interface';
import { NotificacionService } from '../../services/notificacion-service/notificacion-service';


const MESES = [
  { n: 3, label: 'Mar' }, { n: 4, label: 'Abr' }, { n: 5, label: 'May' },
  { n: 6, label: 'Jun' }, { n: 7, label: 'Jul' }, { n: 8, label: 'Ago' },
  { n: 9, label: 'Sep' }, { n: 10, label: 'Oct' }, { n: 11, label: 'Nov' },
  { n: 12, label: 'Dic' },
];


@Component({
  selector: 'app-cuotas',
  imports: [LucideCheck, LucideX],
  templateUrl: './cuotas.html',
  styleUrl: './cuotas.css',
})
export class Cuotas {

  private hoy = new Date();
  private cuotasService = inject(CuotasService);
  notificacionesService = inject(NotificacionService);

  cuotas = signal<Cuota[]>([]);
  config = signal<CuotasConfig[]>([]);
  cargando = signal(true);
  error = signal('');
  usuarios = input.required<Usuario[]>();


  // --- Filtros ---
  meses = MESES;
  anio = signal(this.hoy.getFullYear());
  anios = [this.hoy.getFullYear() - 1, this.hoy.getFullYear()];
  busqueda = signal('');
  rama = signal<Rama | ''>('');
  estado = signal<'todos' | 'aldia' | 'deuda'>('todos');


  constructor() {
    // la config se trae una vez
    this.cuotasService.listarConfig()
      .then(c => this.config.set(c))
      .catch(() => this.error.set('No se pudo cargar la configuración.'));

    // las cuotas se traen al abrir y cada vez que cambia el año
    effect(() => {
      this.cargarCuotas(this.anio());
    });
  }


  // Último mes que ya debería estar pago
  private mesLimite = computed(() => {
    const y = this.hoy.getFullYear();
    if (this.anio() < y) return 12;
    if (this.anio() > y) return 2;          // año futuro: nada vence todavía
    return this.hoy.getMonth() + 1;
  });


  // --- Monto del año elegido ---
  montoAnual = computed(
    () => this.config().find(c => c.year === this.anio())?.amount ?? 0,
  );
  sinConfig = computed(() => !this.config().some(c => c.year === this.anio()));

  async cargarCuotas(year: number) {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.cuotas.set(await this.cuotasService.listar(year));
    } catch {
      this.error.set('No se pudieron cargar las cuotas.');
    } finally {
      this.cargando.set(false);
    }
  }

  // usuarioId -> meses pagos del año elegido
  // 'pagadas' ahora mira el campo paid
  private pagadas = computed(() => {
    const mapa = new Map<string, Set<number>>();
    for (const c of this.cuotas()) {
      if (c.year !== this.anio() || !c.paid) continue;
      if (!mapa.has(c.userId)) mapa.set(c.userId, new Set());
      mapa.get(c.userId)!.add(c.month);
    }
    return mapa;
  });
  estadoCuota(id: string, mes: number): 'pagada' | 'debe' | 'futura' {
    if (this.pagadas().get(id)?.has(mes)) return 'pagada';
    return mes <= this.mesLimite() ? 'debe' : 'futura';
  }



  adeuda(id: string): number {
    return this.meses.filter(m => this.estadoCuota(id, m.n) === 'debe').length;
  }

  deuda(id: string): number {
    return this.adeuda(id) * this.montoAnual();
  }

  // --- Quiénes aparecen en la tabla ---
  // Solo protagonistas activos: de acá nace cada fila
  private protagonistas = computed(() =>
    this.usuarios().filter(u => u.rol === 'protagonista' && u.activo),
  );


  // Usa un filter en el que va comprobando varias condiciones, el usuario que pase a esas condiciones, se va a mostrar

  filas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    return this.protagonistas().filter(u => {
      if (q && !`${u.nombre} ${u.apellido} ${u.dni}`.toLowerCase().includes(q)) return false;
      if (this.rama() && u.rama !== this.rama()) return false;
      const debe = this.adeuda(u.id) > 0;
      if (this.estado() === 'aldia' && debe) return false;
      if (this.estado() === 'deuda' && !debe) return false;
      return true;
    });
  });


  total = computed(() => this.protagonistas().length);
  conDeuda = computed(() => this.protagonistas().filter(u => this.adeuda(u.id) > 0).length);
  alDia = computed(() => this.total() - this.conDeuda());

  async toggle(userId: string, month: number) {
    if (this.sinConfig()) return;

    const year = this.anio();
    const monto = this.montoAnual();
    const anterior = this.cuotas();
    const existente = anterior.find(
      c => c.userId === userId && c.year === year && c.month === month,
    );
    const estabaPaga = existente?.paid ?? false;
    const hoy = new Date().toISOString().split('T')[0];

    // 1. cambio inmediato en pantalla
    if (!existente) {
      this.cuotas.update(l => [
        ...l,
        { id: crypto.randomUUID(), userId, year, month, paid: true, paidAt: hoy, amount: monto },
      ]);
    } else {
      this.cuotas.update(l => l.map(c => c.id !== existente.id ? c : (
        estabaPaga
          ? { ...c, paid: false, paidAt: null, amount: null }
          : { ...c, paid: true, paidAt: hoy, amount: monto }
      )));
    }

    // 2. guardar en la base; si falla, volver atrás
    try {
      if (estabaPaga) {
        await this.cuotasService.marcarImpaga(userId, year, month);
        this.notificacionesService.exito("¡Cuota pagada!", "Se cambió el estado de la cuota.")
      } else {
       await this.cuotasService.marcarPaga(userId, year, month, monto);
        this.notificacionesService.exito("Exito", "Se cambió el estado de cuota.")
      }
    } catch {
      this.cuotas.set(anterior);
      this.notificacionesService.error("No se pudo guardar el cambio. Intente de nuevo.");
      this.error.set('No se pudo guardar el cambio. Intentá de nuevo.');
    }
  }
}

