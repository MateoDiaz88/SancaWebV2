import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'success' | 'error' | 'warning' | 'info';

export interface Notificacion {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  textoBoton?: string;
}




@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  notificacion = signal<Notificacion | null>(null);

  mostrar(
    tipo: TipoNotificacion,
    titulo: string,
    mensaje: string,
    textoBoton = 'Entendido'
  ) {
    this.notificacion.set({
      tipo,
      titulo,
      mensaje,
      textoBoton
    });
  }

  exito(mensaje: string, titulo = '¡Operación exitosa!') {
    this.mostrar('success', titulo, mensaje);
  }

  error(mensaje: string, titulo = 'Ocurrió un error') {
    this.mostrar('error', titulo, mensaje);
  }

  advertencia(mensaje: string, titulo = 'Atención') {
    this.mostrar('warning', titulo, mensaje);
  }

  informacion(mensaje: string, titulo = 'Información') {
    this.mostrar('info', titulo, mensaje);
  }

  cerrar() {
    this.notificacion.set(null);
  }
}
