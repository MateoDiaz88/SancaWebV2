import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavBar } from './components/nav-bar/nav-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Spinner } from './shared/spinner/spinner';
import { AuthService } from './services/auth-service/auth-service';
import { NotificacionModal } from './shared/notificacion-modal/notificacion-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, Spinner, NotificacionModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{
  protected readonly title = signal('sanca-web');

  private router = inject(Router);
  private authService = inject(AuthService);

  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  mostrarNav = computed(() => {
  const u = this.url();
  return !u.startsWith('/admin') && !u.startsWith('/login');
});


  async ngOnInit() {
    await this.authService.inicializarAuth();
  }
} 
