import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { BlobService } from "./blob.service";
import { CameraService } from "./camera.service";
import { CounterComponent } from "./counter.component";
import { WebGLFilter } from "./webgl-filter";

@Component({
  selector: "app-camera",
  template: `
    <video #videoRef hidden autoplay muted></video>
    <canvas #canvasTmpRef hidden [width]="width" [height]="height"></canvas>

    <canvas #canvasRef [width]="width" [height]="height"></canvas>

    <ng-content></ng-content>

    <section>
      <button (click)="startCounter()">
        <img src="assets/camera.png" width="64" height="64" alt="capture icon" />
      </button>
      <app-counter #counterRef [hidden]="isCounterHidden" [value]="3" (onCounterEnd)="triggerCapture()"></app-counter>
    </section>
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
        width: 1280px;
        height: 83px;
        padding: 1px;
        border-radius: 0 0 4px 4px;
      }
    `,
  ],
})
export class CameraComponent implements OnInit {
  @Output() onCapture: EventEmitter<string>;
  @Output() onCameraStatus: EventEmitter<boolean>;
  @Output() onFlash: EventEmitter<void>;

  @ViewChild("videoRef", { static: true }) videoRef: ElementRef<HTMLVideoElement>;
  @ViewChild("canvasRef", { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;
  @ViewChild("canvasTmpRef", { static: true }) canvasTmpRef: ElementRef<HTMLCanvasElement>;
  @ViewChild("counterRef", { static: true }) counterRef: CounterComponent;

  @Input() width: number = 1280;
  @Input() height: number = 720;
  @Input() deviceId: string;
  @Input() selectedFilter: { label: string; args: number[] };
  canvasContextRef: CanvasRenderingContext2D;
  canvasTmpContextRef: CanvasRenderingContext2D;
  isCameraOn: boolean;
  mediaStream: MediaStream;
  isCounterHidden: boolean;

  constructor(private cameraService: CameraService, private blobService: BlobService) {
    this.onCapture = new EventEmitter<string>();
    this.onCameraStatus = new EventEmitter<boolean>();
    this.onFlash = new EventEmitter<void>();
    this.isCameraOn = true;
    this.isCounterHidden = true;
  }

  async ngOnInit() {
    this.height = this.height;
    this.width = this.width;

    this.canvasContextRef = this.canvasRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;
    this.canvasTmpContextRef = this.canvasTmpRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;

    this.videoRef.nativeElement.onload = () => {
      this.isCameraOn = true;
    };

    this.startMediaStream();
  }

  async startCounter() {
    if (this.isCameraOn === false) {
      await this.startMediaStream();
    }

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
      const data = await this.blobService.toBase64(file);

      this.onCapture.emit(data);
    }, 500);
  }

  async previewSelectedPicture(data: string) {
    const image = new Image();
    image.onload = () => this.canvasContextRef.drawImage(image, 0, 0, this.width, this.height);
    image.src = data;
  }

  private confirmCapture(): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      const blob = await this.blobService.toBlob(this.canvasRef.nativeElement, "image/png");
      resolve(blob);
    });
  }

  stopMediaStream() {
    this.isCameraOn = false;
    this.mediaStream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  async startMediaStream() {
    const mediaStream = await this.cameraService.getUserMedia({ deviceId: this.deviceId });
    this.mediaStream = mediaStream;
    this.videoRef.nativeElement.srcObject = mediaStream;
    let { width, height } = mediaStream.getTracks()[0].getSettings();
    this.videoRef.nativeElement.width = width;
    this.videoRef.nativeElement.height = height;

    this.isCameraOn = true;
    this.onCameraStatus.emit(true);

    // this.stream();
    this.stream(new WebGLFilter());
  }

  async restartMediaStream() {
    this.videoRef.nativeElement.srcObject = null;
    await this.startMediaStream();
  }

  private stream(filter?: WebGLFilter) {
    if (this.isCameraOn) {
      try {
        if (this.selectedFilter?.label) {
          // use WebGL filtered stream

          this.canvasTmpContextRef.drawImage(this.videoRef.nativeElement, 0, 0, this.width, this.height);
          const filteredImage = filter.apply(this.canvasTmpRef.nativeElement);

          filter.reset();
          filter.addFilter(this.selectedFilter.label, this.selectedFilter.args);

          this.canvasContextRef.drawImage(filteredImage, 0, 0, this.width, this.height);
        } else {
          // use direct stream (no filters)

          this.canvasContextRef.drawImage(this.videoRef.nativeElement, 0, 0, this.width, this.height);
        }
      } catch (err) {
        console.log(err);
      }

      requestAnimationFrame(() => this.stream(filter));
    }
  }
}
