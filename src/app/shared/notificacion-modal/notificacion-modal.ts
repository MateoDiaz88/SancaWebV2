import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../services/notificacion-service/notificacion-service';
import { LucideCheck, LucideCircleAlert, LucideInfo, LucideTriangleAlert } from '@lucide/angular';

@Component({
  selector: 'app-notificacion-modal',
  imports: [LucideCheck, LucideTriangleAlert, LucideInfo,LucideCircleAlert],
  templateUrl: './notificacion-modal.html',
  styleUrl: './notificacion-modal.css',
})
export class NotificacionModal {
  notificaciones = inject(NotificacionService);


}
