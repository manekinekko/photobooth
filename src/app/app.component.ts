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
        <app-camera #cameraRef (onCameraStatus)="onCameraStatusChange($event)" (onFlash)="flashEffect()"></app-camera>
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

  private setMode(mode: MODE) {
    this.mode = mode;
  }
}
