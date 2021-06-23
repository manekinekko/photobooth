import { Component, Output } from "@angular/core";
import { Actions, ofActionSuccessful, Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { CameraState, StartMediaStream } from "../camera/camera.state";
import { CameraFilter, FilterState } from "../filters-preview/filters-preview.state";
import {
  CameraRollState,
  DeletePicture,
  InitializePictures,
  NoMorePictures,
  PictureItem,
  SelectPicture,
  SelectPictureData,
  UnselectPicture,
} from "./camera-roll.state";

@Component({
  selector: "app-camera-roll",
  template: `
    <ul class="camera-roll">
      <li
        class="camera-roll-item"
        *ngFor="let pic of pictures$ | async; let currentPictureId = index; trackBy: trackByFilename"
        (click)="toggleSelectPicture(pic.id)"
        [ngClass]="{ selected: selectedPictureId === pic.id }"
        style="--delay: {{ currentPictureId / 10 }}s "
      >
        <b
          *ngIf="isChromaKeyFilterActive"
          stopEventPropagation
          class="chroma-key-blend"
          [ngClass]="{ selected: currentChromaKeyPictureId === pic.id }"
          (click)="toggleSelectForChromaKeyFilter(pic.id)"
          >&#x2691;</b
        >
        <span stopEventPropagation (click)="deletePicture()">&#x2715;</span>
        <img [src]="pic.data" height="50"/>
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
        height: 32px;
        width: 32px;
        display: block;
        text-align: center;
        cursor: pointer;
        display: none;
      }
      .camera-roll-item img {
        border: 1px solid transparent;
        width: 78px;
      }
      .camera-roll-item.selected img {
        border: 1px solid white;
        transition: 0.3s;
      }
      .camera-roll-item.selected span {
        display: block;
      }
      .camera-roll-item .chroma-key-blend {
        cursor: pointer;
        position: absolute;
        bottom: 2px;
        right: 6px;
        display: none;
        color: white;
      }
      .camera-roll-item .chroma-key-blend.selected,
      .camera-roll-item:hover .chroma-key-blend {
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

      @media (spanning: single-fold-vertical) {	
        
      }
    `,
  ],
})
export class CameraRollComponent {
  @Output() onPictureDeleted: Observable<void>;
  @Output() onPictureSelected: Observable<string>;
  @Output() onEmptyPictures: Observable<void>;

  selectedPictureId: string;
  isChromaKeyBackgroundApplied = false;
  isChromaKeyFilterActive = false;
  currentChromaKeyPictureId: string;
  source: string;
  @Select(CameraRollState.selectedPictureId) selectedPictureId$: Observable<string>;
  @Select(CameraRollState.pictures) pictures$: Observable<PictureItem[]>;
  @Select(FilterState.selectedFilter) selectedFilter$: Observable<CameraFilter>;
  @Select(CameraState.source) source$: Observable<string>;

  constructor(private store: Store, private actions$: Actions) {
    this.onPictureDeleted = this.actions$.pipe(ofActionSuccessful(DeletePicture));
    this.onPictureSelected = this.actions$.pipe(ofActionSuccessful(SelectPictureData));
    this.onEmptyPictures = this.actions$.pipe(ofActionSuccessful(NoMorePictures));

    this.store.dispatch(new InitializePictures());

    this.selectedPictureId$.subscribe((selectedPictureId) => (this.selectedPictureId = selectedPictureId));
    this.source$.subscribe((source) => (this.source = source));

    this.selectedFilter$.subscribe((selectedFilter) => {
      if (selectedFilter) {
        this.isChromaKeyFilterActive = !!selectedFilter.filters.find((filter) => filter.id.includes("chromaKey"));
      }
    });
  }

  toggleSelectPicture(currentPictureId: string) {
    if (this.selectedPictureId === currentPictureId) {
      this.selectedPictureId = null;
      this.store.dispatch([new UnselectPicture(), new StartMediaStream(this.source)]);
    } else {
      this.selectedPictureId = currentPictureId;
      this.store.dispatch(new SelectPicture(this.selectedPictureId));
    }
  }

  deletePicture() {
    this.isChromaKeyBackgroundApplied = false;
    this.currentChromaKeyPictureId = null;
    this.store.dispatch([new SelectPicture(null, true), new DeletePicture(), new UnselectPicture()]);
  }

  toggleSelectForChromaKeyFilter(currentPictureId: string) {
    if (this.selectedPictureId) {
      return;
    }

    // when clicking on a picture that is already applied
    // we will turn it off (unselect it)
    if (this.currentChromaKeyPictureId === currentPictureId) {
      // if the chroma key is applied
      // let's remove the current background picture
      if (this.isChromaKeyBackgroundApplied) {
        this.isChromaKeyBackgroundApplied = false;
        this.currentChromaKeyPictureId = null;
        this.store.dispatch(new SelectPicture(this.currentChromaKeyPictureId, true));
      }
      // otherwise, go ahead and apply the current background picture
      else {
        this.isChromaKeyBackgroundApplied = true;
        this.currentChromaKeyPictureId = currentPictureId;
        this.store.dispatch(new SelectPicture(this.currentChromaKeyPictureId, true));
      }
    } else {
      // when clicking on a new picture
      // apply it as a background for the chroma key filter
      this.isChromaKeyBackgroundApplied = true;
      this.currentChromaKeyPictureId = currentPictureId;
      this.store.dispatch(new SelectPicture(this.currentChromaKeyPictureId, true));
    }
  }

  trackByFilename(index: number, item: PictureItem) {
    return item?.date;
  }
}
