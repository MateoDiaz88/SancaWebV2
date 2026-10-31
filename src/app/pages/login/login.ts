import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeClosed } from '@lucide/angular';
import { AuthService } from '../../services/auth-service/auth-service';
import { LoadingService } from '../../services/loading-service/loading-service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, LucideEye, LucideEyeClosed, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private loadingService = inject(LoadingService);

  show = signal(false);
  cargando = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    password: ['', Validators.required],
  });

  get dni() { return this.form.controls.dni; }
  get password() { return this.form.controls.password; }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loadingService.mostrar("Iniciando sesión...")
    this.error.set('');

    try {
      const { dni, password } = this.form.getRawValue();
      await this.authService.login(dni, password);
      this.router.navigate(['/admin']);
    } catch {
      this.error.set('DNI o contraseña incorrectos.');
    } finally {
      this.loadingService.ocultar();
    }
  }
}
