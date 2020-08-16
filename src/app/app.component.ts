import { Component, ElementRef, ViewChild } from "@angular/core";

export const enum MODE {
  IDLE = "idle",
  CAMERA = "camera",
  PROCESSING = "processing",
  UNAUTHORIZED = "unauthorized",
}

@Component({
  selector: "app-root",
  template: `
    <div #backdropRef></div>
    <div>
      <div>
        <app-camera
          #cameraRef
          (onCameraStatus)="onCameraStatusChange($event)"
          (onCapture)="prepare($event)"
          (onFlash)="flashEffect()"
        ></app-camera>
      </div>
      <ul>
        <li *ngFor="let c of captures">
          <img src="{{ c }}" height="50" />
        </li>
      </ul>
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
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
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
  @ViewChild("backdropRef", { static: true }) backdropRef: ElementRef;
  mode: MODE;
  fileBlob: Blob;
  captures = [];

  constructor() {}

  onCameraStatusChange(status: boolean) {
    this.setMode(status ? MODE.CAMERA : MODE.IDLE);
  }

  flashEffect() {
    this.backdropRef.nativeElement.classList.add("flash-effect");
    setTimeout((_) => {
      this.backdropRef.nativeElement.classList.remove("flash-effect");
    }, 3000);
  }

  private setMode(mode: MODE) {
    this.mode = mode;
  }

  async prepare(event: any /* Blob|FileList */) {
    const file = await this.resize(event.target.files[0]);

    this.setMode(MODE.PROCESSING);
    this.fileBlob = file;
  }
  private resize(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (event: any) {
        const image = new Image();
        image.src = event.target.result;

        image.onload = function () {
          let maxWidth = 400,
            maxHeight = 400,
            imageWidth = image.width,
            imageHeight = image.height;

          if (imageWidth > imageHeight) {
            if (imageWidth > maxWidth) {
              imageHeight *= maxWidth / imageWidth;
              imageWidth = maxWidth;
            }
          } else {
            if (imageHeight > maxHeight) {
              imageWidth *= maxHeight / imageHeight;
              imageHeight = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = imageWidth;
          canvas.height = imageHeight;
          image.width = imageWidth;
          image.height = imageHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, imageWidth, imageHeight);
          canvas.toBlob((blob) => resolve(blob), "image/png");
        };
      };

      reader.readAsDataURL(file);
    });
  }
}
