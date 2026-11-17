import { Component, inject, OnInit, signal } from '@angular/core';
import { LucideCalendar, LucideDollarSign, LucideHeart, LucideHouse, LucideLogOut, LucideWallet } from '@lucide/angular';
import { AuthService } from '../../services/auth-service/auth-service';
import { Evento } from '../../entitys/evento.interface';
import { Cuota } from '../../entitys/cuotas.interface';
import { UsuariosService } from '../../services/usuarios-service/usuarios-service';
import { CuotasService } from '../../services/cuotas-service/cuotas-service';
import { EventosService } from '../../services/eventos-service/eventos-service';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { Avisos } from '../../components/avisos/avisos';



@Component({
  selector: 'app-usuario',
  imports: [LucideLogOut, LucideHouse, LucideWallet, LucideCalendar, LucideHeart, NgClass, LucideCalendar, LucideDollarSign, Avisos],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css',
})
export class Usuario implements OnInit {
  // IMPORTACION DE SERVICIOS
  authService = inject(AuthService);
  usuarioService = inject(UsuariosService);
  cuotaService = inject(CuotasService);
  eventoService = inject(EventosService);
  router = inject(Router);


  //  DATOS DE LA DB
  proxEvento = signal<Evento | null>(null);
  proxCuota = signal<Cuota | null>(null)

  // BANDERAS
  seccion = signal<"calendario" | "inicio" | "cuotas">("inicio")
  cargando = signal(true);
  error = signal("");

  // VARIABLES
  mesProxEvento = signal<string>("");
  numeroProxEvento = signal<string>("");
  importeActual =signal<number | null>(null);


  
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];


  async ngOnInit() {
    await this.cargarResumen();
  }

  async cargarResumen() {
    try {
      this.cargando.set(true);
      this.error.set('');

      const userid = this.authService.idUsuario();
      const ramaUser = this.authService.rama();
      const rol = this.authService.rol();

      const configuracion = await this.cuotaService.obtenerConfiguracionCuota();
      console.log("COnfiguracion de la cuota: ", configuracion)
      this.importeActual.set(configuracion?.amount ?? null);


      // ÚLTIMA CUOTA
      if (userid !== null) {
        const cuota = await this.cuotaService.obtenerUltimaCuota(userid);
        this.proxCuota.set(cuota);

      } else {
        console.warn('No se encontró el ID del usuario');
        this.proxCuota.set(null);
      }

      // PRÓXIMO EVENTO
      if (rol === 'admin' || ramaUser !== null) {
        const evento = await this.eventoService.obtenerProximoEvento(
          ramaUser,
          rol
        );

        this.proxEvento.set(evento);
        if (evento?.fecha) {
          this.parsearFecha(evento.fecha);
        }

      } else {
        console.warn('El usuario no tiene una rama asignada');
        this.proxEvento.set(null);
      }

    } catch (error: any) {
      console.error('Error al cargar el resumen:', error);
      this.error.set(error?.message ?? 'Ocurrió un error al cargar los datos');
    } finally {
      this.cargando.set(false);
    }
  }

  irAHome() {
    this.router.navigate(["/"])
  }

  async salir() {
    try {
      this.cargando.set(true);
      await this.authService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {

      this.error.set('No se pudo cerrar la sesión.');
    } finally {
      this.cargando.set(false)
    }
  }


  private parsearFecha(fecha: string) {
    if (!fecha) return;


    const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
    const [_, mesNum, numero] = fecha.split("-");
    const indiceMes = Number(mesNum) - 1;

    const mes = MESES[indiceMes] ?? "";

    this.mesProxEvento.set(mes);
    this.numeroProxEvento.set(numero)

  }

   formatearImporte(importe: number | null): string {
  if (importe === null) return 'Sin importe asignado';

  return importe.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });
}
}
