import { Component, computed, inject, signal } from '@angular/core';
import { Aviso } from '../../entitys/avisos.interface';
import { AvisosService } from '../../services/avisos-services/avisos-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { LucideHeart, LucideMegaphone, LucidePlus, LucideX } from '@lucide/angular';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-avisos',
  imports: [LucideMegaphone, LucideHeart, NgClass, DatePipe, LucideX, LucidePlus],
  templateUrl: './avisos.html',
  styleUrl: './avisos.css',
  host: { '(document:keydown.escape)': 'cerrar(); cerrarForm()' },
})
export class Avisos {
  avisos = signal<Aviso[]>([]);
  avisosServices = inject(AvisosService);
  authService = inject(AuthService);
  avisoSeleccionado = signal<Aviso | null>(null);

  esAdmin = computed(() => this.authService.rol() === 'admin');

  ramas = ['manada', 'unidad', 'caminantes', 'rover'];

  formAbierto = signal(false);
  guardando = signal(false);
  errorForm = signal('');

  titulo = signal('');
  texto = signal('');
  rama = signal('');            // '' = todo el grupo
  importante = signal(false);

  formValido = computed(() => this.titulo().trim() !== '' && this.texto().trim() !== '')



  error = signal('');
  cargando = signal(true);

  ngOnInit() {
    this.cargarAvisos();
  }

  esLargo(aviso: Aviso): boolean {
    return aviso.texto.length > 140;
  }

  abrir(aviso: Aviso) {
    this.avisoSeleccionado.set(aviso);
  }

  cerrar() {
    this.avisoSeleccionado.set(null);
  }


  abrirForm() {
    this.formAbierto.set(true);
  }

  cerrarForm() {
    this.formAbierto.set(false);
    this.errorForm.set('');
    this.titulo.set('');
    this.texto.set('');
    this.rama.set('');
    this.importante.set(false);
  }

  async guardar() {
    if (!this.formValido() || this.guardando()) return;

    this.guardando.set(true);
    this.errorForm.set('');

    try {
      await this.avisosServices.crearAviso({
        titulo: this.titulo().trim(),
        texto: this.texto().trim(),
        rama: this.rama() || null,
        importante: this.importante(),
      });
      this.cerrarForm();
      await this.cargarAvisos();
    } catch (error) {
      this.errorForm.set('No se pudo guardar el aviso.');
    } finally {
      this.guardando.set(false);
    }
  }
  async cargarAvisos() {
    this.cargando.set(true);
    this.error.set('');

    try {
      const rama = this.authService.rama();
      const avisos = await this.avisosServices.cargarAvisos(rama);
      this.avisos.set(avisos);
    } catch (error) {
      this.error.set('No se pudieron cargar los avisos.');
    } finally {
      this.cargando.set(false);
    }
  }
}

