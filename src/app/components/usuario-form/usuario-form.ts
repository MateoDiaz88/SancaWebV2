import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Rama, Usuario } from '../../entitys/usuario.interface';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { calcularEdad, ramaPorEdad } from '../../shared/utils/fechas';

export type UsuarioFormValue = Omit<Usuario, 'id' | 'activo'> & { password?: string };

export const RAMAS: { value: Rama; label: string }[] = [
  { value: 'manada', label: 'Manada' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'caminantes', label: 'Caminantes' },
  { value: 'rover', label: 'Rover' },
];


@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css',
})
export class UsuarioForm {
  private fb = inject(FormBuilder);

  usuario = input<Usuario | null>(null);
  guardando = input(false);

  guardar = output<UsuarioFormValue>();
  cancelar = output<void>();

  editando = computed(() => this.usuario() !== null);

  ramas = RAMAS;

  fechaValida: ValidatorFn = (c) => {
    if (!c.value) return null;
    const f = new Date(c.value + 'T00:00:00');
    const hoy = new Date();
    if (f > hoy) return { futura: true };
    if (hoy.getFullYear() - f.getFullYear() > 100) return { muyAntigua: true };
    return null;
  };

  hoy = new Date().toISOString().split('T')[0];


  form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ["", [Validators.required, Validators.email]],
    fechaNacimiento: ['', [Validators.required, this.fechaValida]],
    fechaIngreso: [this.hoy, Validators.required],
    rol: ['protagonista' as Usuario['rol'], Validators.required],
    rama: [null as Rama | null],
    password: [''],
  });


  max = new Date().toISOString().split('T')[0];   // para el atributo max del input

  private rol = toSignal(this.form.controls.rol.valueChanges, {
    initialValue: this.form.controls.rol.value,
  });

  pideRama = computed(() => this.rol() !== 'admin');
  labelRama = computed(() =>
    this.rol() === 'educador' ? 'Rama a cargo' : 'Rama'
  );

  pideIngreso = computed(() => this.rol() === 'protagonista');  

  constructor() {
    this.form.controls.fechaNacimiento.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(f => {
        const rama = this.form.controls.rama;
        if (this.editando() || this.form.controls.rol.value !== 'protagonista') return;
        if (!f || rama.dirty) return;            // no pisar lo que el admin eligió
        rama.setValue(ramaPorEdad(calcularEdad(f)));
      });

    effect(() => {
      const u = this.usuario();
      const pass = this.form.controls.password;

      if (u) {
        this.form.reset({ dni: u.dni, nombre: u.nombre, apellido: u.apellido, rol: u.rol, password: '', email: u.email, fechaNacimiento: u.fechaNacimiento, rama: u.rama, fechaIngreso: u.fechaIngreso });
        this.form.controls.dni.disable();               // el DNI no se edita
        pass.setValidators([Validators.minLength(6)]);  // opcional al editar
      } else {
        this.form.reset({ rol: 'protagonista' , fechaIngreso: this.hoy});
        this.form.controls.dni.enable();
        pass.setValidators([Validators.required, Validators.minLength(6)]);
      }
      pass.updateValueAndValidity();
    });

    effect(() => {
      const ctrl = this.form.controls.rama;
      if (this.pideRama()) {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { password, ...resto } = this.form.getRawValue(); // getRawValue incluye el dni deshabilitado
    this.guardar.emit({ ...resto, ...(password ? { password } : {}) });

  }

}
