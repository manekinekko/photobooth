import { Component, ElementRef, ViewChild } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { AppService } from "./app.service";
import { IframeMessage } from "./app.state";
import { AddPicture, SelectPictureData } from "./camera-roll/camera-roll.state";
import { CameraComponent } from "./camera/camera.component";
import { CameraState, StartMediaStream, StopMediaStream, PreviewPictureData } from "./camera/camera.state";
import { CameraFilterItem, FilterState, CameraFilter } from "./filters-preview/filters-preview.state";

@Component({
  selector: 'app-foldable',
  template: `
  <div fdSplitLayout="flex">

    <!-- Assign to first window segment -->
    <article fdWindow="0" class="screen-0">
      <app-device-source></app-device-source>
      <app-filters-preview></app-filters-preview>
      <app-camera-roll
        (onEmptyPictures)="onEmptyPictures()"
        (onPictureSelected)="onPictureSelected($event)"
      ></app-camera-roll>
    </article>

    <!-- Assign to second window segment -->
    <article fdWindow="1" class="screen-1">
      <div #flashEffectRef></div>

      <main>
        <app-camera
          [selectedFilters]="selectedFilters"
          (onCapture)="onCapture($event)"
          (onFlash)="flashEffect($event)"
        >
        </app-camera>
        </main>
      </article>
    </div>
  `,
  styles: [`
    :host {
      background: var(--background-color);
    }
    app-camera {
      position: relative;
      display: block;
    }
    app-filters-preview {
      height: calc(100vh - 120px);
      overflow: scroll;
      display: block;
    }
    article {
      overflow: hidden;
    }
    article.screen-0 {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    article.screen-1 {
      position: relative;
    }
    article.screen-1 main {
      overflow: hidden;
      width: calc(1114px / 2);
    }
    .flash-effect {
      background: white;
      opacity: 0;
      animation-name: flash;
      animation-duration: 0.8s;
      animation-timing-function: cubic-bezier(0.26, 0.79, 0.72, 0.5);
      position: absolute;
      top: -20px;
      bottom: 0;
      z-index: 1;
      right: 0;
      margin: 0;
      padding: 0;
      display: block;
      width: env(fold-right);
    }
    @keyframes flash {
      from {
        opacity: 0;
      }
      70%,
      100% {
        opacity: 1;
      }
    }
  `]
})
export class FoldableComponent {
  @ViewChild(CameraComponent, { static: true }) cameraRef: CameraComponent;
  @ViewChild("flashEffectRef", { static: true }) flashEffectRef: ElementRef;
  width: number = 1280;
  height: number = 720;
  aspectRatio: number;

  selectedFilters: Array<CameraFilterItem> = [];

  activeSource: string | null;

  @Select(CameraState.source) activeSource$: Observable<string>;
  @Select(FilterState.selectedFilter) selectedFilter$: Observable<CameraFilter>;

  constructor(private store: Store, private app: AppService) {
    this.activeSource = null;
    this.selectedFilter$.subscribe((selectedFilter) => {
      if (selectedFilter) {
        // Run on the next macro task to avoid error NG0100
        setTimeout(() => this.selectedFilters = selectedFilter.filters, 0);
      }
    });

    this.activeSource$.subscribe((source) => {
      // set the initial source from the store's default value
      // but do it only this.activeSource is not set yet
      if (this.activeSource === null && typeof source === "string" && source !== "") {
        this.store.dispatch(new StartMediaStream(source));
      }
      this.activeSource = source;
    });
  }

  ngOnInit() {
    this.aspectRatio = this.app.computeCameraAspectRatio();

    this.width *= this.aspectRatio;
    this.height *= this.aspectRatio;
  }

  onCapture(capturedPicture: { data: string }) {
    this.store.dispatch([new AddPicture(capturedPicture.data), new IframeMessage(capturedPicture.data)]);
  }

  flashEffect(duration: number) {
    this.flashEffectRef.nativeElement.classList.add("flash-effect");
    setTimeout((_) => {
      this.flashEffectRef.nativeElement.classList.remove("flash-effect");
    }, duration * 1000 /* pause for 2 seconds before taking the next picture */);
  }

  onEmptyPictures() {
    this.store.dispatch(new StartMediaStream(this.activeSource));
  }

  onPictureSelected(picture: SelectPictureData) {
    this.store.dispatch([new StopMediaStream(), new PreviewPictureData(picture.data)]);
  }
}