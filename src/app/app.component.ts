import { Component, ElementRef, ViewChild } from "@angular/core";
import { CameraComponent } from "./camera.component";
import { CameraService } from "./camera.service";
export const enum MODE {
  IDLE = "idle",
  CAMERA = "camera",
  FLASHING = "flashing",
  PROCESSING = "processing",
  UNAUTHORIZED = "unauthorized",
}

@Component({
  selector: "app-root",
  template: `
    <div #flashEffectRef></div>
    <main [ngStyle]="{ width: width + 'px' }">
      <app-camera
        #cameraRef
        [width]="width"
        [height]="height"
        [selectedEffect]="selectedEffect"
        (onCameraStatus)="onCameraStatusChange($event)"
        (onFlash)="flashEffect()"
      ></app-camera>
    </main>

    <select (change)="onDeviceSelect($event)">
      <option *ngFor="let device of availableDevices" [value]="device.deviceId">{{ device.label }}</option>
    </select>

    <select (change)="onEffectSelect($event)">
      <option *ngFor="let effect of effects" [value]="effect.label">{{ effect.label }}</option>
    </select>
  `,
  styles: [
    `
      :host {
        display: flex;
        min-width: 100%;
        min-height: 100%;
        max-width: 100%;
        max-height: 100%;
        position: relative;
        align-items: center;
        flex-direction: column;
      }
      .flash-effect {
        background: white;
        opacity: 0;
        animation-name: flash;
        animation-duration: 0.6s;
        animation-timing-function: cubic-bezier(0.26, 0.79, 0.72, 0.5);
        position: absolute;
        top: 0;
        bottom: 0;
        width: 200%;
        height: 200%;
        z-index: 1;
        left: -50%;
        right: 0;
        margin: 0;
        padding: 0;
        display: block;
      }
      main {
        border: 1px solid #474444;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 4px;
        background: #585454;
      }

      @keyframes flash {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class AppComponent {
  @ViewChild("cameraRef", { static: true }) cameraRef: CameraComponent;
  @ViewChild("flashEffectRef", { static: true }) flashEffectRef: ElementRef;
  mode: MODE;
  width: number = 1280;
  height: number = 720;
  availableDevices: Array<{ deviceId: string; label: string }>;

  selectedDeviceId: string;
  selectedEffect: { label: string; args: number[] };
  effects = [
    { label: "none" },
    { label: "negative" },
    { label: "brightness", args: [1.5] },
    { label: "saturation", args: [1.5] },
    { label: "contrast", args: [1.5] },
    { label: "hue", args: [180] },
    { label: "desaturate" },
    { label: "desaturateLuminance" },
    { label: "brownie" },
    { label: "sepia" },
    { label: "vintagePinhole" },
    { label: "kodachrome" },
    { label: "technicolor" },
    { label: "detectEdges" },
    { label: "sharpen" },
    { label: "emboss" },
    { label: "blur", args: [7] },
  ];

  constructor(private cameraService: CameraService) {
    this.setMode(MODE.IDLE);
  }

  async ngOnInit() {
    this.availableDevices = await this.cameraService.getVideosDevices();
  }

  onCameraStatusChange(status: boolean) {
    this.setMode(status ? MODE.CAMERA : MODE.IDLE);
  }

  onEffectSelect(event: any /* Event */) {
    const effectLabel = event.target.value;
    this.selectedEffect = {
      label: effectLabel,
      args: this.effects.filter((effect) => effect.label === effectLabel).pop().args,
    };
  }

  async onDeviceSelect(event: any /* Event */) {
    this.selectedDeviceId = event.target.value;
    await this.cameraRef.restartMediaStream();
  }

  flashEffect() {
    this.setMode(MODE.FLASHING);
    this.flashEffectRef.nativeElement.classList.add("flash-effect");
    setTimeout((_) => {
      this.flashEffectRef.nativeElement.classList.remove("flash-effect");
      this.setMode(MODE.IDLE);
    }, 2000 /* pause for 2 seconds before taking the next picture */);
  }

  private setMode(mode: MODE) {
    this.mode = mode;
  }
}
