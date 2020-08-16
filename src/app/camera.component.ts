import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { BlobService } from "./blob.service";
import { CameraService } from "./camera.service";
import { CounterComponent } from "./counter.component";
import { FileService } from "./file.service";
import { WebGLFilter } from "./webgl-filter";

@Component({
  selector: "app-camera",
  template: `
    <video #videoRef hidden autoplay muted></video>
    <main [ngStyle]="{ width: width + 'px' }">
      <canvas #canvasRef [width]="width" [height]="height"></canvas>
      <canvas #canvasTmpRef hidden [width]="width" [height]="height"></canvas>

      <section>
        <ul class="camera-roll">
          <li
            class="camera-roll-item"
            *ngFor="let pic of pictures; trackBy: trackByFilename"
            [class.selected]="pic.selected"
            (click)="selectPicture(pic.filename)"
          >
            <span (click)="deletePicture(pic.filename)">&#x2715;</span>
            <img [src]="pic.data" height="50" />
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

    <select (change)="onEffectSelect($event)">
      <option *ngFor="let effect of effects" [value]="effect.label">{{ effect.label }}</option>
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
        width: 1280px;
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
        animation-timing-function: cubic-bezier(0.6, 0.4, 0.54, 1.12);
        position: relative;
      }
      .camera-roll-item span {
        color: white;
        position: absolute;
        font-size: 1em;
        opacity: 0.7;
        right: 2px;
        top: 2px;
        height: 16px;
        width: 16px;
        display: block;
        text-align: center;
        cursor: pointer;
        display: none;
      }
      .camera-roll-item.selected span {
        display: block;
      }

      @keyframes bounce {
        0%,
        60% {
          transform: translateY(-52px);
        }
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

  @ViewChild("videoRef", { static: true }) videoRef: ElementRef<HTMLVideoElement>;
  @ViewChild("canvasRef", { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;
  @ViewChild("canvasTmpRef", { static: true }) canvasTmpRef: ElementRef<HTMLCanvasElement>;
  @ViewChild("counterRef", { static: true }) counterRef: CounterComponent;

  @Input() width: number = 1280;
  @Input() height: number = 720;
  canvasContextRef: CanvasRenderingContext2D;
  canvasTmpContextRef: CanvasRenderingContext2D;
  isCameraOn: boolean;
  selectedDeviceId: string;
  selectedEffect: { label: string; args: number[] };
  availableDevices: Array<{ deviceId: string; label: string }>;
  isCounterHidden: boolean;
  pictures: Array<{ filename: string; data: string; selected: boolean }>;

  effects = [
    { label: "none" },
    { label: "negative" },
    { label: "brightness", args: [1.5] },
    { label: "saturation", args: [1.5] },
    { label: "contrast", args: [1.5] },
    { label: "hue", args: [180] },
    { label: "desaturate" },
    { label: "desaturateLuminance" },
    { label: "brownie" },
    { label: "sepia" },
    { label: "vintagePinhole" },
    { label: "kodachrome" },
    { label: "technicolor" },
    { label: "detectEdges" },
    { label: "sharpen" },
    { label: "emboss" },
    { label: "blur", args: [7] },
  ];

  constructor(
    private cameraService: CameraService,
    private fileService: FileService,
    private blobService: BlobService
  ) {
    this.onCapture = new EventEmitter<Blob>();
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
    this.availableDevices = await this.cameraService.getVideosDevices();

    this.videoRef.nativeElement.onload = () => {
      this.isCameraOn = true;
    };

    this.pictures = await this.fileService.load();
    console.log(this.pictures);
    

    this.startMediaStream();
  }

  async onCameraSelect(event: any /* Event */) {
    this.selectedDeviceId = event.target.value;
    await this.restartMediaStream();
  }

  onEffectSelect(event: any /* Event */) {
    const effectLabel = event.target.value;
    this.selectedEffect = {
      label: effectLabel,
      args: this.effects.filter((effect) => effect.label === effectLabel).pop().args,
    };
  }

  startCounter() {
    this.isCounterHidden = false;
    this.counterRef.start();
  }

  trackByFilename(index: number, item: any) {
    return item.filename;
  }

  async triggerCapture() {
    // emit the flash animation...
    this.onFlash.emit();

    setTimeout(async () => {
      // ... but leave some time for the flash animation to happen before closing the counter section.
      this.isCounterHidden = true;

      const file = await this.confirmCapture();
      const data = await this.blobService.toBase64(file);
      const filename = await this.fileService.save(data);

      this.pictures.push({
        filename,
        selected: false,
        data,
      });

      this.onCapture.emit(file);
    }, 500);
  }

  selectPicture(filename: string) {
    // unselected other files
    this.pictures.map((file) => (file.selected = false));

    // select clicked file
    this.pictures.filter((file) => file.filename === filename).map((file) => (file.selected = !file.selected));
  }

  async deletePicture(filename: string) {
    this.pictures = await this.fileService.delete(filename);
  }

  private confirmCapture(): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      this.canvasContextRef.drawImage(this.videoRef.nativeElement, 0, 0, this.width, this.height);

      const blob = await this.blobService.toBlob(this.canvasRef.nativeElement, "image/png");
      resolve(blob);
    });
  }

  private async startMediaStream() {
    const mediaStream = await this.cameraService.getUserMedia({ deviceId: this.selectedDeviceId });
    this.videoRef.nativeElement.srcObject = mediaStream;
    let { width, height } = mediaStream.getTracks()[0].getSettings();
    this.videoRef.nativeElement.width = width;
    this.videoRef.nativeElement.height = height;

    this.isCameraOn = true;
    this.onCameraStatus.emit(true);

    // this.stream();
    this.stream(new WebGLFilter());
  }

  private async restartMediaStream() {
    this.videoRef.nativeElement.srcObject = null;
    await this.startMediaStream();
  }

  private stream(filter?: WebGLFilter) {
    if (this.isCameraOn) {
      try {
        if (this.selectedEffect?.label) {
          // use WebGL filtered stream

          this.canvasTmpContextRef.drawImage(this.videoRef.nativeElement, 0, 0, this.width, this.height);
          const filteredImage = filter.apply(this.canvasTmpRef.nativeElement);

          filter.reset();
          filter.addFilter(this.selectedEffect.label, this.selectedEffect.args);

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
