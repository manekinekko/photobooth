import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { Actions, ofActionSuccessful, Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { delay } from "rxjs/operators";
import { UnselectPicture } from "../camera-roll/camera-roll.state";
import { TimerComponent } from "../timer/timer.component";
import { StartTimer, TimerState } from "../timer/timer.state";
import { CameraState, CapturePicture, CapturePictureData, RestartMediaStream, StartMediaStream, StopMediaStream } from "./camera.state";
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
      button[disabled] {
        filter: grayscale();
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
  @Output() onCapture: Observable<string>;
  @Output() onCameraStatus: EventEmitter<boolean>;
  @Output() onFlash: EventEmitter<number>;

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
  flashDuration = 2; // in seconds

  @Select(TimerState.isTicking) timerIsTicking$: Observable<boolean>;
  @Select(CameraState.mediaStream) mediaStream$: Observable<MediaStream>;

  constructor(private store: Store, private actions$: Actions) {
    this.onCapture = this.actions$.pipe(ofActionSuccessful(CapturePictureData));
    this.onCameraStatus = new EventEmitter<boolean>();
    this.onFlash = new EventEmitter<number>();
  }

  async ngOnInit() {
    this.canvasContextRef = this.canvasRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;
    this.canvasTmpContextRef = this.canvasTmpRef.nativeElement.getContext("2d") as CanvasRenderingContext2D;

    this.mediaStream$.subscribe((mediaStream) => {
      this.isCameraOn = !!mediaStream;
      this.onCameraStatus.emit(this.isCameraOn);
      this.videoRef.nativeElement.srcObject = mediaStream;

      if (mediaStream) {
        let { width, height } = mediaStream.getTracks()[0].getSettings();
        this.videoRef.nativeElement.width = width;
        this.videoRef.nativeElement.height = height;
        this.loop(new WebGLFilter());
      }
    });

    this.startMediaStream();
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

  async previewSelectedPicture(data: string) {
    const image = new Image();
    image.onload = () => this.canvasContextRef.drawImage(image, 0, 0, this.width, this.height);
    image.src = data;
  }

  stopMediaStream() {
    this.store.dispatch(new StopMediaStream());
  }

  startMediaStream() {
    return this.store.dispatch(new StartMediaStream(this.deviceId));
  }

  async restartMediaStream() {
    this.store.dispatch(new RestartMediaStream());
  }

  private loop(filter?: WebGLFilter) {
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

      requestAnimationFrame(() => this.loop(filter));
    }
  }
}
