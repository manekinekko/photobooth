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

    <canvas #canvasRef [width]="width" [height]="height"></canvas>
    <canvas #canvasTmpRef hidden [width]="width" [height]="height"></canvas>

    <section>
      <ul class="camera-roll" [ngStyle]="{ width: width + 'px' }">
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
      .camera-roll {
        border-bottom: 1px solid #474444;
        display: flex;
        width: 100%;
        padding: 0px;
        margin: 0;
        position: relative;
        overflow-x: scroll;
      }
      .camera-roll::-webkit-scrollbar-track {
        background-color: transparent;
      }
      .camera-roll::-webkit-scrollbar {
        height: 5px;
      }
      .camera-roll::-webkit-scrollbar-thumb {
        background-color: #373636;
        border-radius: 10px;
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
      .camera-roll-item img {
        border: 1px solid transparent;
      }
      .camera-roll-item.selected img {
        border: 1px solid white;
      }
      .camera-roll-item.selected span {
        display: block;
      }

      @keyframes bounce {
        0%,
        60% {
          transform: translateY(-55px);
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
  @Input() deviceId: string;
  @Input() selectedFilter: { label: string; args: number[] };
  canvasContextRef: CanvasRenderingContext2D;
  canvasTmpContextRef: CanvasRenderingContext2D;
  isCameraOn: boolean;
  mediaStream: MediaStream;
  isCounterHidden: boolean;
  pictures: Array<{ filename: string; data: string; selected: boolean }>;

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

    this.videoRef.nativeElement.onload = () => {
      this.isCameraOn = true;
    };

    this.pictures = await this.fileService.load();

    this.startMediaStream();
  }

  async startCounter() {
    if (this.isCameraOn === false) {
      await this.startMediaStream();
    }

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

  async selectPicture(filename: string) {
    this.unselectPicture();

    // select clicked file
    this.pictures.filter((file) => file.filename === filename).map((file) => (file.selected = !file.selected));

    // show selected picture
    this.stopMediaStream();
    this.previewSelectedPicture(filename);
  }

  unselectPicture() {
    const pictureIndex = this.findSelectedPictureIndex();
    if (pictureIndex >= 0) {
      this.pictures[pictureIndex].selected = false;
    }
  }

  async previewSelectedPicture(filename: string) {
    const image = new Image();
    image.onload = () => this.canvasContextRef.drawImage(image, 0, 0, this.width, this.height);
    image.src = await this.fileService.read(filename);
  }

  findSelectedPictureIndex() {
    return this.pictures.findIndex((file) => file.selected);
  }

  async deletePicture(filename: string) {
    const fileIndex = this.findSelectedPictureIndex();
    this.pictures = await this.fileService.delete(filename);

    // after deleting the current picture from camera roll, select another one
    if (this.pictures.length === 0) {
      // no more pictures in camera roll, show camera
      this.startMediaStream();
    } else {
      // try selecting the previous picture in camera roll
      // TODO: if deleting the last picture, we will select the first one (because it's 3am and I am being lazy)!
      this.selectPicture(this.pictures[fileIndex % this.pictures.length].filename);
    }
  }

  private confirmCapture(): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      const blob = await this.blobService.toBlob(this.canvasRef.nativeElement, "image/png");
      resolve(blob);
    });
  }

  private stopMediaStream() {
    this.isCameraOn = false;
    this.mediaStream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  private async startMediaStream() {
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
