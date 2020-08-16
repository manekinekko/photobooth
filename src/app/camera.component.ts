import { Component, OnInit, Output, EventEmitter, ElementRef, ViewChild, Input, Renderer2 } from "@angular/core";
import { CameraService } from "./camera.service";
import { BlobService } from "./blob.service";
import { CounterComponent } from "./counter.component";
import { SafeUrl, DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-camera",
  template: `
    <video #videoRef [width]="videoWidth" [height]="videoHeight" hidden autoplay muted></video>
    <main [ngStyle]="{ width: videoWidth + 'px' }">
      <canvas #canvasRef [width]="videoWidth" [height]="videoHeight"></canvas>

      <section>
        <ul class="camera-roll">
          <li class="camera-roll-item" *ngFor="let pic of pictures">
            <img [src]="pic" height="50" />
          </li>
        </ul>
      </section>

      <section>
        <button (click)="startCounter()">
          <img src="assets/camera.png" width="64" height="64" alt="capture icon" />
        </button>
        <app-counter #counterRef [hidden]="isCounterHidden" [value]="3" (onCounterEnd)="triggerCapture()"></app-counter>
      </section>
    </main>

    <select (change)="onCameraSelect($event)">
      <option *ngFor="let device of availableDevices" [value]="device.deviceId">{{ device.label }}</option>
    </select>
  `,
  styles: [
    `
      :host {
        position: relative;
      }
      [hidden] {
        display: none;
      }
      canvas {
        border-bottom: 1px solid #474444;
      }
      main {
        border: 1px solid #474444;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 4px;
        background: #585454;
      }
      section {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
      }
      button {
        background: transparent;
        border: 0 none;
        display: block;
        width: 64px;
        height: 64px;
        margin: 10px;
        border-radius: 50%;
      }
      button img {
        border-radius: 50%;
      }
      app-counter {
        position: absolute;
        display: flex;
        width: 720px;
        height: 83px;
        padding: 1px;
        border-radius: 0 0 4px 4px;
      }
      .camera-roll {
        border-bottom: 1px solid #474444;
        display: flex;
        width: 100%;
        padding: 0px;
        height: 55px;
        margin: 0;
        position: relative;
        overflow: scroll;
      }
      .camera-roll-item {
        display: inline-block;
        margin: 2px;
        border-radius: 2px;
        animation: 1s bounce;
        animation-timing-function: cubic-bezier(.6,.4,.54,1.12);
      }
      @keyframes bounce {
        0%,60% { transform: translateY(-52px); }
        70% {
          transform: translateY(0);
        }
        75% {
          transform: translateY(-30px);
        }
        70% {
          transform: translateY(0);
        }
        80% {
          transform: translateY(-20px);
        }
        100% {
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class CameraComponent implements OnInit {
  @Output() onCapture: EventEmitter<Blob>;
  @Output() onCameraStatus: EventEmitter<boolean>;
  @Output() onFlash: EventEmitter<void>;

  @ViewChild("videoRef", { static: true }) videoRef: ElementRef;
  @ViewChild("canvasRef", { static: true }) canvasRef: ElementRef;
  @ViewChild("counterRef", { static: true }) counterRef: CounterComponent;

  @Input() width: number = 720;
  @Input() height: number = 480;

  videoHeight = 480;
  videoWidth = 720;
  temporaryContext: CanvasRenderingContext2D;
  isCameraOn: boolean;
  selectedDeviceId: string;
  availableDevices: Array<{ deviceId: string; label: string }>;
  isCounterHidden: boolean;
  pictures: Array<SafeUrl>;

  constructor(
    private camera: CameraService,
    private blob: BlobService,
    private render: Renderer2,
    private domSanitizationService: DomSanitizer
  ) {
    this.onCapture = new EventEmitter<Blob>();
    this.onCameraStatus = new EventEmitter<boolean>();
    this.onFlash = new EventEmitter<void>();
    this.isCameraOn = true;
    this.isCounterHidden = true;
    this.pictures = [];
  }

  async ngOnInit() {
    this.temporaryContext = this.canvasRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;
    this.availableDevices = await this.camera.getVideosDevices();

    this.videoRef.nativeElement.onload = () => {
      this.isCameraOn = true;
    };

    this.videoRef.nativeElement.canplay = () => {
      this.computeValues();
    };

    this.startMediaStream();
  }

  async onCameraSelect(event: any) {
    this.selectedDeviceId = event.target.value;
    await this.restartMediaStream();
  }

  startCounter() {
    this.isCounterHidden = false;
    this.counterRef.start();
  }

  async triggerCapture() {
    // emit the flash animation...
    this.onFlash.emit();

    setTimeout(async () => {
      // ... but leave some time for the flash animation to happen before closing the counter section.
      this.isCounterHidden = true;

      const file = await this.confirmCapture();

      const imageUrl = (window.URL || window.webkitURL).createObjectURL(file);
      this.pictures.push(this.domSanitizationService.bypassSecurityTrustUrl(imageUrl));
      this.onCapture.emit(file);
    }, 500);
  }

  private confirmCapture(): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      // draw the video into the temporary canvas
      this.temporaryContext.drawImage(this.videoRef.nativeElement, 0, 0, this.videoWidth, this.videoHeight);

      // get a blob from the canvas
      const blob = await this.blob.toBlob(this.canvasRef.nativeElement, "image/png");
      resolve(blob);
    });
  }

  private async startMediaStream() {
    const mediaStream = await this.camera.getUserMedia({ deviceId: this.selectedDeviceId });
    this.videoRef.nativeElement.srcObject = mediaStream;

    this.streaming();

    this.isCameraOn = true;
    this.onCameraStatus.emit(true);
  }

  private async restartMediaStream() {
    this.videoRef.nativeElement.srcObject = null;
    await this.startMediaStream();
  }

  private streaming() {
    if (this.isCameraOn) {
      this.temporaryContext.drawImage(this.videoRef.nativeElement, 0, 0, this.videoWidth, this.videoHeight);
      requestAnimationFrame(this.streaming.bind(this));
    }
  }

  private computeValues() {
    const videoWidth = document.body.clientWidth;
    const videoHeight = document.body.clientHeight;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    const canvas = this.canvasRef.nativeElement;

    this.render.setProperty(canvas, "width", videoWidth);
    this.render.setProperty(canvas, "height", videoHeight);
    this.render.setAttribute(canvas, "width", `${videoWidth}`);
    this.render.setAttribute(canvas, "height", `${videoHeight}`);
  }
}
