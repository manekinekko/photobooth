import { Injectable } from "@angular/core";
import { VirtualMediaDevice } from "./virtual-device.class";

@Injectable({
  providedIn: "root",
})
export class DeviceSourceService {
  installVirtualMediaDevice() {
    new VirtualMediaDevice();
  }
}
