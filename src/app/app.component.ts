import { Component, ElementRef, ViewChild } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { AppService } from "./app.service";
import { AddPicture, SelectPictureData } from "./camera-roll/camera-roll.state";
import { CameraComponent } from "./camera/camera.component";
import { CameraState, PreviewPictureData, StartMediaStream, StopMediaStream } from "./camera/camera.state";
import { PresetFilter } from "./filters-preview/filters-preview.component";

@Component({
  selector: "app-root",
  template: `
    <app-filters-preview
      [ngStyle]="{ width: width + 'px' }"
      (onFilterSelected)="onFilterSelected($event)"
    ></app-filters-preview>

    <div #flashEffectRef></div>
    <main [ngStyle]="{ width: width + 'px' }">
      <app-camera
        [width]="width"
        [height]="height"
        [selectedFilters]="selectedFilters"
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

    <app-device-source [source]="activeSource" (onDeviceSelected)="onDeviceSelected($event)"></app-device-source>

    <footer>
      Made by <a href="https://twitter.com/@manekinekko">@manekinekko</a> (<a
        target="__blank"
        href="https://github.com/manekinekko/photobooth-teams"
        >_BUILD_HASH_</a
      >)
    </footer>
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
        padding: 10px 0 0;
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

      footer {
        font-size: 10px;
        right: 4px;
        position: absolute;
        bottom: 5px;
      }
      footer,
      footer a {
        color: white;
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
  aspectRatio;

  selectedFilters: Array<PresetFilter>;

  activeSource: string;
  @Select(CameraState.source) activeSource$: Observable<string>;

  constructor(private store: Store, private app: AppService) {
    this.aspectRatio = this.app.computeCameraAspectRatio();
  }

  async ngOnInit() {
    this.width = this.width * this.aspectRatio;
    this.height = this.height * this.aspectRatio;
  }

  onDeviceSelected(selectedDeviceId: string) {
    this.activeSource = selectedDeviceId;
  }

  onCameraStart(activeSource: string) {
    this.activeSource = activeSource;
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
    this.store.dispatch(new StartMediaStream(this.activeSource));
  }

  onPictureSelected(picture: SelectPictureData) {
    this.store.dispatch([new StopMediaStream(), new PreviewPictureData(picture.data)]);
  }

  onFilterSelected(filters: Array<PresetFilter>) {
    this.selectedFilters = filters;
  }
}
