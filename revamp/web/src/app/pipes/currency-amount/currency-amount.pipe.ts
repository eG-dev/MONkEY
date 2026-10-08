import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyAmount' })
export class CurrencyAmountPipe implements PipeTransform {
  transform(value: string, locale: string, currency: string): string {
    const [whole, fraction] = value.split('.');
    const formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const integer = BigInt(whole);
    const amount = formatter
      .formatToParts(integer === 0n && whole.startsWith('-') ? -0 : integer)
      .map((part) => (part.type === 'fraction' ? fraction : part.value))
      .join('');
    const symbol = currency === 'EUR' ? '\u20ac' : currency === 'USD' ? '$' : currency;

    return `${amount}\u00a0${symbol}`;
  }
}
