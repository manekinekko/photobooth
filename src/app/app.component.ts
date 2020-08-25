import { Component, ElementRef, ViewChild } from "@angular/core";
import { Store } from "@ngxs/store";
import { AddPicture, SelectPictureData } from "./camera-roll/camera-roll.state";
import { CameraComponent } from "./camera/camera.component";
import { CameraService } from "./camera/camera.service";
import { CameraRollService } from "./camera-roll/camera-roll.service";
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
        [width]="width"
        [height]="height"
        [selectedFilter]="selectedFilter"
        (onCameraStatus)="onCameraStatusChange($event)"
        (onCapture)="onCapture($event)"
        (onFlash)="flashEffect()"
      >
        <app-camera-roll
          (onEmptyPictures)="onEmptyPictures()"
          (onPictureSelected)="onPictureSelected($event)"
        ></app-camera-roll>
      </app-camera>
    </main>

    <select (change)="onDeviceSelect($event)">
      <option *ngFor="let device of availableDevices" [value]="device.deviceId">{{ device.label }}</option>
    </select>

    <select (change)="onEffectSelect($event)">
      <option *ngFor="let effect of filters" [value]="effect.label">{{ effect.label }}</option>
    </select>
  `,
  styles: [
    `
      :host {
        display: flex;
        position: relative;
        align-items: center;
        flex-direction: column;
        border: 1px solid #474444;
        border-radius: 4px;
        background: #585454;
        width: 1280px;
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
  @ViewChild(CameraComponent, { static: true }) cameraRef: CameraComponent;
  @ViewChild("flashEffectRef", { static: true }) flashEffectRef: ElementRef;
  mode: MODE;
  width: number = 1280;
  height: number = 720;
  availableDevices: Array<{ deviceId: string; label: string }>;

  selectedDeviceId: string;

  selectedFilter: { label: string; args: number[] };

  filters = [
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

  constructor(private cameraService: CameraService, private fileService: CameraRollService, private store: Store) {
    this.setMode(MODE.IDLE);
  }

  async ngOnInit() {
    this.availableDevices = await this.cameraService.getVideosDevices();
  }

  onCameraStatusChange(status: boolean) {
    this.setMode(status ? MODE.CAMERA : MODE.IDLE);
  }

  onEffectSelect(event: any /* Event */) {
    const filterLabel = event.target.value;
    this.selectedFilter = {
      label: filterLabel,
      args: this.filters.filter((effect) => effect.label === filterLabel).pop().args,
    };
  }

  async onDeviceSelect(event: any /* Event */) {
    this.selectedDeviceId = event.target.value;
    await this.cameraRef.restartMediaStream();
  }

  async onCapture(data: string) {
    this.store.dispatch(new AddPicture(data));
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

  onEmptyPictures() {
    this.cameraRef.startMediaStream();
  }

  onPictureSelected(picture: SelectPictureData) {
    this.cameraRef.stopMediaStream();
    this.cameraRef.previewSelectedPicture(picture.data);
  }
}
