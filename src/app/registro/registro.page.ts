import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule, FormBuilder, Validators,
  AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButtons,
  IonInput, IonInputPasswordToggle, IonSelect, IonSelectOption, IonButton, IonSpinner, IonNote,
  IonGrid, IonRow, IonCol, ToastController, AlertController
} from '@ionic/angular';
import { DarkModeToggleComponent } from '../shared/dark-mode-toggle.component';
import { cifrarPassword, fechaHoy } from '../shared/seguridad';

/** Validador personalizado: el SKU debe tener exactamente 12 caracteres alfanuméricos */
export function skuValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = (control.value ?? '').toString();
    if (!valor) return null; // el "required" ya se encarga del campo vacío
    return /^[A-Za-z0-9]{12}$/.test(valor) ? null : { skuInvalido: true };
  };
}

/** Validador personalizado: la fecha de nacimiento no puede ser superior a hoy */
export function fechaNacimientoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor) return null;
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return { fechaInvalida: true };
    if (valor > fechaHoy()) return { fechaFutura: true };
    return null;
  };
}

/** Datos enviados (sin la contraseña en texto plano) */
interface Envio {
  sku: string;
  nombre: string;
  categoria: string;
  stockMinimo: number;
  fechaNacimiento: string;
  passwordCifrada: string;
}

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['registro.page.scss'],
  imports: [
    ReactiveFormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonButtons, IonInput, IonInputPasswordToggle, IonSelect, IonSelectOption,
    IonButton, IonSpinner, IonNote, IonGrid, IonRow, IonCol, DarkModeToggleComponent
  ],
})
export class RegistroPage {
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  /** Fecha de hoy para no permitir fechas futuras en el calendario */
  hoy = fechaHoy();

  categorias = ['Electrónica', 'Herramientas', 'Consumibles'];

  /** Signal que indica si se está guardando el formulario */
  isSubmitting = signal<boolean>(false);

  /** Último envío correcto (para poder descargarlo en PDF) */
  ultimoEnvio = signal<Envio | null>(null);

  registroForm = this.fb.group({
    sku: ['', [Validators.required, skuValidator()]],
    nombre: ['', [Validators.required]],
    categoria: ['', [Validators.required]],
    stockMinimo: [null as number | null, [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^[0-9]+$/)
    ]],
    fechaNacimiento: ['', [Validators.required, fechaNacimientoValidator()]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get skuError(): string {
    const c = this.registroForm.controls.sku;
    if (c.hasError('required')) return 'El código SKU es obligatorio.';
    if (c.hasError('skuInvalido')) return 'Debe tener exactamente 12 caracteres alfanuméricos (sin espacios ni símbolos).';
    return '';
  }

  get stockError(): string {
    const c = this.registroForm.controls.stockMinimo;
    if (c.hasError('required')) return 'El stock mínimo es obligatorio.';
    if (c.hasError('min') || c.hasError('pattern')) return 'Debe ser un número entero mayor que 0.';
    return '';
  }

  get fechaError(): string {
    const c = this.registroForm.controls.fechaNacimiento;
    if (c.hasError('required')) return 'La fecha de nacimiento es obligatoria.';
    if (c.hasError('fechaInvalida')) return 'Introduce una fecha válida.';
    if (c.hasError('fechaFutura')) return 'La fecha de nacimiento no puede ser superior a hoy.';
    return '';
  }

  get passwordError(): string {
    const c = this.registroForm.controls.password;
    if (c.hasError('required')) return 'La contraseña es obligatoria.';
    if (c.hasError('minlength')) return 'La contraseña debe tener al menos 8 caracteres.';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched(); // muestra todos los errores
      return;
    }

    this.isSubmitting.set(true);
    this.registroForm.disable(); // bloquea el formulario mientras guarda

    try {
      const { password, ...resto } = this.registroForm.getRawValue();

      // La contraseña se cifra (SHA-256) antes de mostrarla o guardarla
      const envio: Envio = {
        ...(resto as Omit<Envio, 'passwordCifrada'>),
        passwordCifrada: await cifrarPassword(password ?? ''),
      };
      console.log('Payload a guardar:', envio);

      // Simulación de petición de guardado
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Guardado local
      const guardados = JSON.parse(localStorage.getItem('productos') ?? '[]');
      guardados.push(envio);
      localStorage.setItem('productos', JSON.stringify(guardados));

      this.ultimoEnvio.set(envio);
      this.registroForm.reset();
      await this.mostrarAlerta();
    } catch (error) {
      console.error('Error al guardar', error);
      await this.mostrarToast('Error al guardar el formulario', 'danger');
    } finally {
      this.registroForm.enable();
      this.isSubmitting.set(false);
    }
  }

  /** Genera y descarga un PDF con los datos del último envío */
  async descargarPdf(): Promise<void> {
    const datos = this.ultimoEnvio();
    if (!datos) return;

    const { jsPDF } = await import('jspdf'); // se carga solo cuando hace falta
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Datos del formulario enviado', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 20, 28);

    const filas: [string, string][] = [
      ['Código SKU', datos.sku],
      ['Nombre del producto', datos.nombre],
      ['Categoría', datos.categoria],
      ['Stock mínimo', String(datos.stockMinimo)],
      ['Fecha de nacimiento', new Date(datos.fechaNacimiento).toLocaleDateString('es-ES')],
      ['Contraseña', '******** (cifrada, no se muestra)'],
    ];

    doc.setFontSize(12);
    let y = 45;
    for (const [campo, valor] of filas) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${campo}:`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(valor, 75, y);
      y += 10;
    }

    doc.save(`formulario-${datos.sku}.pdf`);
  }

  private async mostrarAlerta(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Formulario enviado',
      message: 'El formulario se ha enviado correctamente.',
      buttons: ['Aceptar'],
    });
    await alert.present();
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
