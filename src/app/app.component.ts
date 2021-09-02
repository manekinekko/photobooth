import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { AppService } from "./app.service";
import { AppState, IframeMessage } from "./app.state";
import { AddPicture, SelectPictureData } from "./camera-roll/camera-roll.state";
import { CameraComponent } from "./camera/camera.component";
import { CameraState, PreviewPictureData, StartMediaStream, StopMediaStream } from "./camera/camera.state";
import { CameraFilter, CameraFilterItem, FilterState } from "./filters-preview/filters-preview.state";

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <section 
      appTheme 
      [class.disabled]="activeSource === null" 
      appDragDrop
      (onFileDropped)="onFileDropped($event)"
    >
      <app-device-source *ngIf="activeSource" ></app-device-source>

      <app-filters-preview *ngIf="activeSource" [ngStyle]="{ width: width + 'px' }"></app-filters-preview>

      <div #flashEffectRef></div>
      <main [ngStyle]="{ width: width + 'px' }">
        <app-camera
          [width]="width"
          [height]="height"
          [isProcessing]="isStyleTransferLoading"
          [selectedFilters]="selectedFilters"
          (onCapture)="onCapture($event)"
          (onFlash)="flashEffect($event)"
        >
          <app-camera-roll
            (onEmptyPictures)="onEmptyPictures()"
            (onPictureSelected)="onPictureSelected($event)"
          ></app-camera-roll>
        </app-camera>
      </main>
      <footer>
        <span
          >Photo Booth (developer preview:
          <a target="__blank" href="https://github.com/manekinekko/photobooth">_BUILD_HASH_</a>) - No data is
          collected. Pictures are stored in browser.</span
        >
        <span
          >Made by Wassim Chegham (<a href="https://twitter.com/@manekinekko">@manekinekko</a>) •
          <a target="__blank" href="https://github.com/manekinekko/photobooth">Contribute</a>
          •
          <a target="__blank" href="https://github.com/manekinekko/photobooth/blob/master/PRIVACY.md">Privacy</a>
        </span>
      </footer>
    </section>
  `,
  styles: [
    `
      :host {
        position: relative;
      }

      section {
        display: flex;
        position: relative;
        align-items: center;
        flex-direction: column;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--background-color);
        padding: 10px 0 0;
        min-width: 500px;
        min-height: 400px;
        box-shadow: 0px 0px 10px 1px rgb(0 0 0 / 50%);
        transition: 1s all;
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
        width: 200%;
        height: 200%;
        z-index: 1;
        left: -50%;
        right: 0;
        margin: 0;
        padding: 0;
        display: block;
      }

      select::-ms-expand {
        display: none;
      }

      footer {
        font-size: 10px;
        justify-content: space-between;
        width: 100%;
        display: flex;
        padding: 10px;
      }
      footer span {
        display: inline-block;
        margin: 0 10px;
      }
      footer,
      footer a {
        color: white;
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
    `,
  ],
})
export class AppComponent {
  @ViewChild(CameraComponent, { static: true }) cameraRef: CameraComponent;
  @ViewChild("flashEffectRef", { static: true }) flashEffectRef: ElementRef;
  width: number = 1280;
  height: number = 720;
  aspectRatio: number;

  selectedFilters: Array<CameraFilterItem>;

  activeSource: string | null;
  isStyleTransferLoading = false;

  @Select(CameraState.source) activeSource$: Observable<string>;
  @Select(FilterState.selectedFilter) selectedFilter$: Observable<CameraFilter>;
  @Select(AppState.styleTransferProcessingStatus) selectedFiltestyleTransferProcessingStatus$: Observable<boolean>;

  constructor(private store: Store, private app: AppService, private cd: ChangeDetectorRef) {
    this.activeSource = null;
    this.selectedFilter$.subscribe((selectedFilter) => (this.selectedFilters = selectedFilter?.filters));

    this.activeSource$.subscribe((source) => {
      // set the initial source from the store's default value
      // but do it only this.activeSource is not set yet
      if (this.activeSource === null && typeof source === "string" && source !== "") {
        this.store.dispatch(new StartMediaStream(source));
      }
      this.activeSource = source;
    });

    this.selectedFiltestyleTransferProcessingStatus$.subscribe((isLoading) => {
      this.isStyleTransferLoading = Boolean(isLoading);
      this.cd.markForCheck();
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
    }, duration * 1000 /* pause for X seconds before taking the next picture */);
  }

  onEmptyPictures() {
    this.store.dispatch(new StartMediaStream(this.activeSource));
  }

  onPictureSelected(picture: SelectPictureData) {
    this.store.dispatch([new StopMediaStream(), new PreviewPictureData(picture.data)]);
  }

  onFileDropped(files: FileList) {
    const file = files?.item(0);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const fileContent = e.target?.result;
        this.onCapture({
          data: fileContent
        });
      };
      reader.readAsDataURL(file);
    }
  }
}
