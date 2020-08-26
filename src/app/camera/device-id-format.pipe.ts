import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "deviceIdFormat",
})
export class DeviceIdFormatPipe implements PipeTransform {
  transform(value: string, ...args: unknown[]): unknown {
    const index = value.indexOf("(");
    return index === -1 ? value : value.substring(0, index);
  }
}
