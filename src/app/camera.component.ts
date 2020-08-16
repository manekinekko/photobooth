import { Component, OnInit, Output, EventEmitter, ElementRef, ViewChild, Input, Renderer2 } from "@angular/core";
import { CameraService } from "./camera.service";
import { BlobService } from "./blob.service";
import { CounterComponent } from "./counter.component";

@Component({
  selector: "app-camera",
  template: `
    <video #videoRef [width]="videoWidth" [height]="videoHeight" hidden autoplay muted></video>
    <main [ngStyle]="{ width: videoWidth + 'px' }">
      <canvas #canvasRef [width]="videoWidth" [height]="videoHeight"></canvas>

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
        border-bottom: 1px solid black;
      }
      main {
        border: 1px solid black;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 4px;
        background: #242424;
      }
      section {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
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

  // Pixel 2 screen dimensions
  videoHeight = 480;
  videoWidth = 720;

  temporaryContext: CanvasRenderingContext2D;
  isCameraOn: boolean;
  selectedDeviceId: string;
  availableDevices: any[];
  isCounterHidden: boolean;

  constructor(private camera: CameraService, private blob: BlobService, private render: Renderer2) {
    this.onCapture = new EventEmitter<Blob>();
    this.onCameraStatus = new EventEmitter<boolean>();
    this.onFlash = new EventEmitter<void>();
    this.isCameraOn = true;
    this.isCounterHidden = true;
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

  triggerCapture() {
    this.isCounterHidden = true;
    this.onFlash.emit();
    // todo capture image
  }

  private async startMediaStream() {
    const mediaStream = await this.camera.getUserMedia(this.selectedDeviceId);
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
