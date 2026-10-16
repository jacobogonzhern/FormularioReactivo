import { Component, signal } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { moon, sunny } from 'ionicons/icons';

/** Botón reutilizable que activa/desactiva el modo oscuro de toda la app */
@Component({
  selector: 'app-dark-mode-toggle',
  imports: [IonButton, IonIcon],
  template: `
    <ion-button (click)="alternar()" [attr.aria-label]="oscuro() ? 'Activar modo claro' : 'Activar modo oscuro'">
      <ion-icon slot="icon-only" [name]="oscuro() ? 'sunny' : 'moon'"></ion-icon>
    </ion-button>
  `,
})
export class DarkModeToggleComponent {
  oscuro = signal<boolean>(false);

  constructor() {
    addIcons({ moon, sunny });
    // Recupera la preferencia guardada o, si no hay, la del sistema
    let guardado: string | null = null;
    try { guardado = localStorage.getItem('modoOscuro'); } catch {}
    const inicial = guardado !== null
      ? guardado === 'true'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.aplicar(inicial);
  }

  alternar(): void {
    this.aplicar(!this.oscuro());
  }

  private aplicar(valor: boolean): void {
    this.oscuro.set(valor);
    // Ionic aplica la paleta oscura cuando <html> tiene la clase ion-palette-dark
    document.documentElement.classList.toggle('ion-palette-dark', valor);
    try { localStorage.setItem('modoOscuro', String(valor)); } catch {}
  }
}
