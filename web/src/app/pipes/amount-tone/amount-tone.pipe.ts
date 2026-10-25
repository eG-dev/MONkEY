import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'amountTone' })
export class AmountTonePipe implements PipeTransform {
  transform(value: string | null): string {
    return value === null ? 'muted' : value.startsWith('-') ? 'amount-negative' : /[1-9]/.test(value) ? 'amount-positive' : 'amount-zero';
  }
}
