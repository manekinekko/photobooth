import { Component, ElementRef, ViewChild } from "@angular/core";
import { Store } from "@ngxs/store";
import { AddPicture, SelectPictureData } from "./camera-roll/camera-roll.state";
import { CameraComponent } from "./camera/camera.component";
import { CameraService } from "./camera/camera.service";
import { PreviewPictureData, StartMediaStream, StopMediaStream, SwitchCameraDevice } from "./camera/camera.state";

@Component({
  selector: "app-root",
  template: `
    <section class="selection">
      <select id="source" (change)="onDeviceSelect($event)" [value]="selectedDeviceId">
        <option *ngFor="let device of availableDevices" [value]="device.deviceId">{{
          device.label | deviceIdFormat
        }}</option>
      </select>
    </section>

    <app-filters (onFilterSelect)="onFilterSelect($event)"></app-filters>
    
    <div #flashEffectRef></div>
    <main [ngStyle]="{ width: width + 'px' }">
      <app-camera
        [width]="width"
        [height]="height"
        [selectedFilter]="selectedFilter"
        (onCameraStart)="onCameraStart($event)"
        (onCapture)="onCapture($event)"
        (onFlash)="flashEffect($event)"
      >
        <app-camera-roll
          (onEmptyPictures)="onEmptyPictures()"
          (onPictureSelected)="onPictureSelected($event)"
        ></app-camera-roll>
      </app-camera>
    </main>
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
        padding: 10px
      }
      .flash-effect {
        background: white;
        opacity: 0;
        animation-name: flash;
        animation-duration: 0.8s;
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

      select::-ms-expand {
        display: none;
      }

      .selection {
        position: relative;
        display: flex;
        height: 30px;
        line-height: 1.9;
        background: #343232;
        overflow: hidden;
        border-radius: 30px;
        padding: 0px 14px;
        margin: 10px;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.6);
      }

      .selection select {
        appearance: none;
        outline: 0;
        width: 200px;
        text-align-last: center;
        box-shadow: none;
        border: 0 !important;
        background: #343232;
        background-image: none;
        flex: 1;
        padding: 0 0.5em;
        color: #fff;
        cursor: pointer;
      }

      .selection::after {
        content: "▼";
        position: absolute;
        top: 4px;
        right: 0;
        padding: 0 1em;
        background: #343232;
        cursor: pointer;
        pointer-events: none;
        transition: 0.25s all ease;
        font-size: 13px;
      }

      .selection:hover::after {
        color: #8e8e8e;
      }

      @keyframes flash {
        from {
          opacity: 0;
        }
        70%,
        100% {
          opacity: 1;
        }
      }
    `,
  ],
})
export class AppComponent {
  @ViewChild(CameraComponent, { static: true }) cameraRef: CameraComponent;
  @ViewChild("flashEffectRef", { static: true }) flashEffectRef: ElementRef;
  width: number = 1280;
  height: number = 720;
  aspectRatio = 0.70;
  availableDevices: Array<{ deviceId: string; label: string }>;

  selectedDeviceId: string;

  selectedFilter: { label: string; args: number[] };

  constructor(private cameraService: CameraService, private store: Store) {}

  async ngOnInit() {
    this.availableDevices = await this.cameraService.getVideosDevices();
    this.selectedDeviceId = this.availableDevices[0].deviceId;

    this.width = this.width * this.aspectRatio;
    this.height = this.height * this.aspectRatio;
  }

  onCameraStart(activeDeviceId: string) {
    this.selectedDeviceId = activeDeviceId;
  }

  onDeviceSelect(event: any /* Event */) {
    this.selectedDeviceId = event.target.value;
    this.store.dispatch(new SwitchCameraDevice(this.selectedDeviceId));
  }

  onCapture(capturedPicture: { data: string }) {
    this.store.dispatch(new AddPicture(capturedPicture.data));
  }

  flashEffect(duration: number) {
    this.flashEffectRef.nativeElement.classList.add("flash-effect");
    setTimeout((_) => {
      this.flashEffectRef.nativeElement.classList.remove("flash-effect");
    }, duration * 1000 /* pause for 2 seconds before taking the next picture */);
  }

  onEmptyPictures() {
    this.store.dispatch(new StartMediaStream(this.selectedDeviceId));
  }

  onPictureSelected(picture: SelectPictureData) {
    this.store.dispatch(new StopMediaStream());
    this.store.dispatch(new PreviewPictureData(picture.data));
  }

  onFilterSelect(filter: any) {
    this.selectedFilter = filter;
  }
}
