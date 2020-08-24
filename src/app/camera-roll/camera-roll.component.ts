import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FileService } from "../camera/file.service";

@Component({
  selector: "app-camera-roll",
  template: `
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
  `,
  styles: [
    `
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
export class CameraRollComponent implements OnInit {
  @Input() pictures: Array<{ filename: string; data: string; selected: boolean }>;
  @Input() width: number;
  @Output() onPictureDeleted: EventEmitter<void>;
  @Output() onPictureSelected: EventEmitter<string>;

  constructor(private fileService: FileService) {
    this.onPictureDeleted = new EventEmitter<void>();
    this.onPictureSelected = new EventEmitter<string>();
  }

  async ngOnInit() {}

  async selectPicture(filename: string) {
    this.unselectPicture();

    // select clicked file
    this.pictures.filter((file) => file.filename === filename).map((file) => (file.selected = !file.selected));

    // show selected picture
    this.onPictureSelected.emit(await this.fileService.read(filename));
  }

  unselectPicture() {
    const pictureIndex = this.findSelectedPictureIndex();
    if (pictureIndex >= 0) {
      this.pictures[pictureIndex].selected = false;
    }
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
      this.onPictureDeleted.emit();
    } else {
      // try selecting the previous picture in camera roll
      // TODO: if deleting the last picture, we will select the first one (because it's 3am and I am being lazy)!
      this.selectPicture(this.pictures[fileIndex % this.pictures.length].filename);
    }
  }

  trackByFilename(index: number, item: any) {
    return item.filename;
  }
}
