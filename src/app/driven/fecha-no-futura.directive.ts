import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { fechaHoy } from '../shared/seguridad';

/**
 * Validador personalizado para formularios Template-Driven:
 * en este modelo los validadores se aplican como directivas en el HTML.
 */
@Directive({
  selector: '[appFechaNoFutura][ngModel]',
  providers: [{ provide: NG_VALIDATORS, useExisting: FechaNoFuturaDirective, multi: true }],
})
export class FechaNoFuturaDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const valor = control.value;
    if (!valor) return null;
    return valor > fechaHoy() ? { fechaFutura: true } : null;
  }
}
