import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeGUID'
})
export class RemoveGUIDPipe implements PipeTransform {
  transform(value) {
      if (!value) return;
      return value.substring(37);
    }
}