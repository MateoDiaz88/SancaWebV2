import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventosService } from '../../services/eventos-service/eventos-service';
import { Evento, EventoForm, TipoEvento } from '../../entitys/evento.interface';
import { AuthService } from '../../services/auth-service/auth-service';
import { LucideChevronLeft, LucideChevronRight, LucidePencil, LucidePlus, LucideTrash, LucideTrash2 } from '@lucide/angular';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];


// FORMATOS // 
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const aFecha = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

@Component({
  selector: 'app-calendario',
  imports: [ReactiveFormsModule,LucideChevronLeft, LucideChevronRight, LucidePencil, LucidePlus, LucideTrash],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css',
})
export class Calendario {
  private fb = inject(FormBuilder);
  private eventoService = inject(EventosService);
  authService = inject(AuthService);


  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  tipos: { value: TipoEvento; label: string }[] = [
    { value: 'reunion', label: 'Reunión' },
    { value: 'salida', label: 'Salida' },
    { value: 'campamento', label: 'Campamento' },
    { value: 'otro', label: 'Otro' },
  ];

  hoyIso = iso(new Date());
  mes = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  seleccionado = signal(this.hoyIso);

  eventos = signal<Evento[]>([]);
  cargando = signal(true);
  error = signal('');

  titulo = computed(() => `${MESES[this.mes().getMonth()]} ${this.mes().getFullYear()}`);

  // 6 semanas x 7 días, arrancando en lunes
  dias = computed(() => {
    const m = this.mes();
    const offset = (new Date(m.getFullYear(), m.getMonth(), 1).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(m.getFullYear(), m.getMonth(), 1 - offset + i);
      return { fecha: iso(d), numero: d.getDate(), delMes: d.getMonth() === m.getMonth() };
    });
  });

  // fecha -> eventos de ese día (un evento de varios días aparece en cada uno)
  private porDia = computed(() => {
    const mapa = new Map<string, Evento[]>();
    for (const e of this.eventos()) {
      const fin = aFecha(e.fechaFin);
      for (const d = aFecha(e.fecha); d <= fin; d.setDate(d.getDate() + 1)) {
        const k = iso(d);
        if (!mapa.has(k)) mapa.set(k, []);
        mapa.get(k)!.push(e);
      }
    }
    return mapa;
  });

  celdas = computed(() =>
    this.dias().map(d => ({ ...d, eventos: this.porDia().get(d.fecha) ?? [] })),
  );

  delDia = computed(() => this.porDia().get(this.seleccionado()) ?? []);

  constructor() {
    // se vuelve a cargar cada vez que cambia el mes mostrado
    effect(() => {
      const d = this.dias();
      this.cargar(d[0].fecha, d[41].fecha);
    });
  }

  private async cargar(desde: string, hasta: string) {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.eventos.set(await this.eventoService.listar(desde, hasta));
    } catch {
      this.error.set('No se pudieron cargar los eventos.');
    } finally {
      this.cargando.set(false);
    }
  }

  private recargar() {
    const d = this.dias();
    return this.cargar(d[0].fecha, d[41].fecha);
  }

  // --- Navegación ---
  anterior() { const m = this.mes(); this.mes.set(new Date(m.getFullYear(), m.getMonth() - 1, 1)); }
  siguiente() { const m = this.mes(); this.mes.set(new Date(m.getFullYear(), m.getMonth() + 1, 1)); }
  irAHoy() {
    const h = new Date();
    this.mes.set(new Date(h.getFullYear(), h.getMonth(), 1));
    this.seleccionado.set(this.hoyIso);
  }

  // --- Textos ---
  fechaLarga(s: string) {
    return aFecha(s).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  cuando(e: Evento) {
    const corta = (s: string) => aFecha(s).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    if (e.fecha !== e.fechaFin) return `Del ${corta(e.fecha)} al ${corta(e.fechaFin)}`;
    return e.hora ? `${e.hora} hs` : 'Todo el día';
  }

  // --- Formulario (solo admin) ---
  modal = signal(false);
  guardando = signal(false);
  errorForm = signal('');
  editando = signal<Evento | null>(null);

  form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    tipo: ['reunion' as TipoEvento, Validators.required],
    fecha: ['', Validators.required],
    fechaFin: [''],
    hora: [''],
    lugar: [''],
    rama: [''],
    descripcion: [''],
  });

  nuevo() {
    this.editando.set(null);

    this.form.reset({
      tipo: 'reunion',
      fecha: this.seleccionado(),
      rama: this.authService.rol() === 'admin'
        ? ''
        : this.authService.rama() ?? ''
    });

    this.modal.set(true);
  }


  editar(e: Evento) {
    this.editando.set(e);
    this.form.reset({
      titulo: e.titulo, tipo: e.tipo, fecha: e.fecha,
      fechaFin: e.fechaFin === e.fecha ? '' : e.fechaFin,
      hora: e.hora ?? '', lugar: e.lugar ?? '', rama: e.rama ?? '',
      descripcion: e.descripcion ?? '',
    });
    this.errorForm.set('');
    this.modal.set(true);
  }

  cerrar() { if (!this.guardando()) this.modal.set(false); }

  async guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();
    const fechaFin = v.fechaFin || v.fecha;
    if (fechaFin < v.fecha) {
      this.errorForm.set('La fecha de fin no puede ser anterior al inicio.');
      return;
    }

    const datos: EventoForm = {
      titulo: v.titulo.trim(),
      tipo: v.tipo,
      fecha: v.fecha,
      fechaFin,
      hora: v.hora || null,
      lugar: v.lugar.trim() || null,
      rama: (v.rama || null) as EventoForm['rama'],
      descripcion: v.descripcion.trim() || null,
    };

    this.guardando.set(true);
    this.errorForm.set('');
    try {
      const actual = this.editando();
      if (actual) await this.eventoService.actualizar(actual.id, datos);
      else await this.eventoService.crear(datos);
      await this.recargar();
      this.modal.set(false);
    } catch {
      this.errorForm.set('No se pudo guardar el evento.');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(e: Evento) {
    if (!confirm(`¿Eliminar "${e.titulo}"?`)) return;
    try {
      await this.eventoService.eliminar(e.id);
      await this.recargar();
    } catch {
      this.error.set('No se pudo eliminar el evento.');
    }
  }

  puedeEditar(e: Evento): boolean {
    const perfil = this.authService.usuarioLogueado();

    if (!perfil) return false;

    if (this.authService.rol() === 'admin') return true;

    if (this.authService.rol() === 'educador') {
      return this.authService.rol() === e.rama;
    }

    return e.creado_por === this.authService.idUsuario();
  }

}
