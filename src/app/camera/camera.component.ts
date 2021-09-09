import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output, SimpleChanges, ViewChild
} from "@angular/core";
import { Actions, ofActionSuccessful, Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { delay, switchMap } from "rxjs/operators";
import { SelectPictureDataForChromaKey, UnselectPicture } from "../camera-roll/camera-roll.state";
import { CameraFilterItem } from "../filters-preview/filters-preview.state";
import { WebGLFilter } from "../shared/webgl-filter.class";
import { TimerComponent } from "../timer/timer.component";
import { StartTimer, TimerState } from "../timer/timer.state";
import { CameraState, CapturePicture, CapturePictureData, StartMediaStream, StopMediaStream } from "./camera.state";
import { FaceMeshService } from "./face-mesh.service";


@Component({
  selector: "app-camera",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="style-transfer-loader" *ngIf="isProcessing" [ngStyle]=" { width: width + 'px', height: height + 'px' } "></div>

    <span class="fps-rate">{{ fpsRate }} fps</span>
    <video #videoRef hidden autoplay playsinline muted></video>
    <canvas #canvasVideoRef hidden [width]="width" [height]="height"></canvas>
    <canvas #canvasGreenScreenRef hidden [width]="width" [height]="height"></canvas>

    <ng-content select="app-filters"></ng-content>
    <canvas
      #canvasMeshRef
      *ngIf="shouldDrawFaceMesh"
      [width]="width"
      [height]="height"
      style="position: absolute"
    ></canvas>
    <div class="polaroid-container">
      <canvas class="foldable" #canvasRef [width]="width" [height]="height"></canvas>
      <img class="printed-logo" #printedLogoRef src="/assets/devfest-2021-msft-logo.png"> 
    </div>

    <ng-content select="app-camera-roll"></ng-content>    

    <section class="foldable">
      <button (click)="startTimer()" [disabled]="!isCameraOn">
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
      [hidden] {
        display: none;
      }
      .fps-rate {
        position: absolute;
        right: 0;
        padding: 10px;
        filter: contrast(0);
      }
      .printed-logo {
        display: none;
      }
      canvas {
        background-color: #000;
      }
      .style-transfer-loader {
        background-image: url(/assets/loader-2.gif);
        background-size: 200px;
        position: absolute;
        mix-blend-mode: screen;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
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
        width: 76px;
        height: 76px;
        margin: 5px;
        border-radius: 50%;
        transition: all 0.2s ease-in-out;
        cursor: pointer;
      }
      button:not([disabled]):hover {
        transform: scale(1.1);
      }
      button[disabled] {
        cursor: initial;
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

      @media (spanning: single-fold-vertical) {	
        section.foldable {
          margin-top: -85px;
          position: relative;
        }

        canvas.foldable {
          position: relative;
          background: black;
          width: 100%;
        }
      }
      @media (spanning: single-fold-horizontal) {	
        canvas.foldable {
          position: relative;
          background: black;
          height: 100%;
          width: 100%;
        }
        section.foldable {
          margin-top: -85px;
          position: absolute;
        }
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
  @ViewChild("canvasVideoRef", { static: true }) canvasVideoRef: ElementRef<HTMLCanvasElement>;
  @ViewChild("canvasGreenScreenRef", { static: true }) canvasGreenScreenRef: ElementRef<HTMLCanvasElement>;
  @ViewChild(TimerComponent, { static: true }) timerRef: TimerComponent;

  @Input() width: number = 1280;
  @Input() height: number = 720;
  @Input() deviceId: string;
  @Input() isProcessing: boolean = false;
  @Input() selectedFilters: Array<CameraFilterItem>;
  canvasContextRef: CanvasRenderingContext2D;
  canvasMeshContextRef: CanvasRenderingContext2D;
  canvasVideoContextRef: CanvasRenderingContext2D;
  canvasGreenScreenContextRef: CanvasRenderingContext2D;

  isCameraOn: boolean;
  fpsTimes = [];
  fpsRate = 0.0;

  mediaStream: MediaStream;
  flashDuration = 2; // in seconds

  shouldDrawFaceMesh = false;

  @Select(TimerState.isTicking) timerIsTicking$: Observable<boolean>;
  @Select(CameraState.mediaStream) mediaStream$: Observable<MediaStream>;
  @Select(CameraState.preview) preview$: Observable<string>;

  onPictureSelectedForGreenScreen: Observable<CapturePictureData>;

  constructor(
    private cd: ChangeDetectorRef,
    private faceMesh: FaceMeshService,
    private store: Store,
    private actions$: Actions
  ) {
    this.onCapture = this.actions$.pipe(ofActionSuccessful(CapturePictureData));
    this.onPictureSelectedForGreenScreen = this.actions$.pipe(ofActionSuccessful(SelectPictureDataForChromaKey));

    this.onCameraStatus = new EventEmitter<boolean>();
    this.onCameraStart = new EventEmitter<string>();
    this.onFlash = new EventEmitter<number>();
  }

  async ngOnInit() {
    this.canvasContextRef = this.canvasRef?.nativeElement.getContext("2d") as CanvasRenderingContext2D;
    this.canvasMeshContextRef = this.canvasMeshRef?.nativeElement.getContext("2d") as CanvasRenderingContext2D;
    this.canvasVideoContextRef = this.canvasVideoRef?.nativeElement.getContext("2d") as CanvasRenderingContext2D;

    this.canvasGreenScreenContextRef = this.canvasGreenScreenRef.nativeElement.getContext(
      "2d"
    ) as CanvasRenderingContext2D;

    this.videoRef.nativeElement.onloadedmetadata = () => {
      this.videoRef.nativeElement.width = this.width;
      this.videoRef.nativeElement.height = this.height;
    };

    // when a picture is selected for preview
    this.preview$.subscribe((preview: string | ImageData) => {
      if (typeof preview === 'string') {
        const image = new Image();
        image.onload = async () => {
          image.width = this.canvasRef.nativeElement.width;
          image.height = this.canvasRef.nativeElement.height;
          this.canvasContextRef.drawImage(image, 0, 0, this.width, this.height);
        }
        image.src = preview;
      }
      else if ((preview as any) instanceof ImageData) {
        const scale = Math.max(this.canvasRef.nativeElement.width / preview.width, this.canvasRef.nativeElement.height / preview.height);
        this.canvasContextRef.putImageData(preview as any, 0, 0, 0, 0, preview.width * scale, preview.height * scale);
      }
    });

    // when a picture is selected as a background for the chroma-key filter
    this.onPictureSelectedForGreenScreen.subscribe((picture) => {
      if (picture.data === null) {
        // remove background picture from chroma-key
        this.canvasGreenScreenContextRef.clearRect(0, 0, this.width, this.height);
      } else {
        var image = new Image();
        image.onload = () => {
          this.canvasGreenScreenContextRef.drawImage(image, 0, 0);
        };
        image.src = picture.data;
      }
    });

    this.mediaStream$.subscribe(async (mediaStream) => {
      // Note: when stopping the device, mediaStream is set to null.
      this.mediaStream = mediaStream;
      this.isCameraOn = !!mediaStream;
      this.cd.markForCheck();

      this.onCameraStatus.emit(this.isCameraOn);
      this.videoRef.nativeElement.srcObject = mediaStream;

      if (mediaStream) {
        let { width, height, deviceId } = mediaStream.getTracks()[0].getSettings();
        this.videoRef.nativeElement.width = width;
        this.videoRef.nativeElement.height = height;

        window.requestAnimationFrame(async () => await this.loop(new WebGLFilter(this.width, this.height)));

        this.onCameraStart.emit(deviceId);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isProcessing) {
      this.cd.markForCheck();
    }
  }

  @HostListener("document:keyup.shift", ["$event"])
  onShiftKeyupHandler(event: KeyboardEvent) {
    this.shouldDrawFaceMesh = false;
  }

  @HostListener("document:keydown.shift", ["$event"])
  onShiftKeydownHandler(event: KeyboardEvent) {
    this.shouldDrawFaceMesh = true;
  }

  startTimer() {
    if (this.isCameraOn) {
      this.store.dispatch(new StartTimer());
    } else {
      this.startMediaStream()
        .pipe(
          delay(1000),
          switchMap(() => this.store.dispatch(new StartTimer()))
        )
        .subscribe();
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

  private computeFps() {
    const now = performance.now();
    while (this.fpsTimes.length > 0 && this.fpsTimes[0] <= now - 1000) {
      this.fpsTimes.shift();
    }
    this.fpsTimes.push(now);
    this.fpsRate = this.fpsTimes.length;
    this.cd.markForCheck();
  }
  private async loop(webGLFilter: WebGLFilter) {
    if (this.isCameraOn) {
      let shouldBlend = false;
      try {
        // apply filters only if they are set
        if (!this.selectedFilters || this.selectedFilters.length === 0) {
          // draw direct stream from video (no filters applied)
          this.canvasContextRef.drawImage(this.videoRef.nativeElement, 0, 0, this.width, this.height);
        } else {
          // use WebGL filtered stream

          this.canvasVideoContextRef.drawImage(this.videoRef.nativeElement, 0, 0, this.width, this.height);

          // reset any previously applied filters
          webGLFilter.reset();

          // add selected filters/presets
          this.selectedFilters.forEach((f) => {
            if (f.id === "chromaKey") {
              shouldBlend = true;
            }
            webGLFilter.addFilter(f.id, f.args);
          });

          // apply filters
          const filteredImage = await webGLFilter.render(this.canvasVideoRef.nativeElement);

          if (shouldBlend) {
            this.canvasContextRef.putImageData(
              this.canvasGreenScreenContextRef.getImageData(0, 0, this.width, this.height),
              0,
              0
            );
          }

          // draw image data with applied filters
          this.canvasContextRef.drawImage(filteredImage, 0, 0, this.width, this.height);
        }
      } catch (err) {
        console.log(err);
      }

      if (this.shouldDrawFaceMesh) {
        const scaledMesh = await this.faceMesh.predictFaceMesh(this.canvasRef.nativeElement);
        this.drawFaceMeshPath(scaledMesh);
      }

      this.computeFps();

      window.requestAnimationFrame(async () => await this.loop(webGLFilter));
    }
  }

  private drawFaceMeshPath(scaledMesh) {
    const ctx = this.canvasMeshContextRef;
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < scaledMesh.length; i++) {
      const x = scaledMesh[i][0];
      const y = scaledMesh[i][1];

      ctx.beginPath();
      ctx.arc(x | 0, y | 0, 1 /* radius */, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
  }
}
