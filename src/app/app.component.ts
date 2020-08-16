import { Component, ElementRef, ViewChild } from "@angular/core";
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
    <div>
      <div>
        <app-camera
          #cameraRef
          (onCameraStatus)="onCameraStatusChange($event)"
          (onCapture)="prepare($event)"
          (onFlash)="flashEffect()"
        ></app-camera>
      </div>
    </div>
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
        animation-timing-function: cubic-bezier(.6,.4,.54,1.12);
        position: absolute;
        top: 0;
        border: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
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
  @ViewChild("flashEffectRef", { static: true }) flashEffectRef: ElementRef;
  mode: MODE;

  constructor() {
    this.setMode(MODE.IDLE);
  }

  onCameraStatusChange(status: boolean) {
    this.setMode(status ? MODE.CAMERA : MODE.IDLE);
  }

  flashEffect() {
    this.setMode(MODE.FLASHING);
    this.flashEffectRef.nativeElement.classList.add("flash-effect");
    setTimeout((_) => {
      this.flashEffectRef.nativeElement.classList.remove("flash-effect");
      this.setMode(MODE.IDLE);
    }, 2000 /* pause for 2 seconds before taking the next picture */);
  }

  async prepare(file: Blob) {
    this.setMode(MODE.PROCESSING);
  }

  private setMode(mode: MODE) {
    this.mode = mode;
  }
}
