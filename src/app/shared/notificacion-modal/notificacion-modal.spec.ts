import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacionModal } from './notificacion-modal';

describe('NotificacionModal', () => {
  let component: NotificacionModal;
  let fixture: ComponentFixture<NotificacionModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionModal],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
