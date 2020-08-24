import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { BlobService } from "./blob.service";
import { CameraService } from "./camera.service";
import { StartTimer, TimerState } from "../timer/timer.state";
import { TimerComponent } from "../timer/timer.component";
import { WebGLFilter } from "./webgl-filter";

@Component({
  selector: "app-camera",
  template: `
    <video #videoRef hidden autoplay muted></video>
    <canvas #canvasTmpRef hidden [width]="width" [height]="height"></canvas>

    <canvas #canvasRef [width]="width" [height]="height"></canvas>

    <ng-content></ng-content>

    <section>
      <button (click)="startTimer()">
        <img src="assets/camera.png" width="64" height="64" alt="capture icon" />
      </button>
      <app-timer
        [hidden]="!(timerIsTicking$ | async)"
        [value]="3"
        (onTimerTick)="onTimerTick($event)"
        (onTimerEnd)="triggerCapture()"
      ></app-timer>
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
      app-timer {
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
  @ViewChild(TimerComponent, { static: true }) timerRef: TimerComponent;

  @Input() width: number = 1280;
  @Input() height: number = 720;
  @Input() deviceId: string;
  @Input() selectedFilter: { label: string; args: number[] };
  canvasContextRef: CanvasRenderingContext2D;
  canvasTmpContextRef: CanvasRenderingContext2D;
  isCameraOn: boolean;
  mediaStream: MediaStream;

  @Select(TimerState.isTicking) timerIsTicking$: Observable<boolean>;

  constructor(private cameraService: CameraService, private blobService: BlobService, private store: Store) {
    this.onCapture = new EventEmitter<string>();
    this.onCameraStatus = new EventEmitter<boolean>();
    this.onFlash = new EventEmitter<void>();
    this.isCameraOn = true;
  }

  async ngOnInit() {
    this.canvasContextRef = this.canvasRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;
    this.canvasTmpContextRef = this.canvasTmpRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;

    this.videoRef.nativeElement.onload = () => {
      this.isCameraOn = true;
    };

    this.startMediaStream();
  }

  async startTimer() {
    if (this.isCameraOn === false) {
      await this.startMediaStream();
    }

    this.store.dispatch(new StartTimer());
  }

  onTimerTick(data: { time: number }) {
    if (data.time === 0) {
      // emit the flash animation...
      this.onFlash.emit();
    }
  }

  async triggerCapture() {
    const file = await this.confirmCapture();
    const data = await this.blobService.toBase64(file);

    this.onCapture.emit(data);
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
