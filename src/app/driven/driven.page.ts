import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButtons, IonInput,
  IonInputPasswordToggle, IonSelect, IonSelectOption, IonButton, IonSpinner, IonNote,
  IonGrid, IonRow, IonCol, AlertController
} from '@ionic/angular';
import { DarkModeToggleComponent } from '../shared/dark-mode-toggle.component';
import { cifrarPassword, fechaHoy } from '../shared/seguridad';
import { FechaNoFuturaDirective } from './fecha-no-futura.directive';

/** Modelo de datos enlazado con [(ngModel)] */
interface ProductoModelo {
  sku: string;
  nombre: string;
  categoria: string;
  stockMinimo: number | null;
  fechaNacimiento: string;
  password: string;
}

/**
 * Formulario Template-Driven: la estructura y las validaciones se definen en el HTML
 * (ngModel + atributos required, pattern, minlength...), al contrario que en el
 * formulario reactivo de RegistroPage, donde se definen en el TypeScript.
 */
@Component({
  selector: 'app-driven',
  templateUrl: 'driven.page.html',
  styleUrls: ['driven.page.scss'],
  imports: [
    FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButtons,
    IonInput, IonInputPasswordToggle, IonSelect, IonSelectOption, IonButton, IonSpinner, IonNote,
    IonGrid, IonRow, IonCol, DarkModeToggleComponent, FechaNoFuturaDirective
  ],
})
export class DrivenPage {
  private alertCtrl = inject(AlertController);

  hoy = fechaHoy();
  categorias = ['Electrónica', 'Herramientas', 'Consumibles'];
  isSubmitting = signal<boolean>(false);

  modelo: ProductoModelo = this.modeloVacio();

  async onSubmit(form: NgForm): Promise<void> {
    if (form.invalid) {
      form.form.markAllAsTouched(); // muestra todos los errores
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { password, ...resto } = this.modelo;
      const envio = { ...resto, passwordCifrada: await cifrarPassword(password) };
      console.log('Payload a guardar (Template-Driven):', envio);

      await new Promise(resolve => setTimeout(resolve, 2000));

      form.resetForm();
      this.modelo = this.modeloVacio();

      const alert = await this.alertCtrl.create({
        header: 'Formulario enviado',
        message: 'El formulario se ha enviado correctamente.',
        buttons: ['Aceptar'],
      });
      await alert.present();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private modeloVacio(): ProductoModelo {
    return { sku: '', nombre: '', categoria: '', stockMinimo: null, fechaNacimiento: '', password: '' };
  }
}
