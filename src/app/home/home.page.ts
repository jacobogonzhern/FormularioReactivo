import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule, FormBuilder, Validators,
  AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner, IonNote,
  ToastController
} from '@ionic/angular';

/** Validador personalizado: el SKU debe tener exactamente 12 caracteres alfanuméricos */
export function skuValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = (control.value ?? '').toString();
    if (!valor) return null; // el "required" ya se encarga del campo vacío
    return /^[A-Za-z0-9]{12}$/.test(valor) ? null : { skuInvalido: true };
  };
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList,
    IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner, IonNote
  ],
})
export class HomePage {
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);

  categorias = ['Electrónica', 'Herramientas', 'Consumibles'];

  /** Signal que indica si se está guardando el producto */
  isSubmitting = signal<boolean>(false);

  productoForm = this.fb.group({
    sku: ['', [Validators.required, skuValidator()]],
    nombre: ['', [Validators.required]],
    categoria: ['', [Validators.required]],
    stockMinimo: [null as number | null, [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^[0-9]+$/)
    ]],
  });

  /** Mensaje de error dinámico del SKU */
  get skuError(): string {
    const c = this.productoForm.controls.sku;
    if (c.hasError('required')) return 'El código SKU es obligatorio.';
    if (c.hasError('skuInvalido')) return 'Debe tener exactamente 12 caracteres alfanuméricos (sin espacios ni símbolos).';
    return '';
  }

  /** Mensaje de error dinámico del stock */
  get stockError(): string {
    const c = this.productoForm.controls.stockMinimo;
    if (c.hasError('required')) return 'El stock mínimo es obligatorio.';
    if (c.hasError('min') || c.hasError('pattern')) return 'Debe ser un número entero mayor que 0.';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched(); // muestra todos los errores
      return;
    }

    this.isSubmitting.set(true);
    this.productoForm.disable(); // bloquea el formulario mientras guarda

    try {
      const producto = this.productoForm.getRawValue();
      console.log('Payload a guardar:', producto);

      // Simulación de petición de guardado
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Guardado local
      const guardados = JSON.parse(localStorage.getItem('productos') ?? '[]');
      guardados.push(producto);
      localStorage.setItem('productos', JSON.stringify(guardados));

      this.productoForm.reset();
      await this.mostrarToast('Producto guardado localmente', 'success');
    } catch (error) {
      console.error('Error al guardar', error);
      await this.mostrarToast('Error al guardar el producto', 'danger');
    } finally {
      this.productoForm.enable();
      this.isSubmitting.set(false);
    }
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}