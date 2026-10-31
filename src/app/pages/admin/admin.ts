import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideBan, LucideDollarSign, LucideHouse, LucideLogOut, LucidePencil, LucideSearch, LucideUserPlus, LucideUsers, LucideWallet } from '@lucide/angular';
import { Usuario } from '../../entitys/usuario.interface';
import { UsuarioForm, UsuarioFormValue } from '../../components/usuario-form/usuario-form';
import { Cuotas } from '../../components/cuotas/cuotas';
import { UsuariosService } from '../../services/usuarios-service/usuarios-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { Spinner } from '../../shared/spinner/spinner';


@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, LucideWallet, LucideSearch, LucideUsers, LucideUserPlus, LucideLogOut, LucidePencil, LucideHouse, LucideDollarSign, UsuarioForm, Cuotas, LucideBan],
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
  seccion = signal<'usuarios' | 'form' | "cuotas">('usuarios');
  usuarioEditando = signal<Usuario | null>(null);
  guardando = signal(false);
  busqueda = signal('');

  errorForm = signal("");


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
