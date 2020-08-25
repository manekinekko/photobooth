import { Component, Input, Output } from "@angular/core";
import { Actions, ofActionSuccessful, Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import {
  CameraRollState,
  DeletePicture,
  InitializePictures,
  NoMorePictures,
  PictureItem,
  SelectPicture,
  SelectPictureData,
} from "./camera-roll.state";

@Component({
  selector: "app-camera-roll",
  template: `
    <ul class="camera-roll" [ngStyle]="{ width: width + 'px' }">
      <li
        class="camera-roll-item"
        *ngFor="let pic of pictures$ | async; let currentPictureId = index; trackBy: trackByFilename"
        (click)="selectPicture(pic.id)"
        [ngClass]="{ selected: (selectedPictureId$ | async) === pic.id }"
        style="--delay: {{ currentPictureId / 10 }}s "
      >
        <span (click)="deletePicture()">&#x2715;</span>
        <img [src]="pic.data" height="50" />
        {{pic.id}}
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
        overflow-y: hidden;
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
        opacity: 0;
        border-radius: 2px;
        animation: 1s bounce forwards, 1s reveal forwards;
        animation-delay: var(--delay), 0.5s;
        animation-timing-function: cubic-bezier(0.6, 0.4, 0.54, 1.12), ease;
        position: relative;
        transform: translateY(-55px);
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
        transition: 0.3s;
      }
      .camera-roll-item.selected span {
        display: block;
      }

      @keyframes reveal {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes bounce {
        0%,
        60% {
          transform: translateY(-55px);
        }
        70% {
          transform: translateY(-40px);
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
export class CameraRollComponent {
  @Input() width: number;
  @Output() onPictureDeleted: Observable<void>;
  @Output() onPictureSelected: Observable<string>;
  @Output() onEmptyPictures: Observable<void>;

  @Select(CameraRollState.selectedPictureId)
  selectedPictureId$: Observable<string>;
  @Select(CameraRollState.pictures) pictures$: Observable<PictureItem[]>;

  constructor(private store: Store, private actions$: Actions) {
    this.onPictureDeleted = this.actions$.pipe(ofActionSuccessful(DeletePicture));
    this.onPictureSelected = this.actions$.pipe(ofActionSuccessful(SelectPictureData));
    this.onEmptyPictures = this.actions$.pipe(ofActionSuccessful(NoMorePictures));

    this.store.dispatch(new InitializePictures());
  }

  async selectPicture(currentPictureId: string) {
    this.store.dispatch(new SelectPicture(currentPictureId));
  }

  async deletePicture() {
    this.store.dispatch(new DeletePicture());
  }

  trackByFilename(index: number, item: PictureItem) {
    return item?.date;
  }
}
