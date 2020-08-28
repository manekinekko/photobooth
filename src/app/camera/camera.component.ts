import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from "@angular/core";
import { Actions, ofActionSuccessful, Select, Store } from "@ngxs/store";
import * as facemesh from "@tensorflow-models/facemesh";
import { Observable } from "rxjs";
import { delay } from "rxjs/operators";
import { UnselectPicture } from "../camera-roll/camera-roll.state";
import { EffectFilter } from "../filters-preview/filters-preview.component";
import { WebGLFilter } from "../shared/webgl-filter.class";
import { TimerComponent } from "../timer/timer.component";
import { StartTimer, TimerState } from "../timer/timer.state";
import { CameraState, CapturePicture, CapturePictureData, StartMediaStream, StopMediaStream } from "./camera.state";


@Component({
  selector: "app-camera",
  template: `
    <video #videoRef hidden autoplay playsinline muted></video>
    <canvas #canvasTmpRef hidden [width]="width" [height]="height"></canvas>

    <ng-content select="app-filters"></ng-content>
    <canvas #canvasMeshRef [hidden]="!isMeshOn" [width]="width" [height]="height" style="position: absolute"></canvas>
    <canvas #canvasRef [width]="width" [height]="height"></canvas>
    <ng-content select="app-camera-roll"></ng-content>

    <section>
      <button (click)="startTimer()">
        <img src="assets/camera.png" width="64" height="64" alt="capture icon" />
      </button>
      <app-timer
        [ngStyle]="{ width: width + 'px' }"
        [hidden]="!(timerIsTicking$ | async)"
        [value]="3"
        (onTimerStart)="onTimerStart()"
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
      button[disabled] {
        filter: grayscale();
      }
      button img {
        border-radius: 50%;
      }
      app-timer {
        position: absolute;
        display: flex;
        height: 83px;
        padding: 1px;
        border-radius: 0 0 4px 4px;
      }
    `,
  ],
})
export class CameraComponent implements OnInit {
  @Output() onCapture: Observable<string>;
  @Output() onCameraStart: EventEmitter<string>;
  @Output() onCameraStatus: EventEmitter<boolean>;
  @Output() onFlash: EventEmitter<number>;

  @ViewChild("videoRef", { static: true }) videoRef: ElementRef<HTMLVideoElement>;
  @ViewChild("canvasRef", { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;
  @ViewChild("canvasMeshRef", { static: true }) canvasMeshRef: ElementRef<HTMLCanvasElement>;
  @ViewChild("canvasTmpRef", { static: true }) canvasTmpRef: ElementRef<HTMLCanvasElement>;
  @ViewChild(TimerComponent, { static: true }) timerRef: TimerComponent;

  @Input() width: number = 1280;
  @Input() height: number = 720;
  @Input() deviceId: string;
  @Input() selectedFilter: Partial<EffectFilter>;
  canvasContextRef: CanvasRenderingContext2D;
  canvasMeshContextRef: CanvasRenderingContext2D;
  canvasTmpContextRef: CanvasRenderingContext2D;

  isCameraOn: boolean;

  mediaStream: MediaStream;
  flashDuration = 2; // in seconds

  model;
  isMeshOn = false;

  @Select(TimerState.isTicking) timerIsTicking$: Observable<boolean>;
  @Select(CameraState.mediaStream) mediaStream$: Observable<MediaStream>;
  @Select(CameraState.preview) preview$: Observable<string>;

  constructor(private store: Store, private actions$: Actions) {
    this.onCapture = this.actions$.pipe(ofActionSuccessful(CapturePictureData));
    this.onCameraStatus = new EventEmitter<boolean>();
    this.onCameraStart = new EventEmitter<string>();
    this.onFlash = new EventEmitter<number>();
  }

  async ngOnInit() {
    this.canvasContextRef = this.canvasRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;
    this.canvasMeshContextRef = this.canvasMeshRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;
    this.canvasTmpContextRef = this.canvasTmpRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;

    this.videoRef.nativeElement.onloadedmetadata = async () => {
      this.videoRef.nativeElement.width = this.width;
      this.videoRef.nativeElement.height = this.height;

      this.model = await facemesh.load();
      // load first predictions
      await this.printFaceWireframe();
      
    };

    this.preview$.subscribe((preview) => {
      if (preview) {
        const image = new Image();
        image.onload = () => this.canvasContextRef.drawImage(image, 0, 0, this.width, this.height);
        image.src = preview;
      }
    });

    this.mediaStream$.subscribe(async (mediaStream) => {
      // Note: when stopping the device, mediaStream is set to null.
      this.mediaStream = mediaStream;
      this.isCameraOn = !!mediaStream;
      this.onCameraStatus.emit(this.isCameraOn);
      this.videoRef.nativeElement.srcObject = mediaStream;

      if (mediaStream) {
        let { width, height, deviceId } = mediaStream.getTracks()[0].getSettings();
        this.videoRef.nativeElement.width = width;
        this.videoRef.nativeElement.height = height;

        window.requestAnimationFrame(async () => await this.loop(new WebGLFilter()));

        this.onCameraStart.emit(deviceId);
      }
    });

    this.startMediaStream();
  }

  @HostListener("document:keyup.shift", ["$event"])
  onShiftKeyupHandler(event: KeyboardEvent) {
    this.isMeshOn = false;
  }

  @HostListener("document:keydown.shift", ["$event"])
  onShiftKeydownHandler(event: KeyboardEvent) {
    this.isMeshOn = true
  }

  startTimer() {
    if (this.isCameraOn) {
      this.store.dispatch(new StartTimer());
    } else {
      this.startMediaStream()
        .pipe(delay(1000))
        .subscribe((_) => {
          this.store.dispatch(new StartTimer());
        });
    }
  }

  onTimerTick(data: { time: number }) {
    // emit the flash event 1 tick before capturing...
    if (data.time === 0) {
      this.onFlash.emit(this.flashDuration);
    }
  }

  onTimerStart() {
    this.store.dispatch(new UnselectPicture());
  }

  triggerCapture() {
    this.store.dispatch(new CapturePicture(this.canvasRef.nativeElement));
  }

  stopMediaStream() {
    this.store.dispatch(new StopMediaStream());
  }

  startMediaStream() {
    return this.store.dispatch(new StartMediaStream(this.deviceId));
  }

  private async loop(filter: WebGLFilter) {
    if (this.isCameraOn) {
      try {
        if (this.selectedFilter && this.selectedFilter.id !== "none") {
          // use WebGL filtered stream

          this.canvasTmpContextRef.drawImage(this.videoRef.nativeElement, 0, 0, this.width, this.height);

          filter.reset();
          filter.addFilter(this.selectedFilter.id, this.selectedFilter.args);

          const filteredImage = filter.apply(this.canvasTmpRef.nativeElement);
          this.canvasContextRef.drawImage(filteredImage, 0, 0, this.width, this.height);
        } else {
          // use direct stream (no filters)

          this.canvasContextRef.drawImage(this.videoRef.nativeElement, 0, 0, this.width, this.height);
        }
      } catch (err) {
        console.log(err);
      }

      this.printFaceWireframe();
      window.requestAnimationFrame(async () => await this.loop(filter));
    }
  }

  async printFaceWireframe() {
    if (this.model) {
      const predictions = await this.model.estimateFaces(this.canvasRef.nativeElement);

      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          const keypoints = prediction.scaledMesh;
          this.drawPath(this.canvasMeshContextRef, keypoints, true);
        });
      }
    }
  }

  drawPath(ctx: CanvasRenderingContext2D, points) {
    ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < points.length; i++) {
      const x = points[i][0];
      const y = points[i][1];

      ctx.beginPath();
      ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
  }
}
