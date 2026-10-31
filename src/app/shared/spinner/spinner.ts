import { Component, inject, input } from '@angular/core';
import { LoadingService } from '../../services/loading-service/loading-service';

@Component({
  selector: 'app-spinner',
  imports: [],
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
})
export class Spinner {

  loading = inject(LoadingService);




}
