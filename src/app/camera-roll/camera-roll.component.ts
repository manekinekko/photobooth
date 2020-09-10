import { Component, Output } from "@angular/core";
import { Actions, ofActionSuccessful, Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { CameraFilter, FilterState } from "../filters-preview/filters-preview.state";
import {
  CameraRollState,
  DeletePicture,
  InitializePictures,
  NoMorePictures,
  PictureItem,
  SelectPicture,
  SelectPictureData
} from "./camera-roll.state";

@Component({
  selector: "app-camera-roll",
  template: `
    <ul class="camera-roll">
      <li
        class="camera-roll-item"
        *ngFor="let pic of pictures$ | async; let currentPictureId = index; trackBy: trackByFilename"
        (click)="selectPicture(pic.id)"
        [ngClass]="{ selected: (selectedPictureId$ | async) === pic.id }"
        style="--delay: {{ currentPictureId / 10 }}s "
      >
        <b
          *ngIf="isGreenScreenFilterActive"
          stopEventPropagation
          class="green-screen-blend"
          (click)="selectForGreenScreen(pic.id)"
          >&#x2691;</b
        >
        <span (click)="deletePicture()">&#x2715;</span>
        <img [src]="pic.data" height="50" />
      </li>
    </ul>
  `,
  styles: [
    `
      .camera-roll {
        display: flex;
        height: 62px;
        padding: 0px 4px;
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
      .camera-roll-item:last-child {
        padding-right: 4px;
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
      .camera-roll-item .green-screen-blend {
        cursor: pointer;
        position: absolute;
        bottom: 2px;
        right: 6px;
        display: none;
        color: white;
      }
      .camera-roll-item:hover .green-screen-blend {
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
  @Output() onPictureDeleted: Observable<void>;
  @Output() onPictureSelected: Observable<string>;
  @Output() onEmptyPictures: Observable<void>;

  @Select(CameraRollState.selectedPictureId)
  selectedPictureId$: Observable<string>;
  isGreenScreenApplied = false;
  isGreenScreenFilterActive = false;
  @Select(CameraRollState.pictures) pictures$: Observable<PictureItem[]>;
  @Select(FilterState.selectedFilter) selectedFilter$: Observable<CameraFilter>;

  constructor(private store: Store, private actions$: Actions) {
    this.onPictureDeleted = this.actions$.pipe(ofActionSuccessful(DeletePicture));
    this.onPictureSelected = this.actions$.pipe(ofActionSuccessful(SelectPictureData));
    this.onEmptyPictures = this.actions$.pipe(ofActionSuccessful(NoMorePictures));

    this.store.dispatch(new InitializePictures());

    this.selectedFilter$.subscribe((selectedFilter) => {
      if (selectedFilter) {
        this.isGreenScreenFilterActive = !!selectedFilter.filters.find((filter) => filter.id.includes("greenScreen"));
      }
    });
  }

  async selectPicture(currentPictureId: string) {
    this.store.dispatch(new SelectPicture(currentPictureId));
  }

  async deletePicture() {
    this.store.dispatch(new DeletePicture());
  }

  selectForGreenScreen(currentPictureId: string) {
    this.store.dispatch(new SelectPicture(this.isGreenScreenApplied ? null : currentPictureId, true));
    this.isGreenScreenApplied = !this.isGreenScreenApplied;
  }

  trackByFilename(index: number, item: PictureItem) {
    return item?.date;
  }
}
