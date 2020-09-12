import { Injectable } from "@angular/core";
import { VirtualMediaDevice } from "./virtual-device.class";

@Injectable({
  providedIn: "root",
})
export class DeviceSourceService {
  installVirtualMediaDevice() {
    new VirtualMediaDevice();
  }

  saveSourceId(sourceId: string) {
    localStorage.setItem('photobooth-device-source', sourceId);
  }
  restoreSourceId() {
    return localStorage.getItem('photobooth-device-source');
  }
}
