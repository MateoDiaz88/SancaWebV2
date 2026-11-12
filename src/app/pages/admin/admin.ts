import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideBan, LucideCalendar, LucideDollarSign, LucideHouse, LucideLogOut, LucidePencil, LucideSearch, LucideUserPlus, LucideUsers, LucideWallet } from '@lucide/angular';
import { Usuario } from '../../entitys/usuario.interface';
import { UsuarioForm, UsuarioFormValue } from '../../components/usuario-form/usuario-form';
import { Cuotas } from '../../components/cuotas/cuotas';
import { UsuariosService } from '../../services/usuarios-service/usuarios-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { Spinner } from '../../shared/spinner/spinner';
import { Calendario } from '../../components/calendario/calendario';


@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule,LucideCalendar, LucideWallet, LucideSearch, LucideUsers, LucideUserPlus, LucideLogOut, LucidePencil, LucideHouse, LucideDollarSign, UsuarioForm, Cuotas, LucideBan, Calendario],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  usuarios = signal<Usuario[]>([])

  usuarioADesactivar = signal<Usuario | null>(null);
  desactivar = signal(false);
  cargando = signal(true);
  error = signal("");


  /*SIGNAL SECCION */
  // SIGNAL = Es un primitivo reactivo que actua como un contenedor de un valor que notifica a sus consumidores cuando dicho valor es modificado
  // Es decir que es reactiva. Angular sabe exactamente en que parte del codigo o de la plantilla se usa esta señal.
  // en este caso la uso para navegar por el panel, cuando el usuario toca una opcion en el sidebar, automaticamente cambia el valor del signal y me lleva a la pantalla correspondiente 
  seccion = signal<'usuarios' | 'form' | "cuotas" | "calendario">('usuarios');
  
  usuarioEditando = signal<Usuario | null>(null);
  guardando = signal(false);
  busqueda = signal('');

  errorForm = signal("");


  // NG ON INIT: es una funcion que se ejecuta cuando apenas se crea el modulo, es decir cuando voy a la pagina /admin, lo primero que hace despues de  cargar las vistas, es cargar todos los usuarios que estan en la base de datos. Tambien existe NgOnDestroy que es lo contrario o NgAfterViewInit
  async ngOnInit() {
    await this.cargarUsuarios();
  }


  filtrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    return this.usuarios()?.filter(u =>
      `${u.nombre} ${u.apellido} ${u.dni}`.toLowerCase().includes(q));
  });

  total = computed(() => this.usuarios()?.length);
  activos = computed(() => this.usuarios()?.filter(u => u.activo).length);
  educadores = computed(() => this.usuarios()?.filter(u => u.rol === 'educador').length);

  form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    rol: ['miembro', Validators.required],
    email: ["", [Validators.email, Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  iniciales(u: Usuario) { return (u.nombre[0] + u.apellido[0]).toUpperCase(); }


  irAHome() {
    // Sirve para enviar al usuario a otra pagina 
    this.router.navigate(["/"]);
  }

  pedirDesactivar(u: Usuario) {
    this.usuarioADesactivar.set(u);
  }

  cancelarDesactivar() {
    if (this.desactivar()) return;
    this.usuarioADesactivar.set(null);
  }

  async confirmarDesactivar() {
    const u = this.usuarioADesactivar();
    if (!u) return;

    this.desactivar.set(true);
    try {
      await this.usuariosService.desactivarUsuario(u.id);
      this.usuarios.update(lista => lista.filter(x => x.id !== u.id));
      this.usuarioADesactivar.set(null);
    } catch (error) {
      this.error.set('No se pudo eliminar el usuario.');
    } finally {
      this.desactivar.set(false);
    }
  }

  nuevo() {
    this.usuarioEditando.set(null);
    this.seccion.set('form');
  }

  editar(u: Usuario) {
    this.usuarioEditando.set(u);
    this.seccion.set('form');
  }

  volver() {
    this.usuarioEditando.set(null);
    this.busqueda.set("");
    this.seccion.set("usuarios");
  }

  async onGuardar(datos: UsuarioFormValue) {
    this.guardando.set(true);
    this.errorForm.set('');
    try {
      const editando = this.usuarioEditando();

      if (editando) {
        //await this.usuariosService.actualizar(editando.id, datos);
        /*
        this.usuarios.update(lista =>
          lista.map(u => (u.id === editando.id ? { ...u, ...datos } : u)),
        );
        
        */

      } else {
        const nuevo = await this.usuariosService.crear(datos);
        this.usuarios.update(lista =>
          [...lista, nuevo].sort((a, b) => a.apellido.localeCompare(b.apellido, 'es')),
        );
      }

      this.volver();
    } catch (e) {
      this.errorForm.set(e instanceof Error ? e.message : 'No se pudo guardar el usuario.');
    } finally {
      this.guardando.set(false);
    }
  }


  async salir() {
    try {
      this.cargando.set(true);
      await this.authService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      
      this.error.set('No se pudo cerrar la sesión.');
    } finally{
      this.cargando.set(false)
    }
  }


  async cargarUsuarios(){
    try{
      this.cargando.set(true);
      const usuarios = await this.usuariosService.cargarUsuarios()
      this.usuarios.set(usuarios);
    } catch (error){
      console.error(error);
    } finally{
      this.cargando.set(false);

    }
  
  }
}
