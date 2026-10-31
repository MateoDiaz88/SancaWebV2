import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  visible = signal(false);
  mensaje = signal('Cargando...');

  mostrar(mensaje = 'Cargando...') {
    this.mensaje.set(mensaje);
    this.visible.set(true);
  }

  ocultar() {
    this.visible.set(false);
  }
}
