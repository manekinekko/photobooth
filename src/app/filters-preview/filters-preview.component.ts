import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { SelectStyleTranserImage } from "../app.state";
import { CameraState } from "../camera/camera.state";
import { WebGLFilter } from "../shared/webgl-filter.class";
import { FiltersPreviewService } from "./filters-preview.service";
import { CameraFilter, CameraFilterItem, SelectFilter } from "./filters-preview.state";

@Component({
  selector: "app-filters-preview",
  template: `
    <ul
      role="list"
      aria-label="Style transfer preview images" 
      class="filter-list"
      [class.hide-filters-list]="isCameraOn">
      <li 
          role="listitem"
          [attr.tabindex]="currentFilterIndex + 2"
          class="filter-list-item"
          (click)="applyStyleTransfer(imageStyle)"
          *ngFor="let styleImage of styleTransferImages; let currentFilterIndex = index">
        <img #imageStyle src="{{ styleImage.src }}" alt="{{ styleImage.alt }}" height="50">
      </li>
    </ul>
    
    <ul
      [class.hide-filters-list]="!isCameraOn"
      role="list"
      aria-label="Filter preview items"
      class="filter-list"
      #filterListRef
      (mouseenter)="toggleScrollingInFilterList(true)"
      (mouseleave)="toggleScrollingInFilterList(false)"
    >
      <li
        role="listitem"
        [attr.tabindex]="currentFilterIndex + 2"
        [attr.aria-label]="'Filter name ' + filter.label"
        #filterListItemRef
        [attr.data-label]="filter.label"
        class="filter-list-item"
        *ngFor="let filter of availableFilters; let currentFilterIndex = index"
        [ngClass]="{ selected: selectedFilterLabel === filter.label }"
        (click)="onFilterClicked(filter, true)"
        (focus)="onFilterClicked(filter, true)"
        (keydown.enter)="onFilterClicked(filter, true)"
      >
        <span>{{ filter.label }}</span>
        <img alt="Filter {{ filter.label }}" [src]="filter.data || 'assets/filter-placeholder.jpg'" height="50" />
      </li>
    </ul>
  `,
  styles: [
    `
      .filter-list {
        border-bottom: 1px solid #474444;
        display: flex;
        height: 62px;
        padding: 0px 6px;
        margin: 0;
        position: relative;
        overflow-x: scroll;
        overflow-y: hidden;
      }
      .filter-list.hide-filters-list {
        display: none;
      }
      .filter-list::-webkit-scrollbar-track {
        background-color: transparent;
      }
      .filter-list::-webkit-scrollbar {
        height: 5px;
      }
      .filter-list::-webkit-scrollbar-thumb {
        background-color: #373636;
        border-radius: 10px;
      }
      .filter-list-item {
        position: relative;
        cursor: pointer;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .filter-list-item:last-child {
        padding-right: 4px;
      }
      .filter-list-item img {
        border: 1px solid transparent;
      }
      .filter-list-item span {
        color: white;
        font-size: 10px;
        display: inline-block;
        border: 1px solid white;
        padding: 2px 4px;
        border-radius: 7px;
        background: rgba(0, 0, 0, 1);
        min-width: 20px;
        max-width: 60px;
        text-align: center;
        position: absolute;
        bottom: -100px;
        transition: bottom 0.1s ease-in;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .filter-list-item.selected span,
      .filter-list-item:hover span {
        bottom: 5px;
      }
      .filter-list-item.selected img {
        border: 1px solid white;
        transition: 0.3s;
      }

      @media (spanning: single-fold-vertical){	
        .filter-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin: 0;
          padding: 0;
          height: auto;
          border: none;
        }
        .filter-list-item {
          overflow: hidden;
        }
        .filter-list-item img {
          width: 130px;
          height: 90px;
        }
      }

      @media (spanning: single-fold-horizontal){	
        .filter-list {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2px;
          margin: 0;
          padding: 0;
          height: auto;
          border: none;
        }
        .filter-list-item {
          overflow: hidden;
        }
        .filter-list-item img {
          width: 130px;
          height: 90px;
        }
      }
    `,
  ],
})
export class FiltersPreviewComponent implements OnInit {
  @ViewChild("filterListRef", { static: true }) filterListRef: ElementRef<HTMLUListElement>;
  @ViewChildren("filterListItemRef") filterListItemRef: QueryList<ElementRef<HTMLLIElement>>;
  @Output() onFilterSelected: EventEmitter<Array<CameraFilterItem>>;
  @Input() isMultiScreen = false;
  selectedFilterLabel: string;
  selectedFilterIndex: number;
  isScrollFilterListEnabled = false;
  @Select(CameraState.mediaStream) mediaStream$: Observable<MediaStream>;
  isCameraOn = false;

  availableFilters: CameraFilter[] = [];
  styleTransferImages: Array<{ src: string, alt: string }> = [{
    src: "assets/style-transfer/images/style-01.jpg",
    alt: "Style 01",
  }, {
    src: "assets/style-transfer/images/style-02.jpg",
    alt: "Style 02",
  }, {
    src: "assets/style-transfer/images/style-03.jpg",
    alt: "Style 03",
  }, {
    src: "assets/style-transfer/images/style-04.jpg",
    alt: "Style 04",
  }, {
    src: "assets/style-transfer/images/style-05.jpg",
    alt: "Style 05",
  }, {
    src: "assets/style-transfer/images/style-06.jpg",
    alt: "Style 06",
  }, {
    src: "assets/style-transfer/images/style-07.jpg",
    alt: "Style 07",
  }, {
    src: "assets/style-transfer/images/style-08.jpg",
    alt: "Style 08",
  }, {
    src: "assets/style-transfer/images/style-09.jpg",
    alt: "Style 09",
  }, {
    src: "assets/style-transfer/images/style-10.png",
    alt: "Style 10",
  }, {
    src: "assets/style-transfer/images/style-11.png",
    alt: "Style 11",
  }, {
    src: "assets/style-transfer/images/style-12.png",
    alt: "Style 12",
  }, {
    src: "assets/style-transfer/images/style-13.png",
    alt: "Style 13",
  }, {
    src: "assets/style-transfer/images/style-14.png",
    alt: "Style 14",
  }, {
    src: "assets/style-transfer/images/style-15.png",
    alt: "Style 15",
  }, {
    src: "assets/style-transfer/images/style-16.png",
    alt: "Style 16",
  }, {
    src: "assets/style-transfer/images/style-17.png",
    alt: "Style 17",
  }, {
    src: "assets/style-transfer/images/style-18.png",
    alt: "Style 18",
  }, {
    src: "assets/style-transfer/images/style-19.png",
    alt: "Style 19",
  },
  ];

  constructor(private renderer: Renderer2, private filtersService: FiltersPreviewService, private store: Store) {
    this.onFilterSelected = new EventEmitter<Array<CameraFilterItem>>();
    this.availableFilters = this.filtersService.getFilters();

    this.selectedFilterIndex = 0;

    this.mediaStream$.subscribe(async (mediaStream) => {
      // Note: when stopping the device, mediaStream is set to null.
      this.isCameraOn = !!mediaStream;
    });
  }

  ngOnInit(): void {
    this.initializeFilters();

    if (this.isMultiScreen == false) {
      this.renderer.listen(this.filterListRef.nativeElement, "mousewheel", (event: WheelEvent) => {
        if (this.isScrollFilterListEnabled) {
          if (event.deltaX) {
            this.filterListRef.nativeElement.scrollLeft += event.deltaX;
          } else {
            this.filterListRef.nativeElement.scrollLeft -= event.deltaY;
          }
          event.preventDefault();
        }
      });
    }
  }

  ngAfterViewInit() {
    // Run on the next macro task to avoid error NG0100
    setTimeout(() => this.initializeSelectedFiltersFromUrlHash(), 0);

    // const filterElementRef = this.filterListItemRef.find(
    //   (item) => item.nativeElement.dataset.label === this.selectedFilterLabel
    // );

    // setTimeout((_) => {
    //   filterElementRef.nativeElement.scrollIntoView({ behavior: "smooth", inline: "center" });
    // }, 100);
  }

  toggleScrollingInFilterList(enable: boolean) {
    this.isScrollFilterListEnabled = enable;
  }

  @HostListener("window:hashchange", ["$event"])
  onUrlHashChange(event: HashChangeEvent) {
    this.initializeSelectedFiltersFromUrlHash();
  }

  private initializeSelectedFiltersFromUrlHash() {
    const selectedFiltersHash = location.hash.replace("#", "");
    // is there any hash?
    if (selectedFiltersHash) {
      // example: f/Gingham/sepia,0.5|contrast,0.9
      const [
        _, // ignore the key "f"
        label, // Gingham
        filtersSetting, // sepia,0.5|contrast,0.9
      ] = selectedFiltersHash.split("/");

      if (filtersSetting) {


        // extract the array of filters
        // example: sepia,0.5|contrast,0.9
        const filters = filtersSetting.split("|");

        // create a filter definition {id, args} for each filter setting
        const selectedFilters: Array<CameraFilterItem> = filters.map((filter: string) => {
          const [id, ...args] = filter.split(",");
          return {
            id,
            args: args.map(Number),
          };
        });

        // trigger filter propagation
        this.onFilterClicked({
          label: decodeURIComponent(label),
          filters: selectedFilters,
        }, false);
        return;
      }

    }

    const noopFilter = this.availableFilters.find((filter) => filter.label === "Normal");
    this.onFilterClicked(
      {
        label: noopFilter.label,
        filters: noopFilter.filters,
      },
      true
    );

  }

  onFilterClicked(filter: CameraFilter, updateUrlHash = false) {
    if (this.selectedFilterLabel !== filter.label) {
      this.selectedFilterLabel = filter.label;
      this.selectedFilterIndex = this.availableFilters.findIndex((f) => f.label === filter.label);

      if (this.isMultiScreen == false) {
        if (this.selectedFilterIndex >= 0) {
          setTimeout((_) => {
            this.filterListItemRef.toArray()[this.selectedFilterIndex].nativeElement.scrollIntoView({
              behavior: "smooth",
              inline: "center",
            });
          }, 100);
        }
      }

      if (updateUrlHash) {
        const serializedFilters = filter.filters.map((f) => {
          let str = `${f.id}`;
          if (f.args && f.args.length > 0) {
            str = `${str},${f.args.join(",")}`;
          }
          return str;
        });
        location.hash = `f/${filter.label}/${serializedFilters.join("|")}`;
      }

      this.store.dispatch(new SelectFilter(filter));
    }
  }

  @HostListener("window:keyup.arrowright", ["$event"])
  onFilterNext(event: KeyboardEvent) {
    this.selectedFilterIndex = this.computeNewFilterIndex(this.selectedFilterIndex, 1);
    const filter = this.availableFilters[this.selectedFilterIndex];
    this.onFilterClicked(filter, true);
  }

  @HostListener("window:keyup.arrowleft", ["$event"])
  onFilterPrevious(event: KeyboardEvent) {
    this.selectedFilterIndex = this.computeNewFilterIndex(this.selectedFilterIndex, -1);
    const filter = this.availableFilters[this.selectedFilterIndex];
    this.onFilterClicked(filter, true);
  }

  computeNewFilterIndex(index: number, sign: 1 | -1) {
    const length = this.availableFilters.length;
    return (((index + sign) % length) + length) % length;
  }

  // initialize preview thumbnails
  private initializeFilters() {
    const image = new Image();

    // when image data is ready
    image.onload = async () => {
      // create a WebGL filter instance with image dimension
      const webGLFilter = new WebGLFilter(image.width, image.height);

      // for each availble WebGL filters
      const filters = this.availableFilters
        // skip the "Normal" filter
        // keep only WebGL filters that have complex filter definition
        .filter((filter) => filter.filters.length > 0);

      for (let index = 0; index < filters.length; index++) {
        const filter = filters[index];

        // clear previous filters
        webGLFilter.reset();

        // for each composite WebGL filter
        filter.filters.forEach((filterDefinition) => {
          // add WebGL to queued list
          webGLFilter.addFilter(filterDefinition.id, filterDefinition.args);
        });

        // apply and render all filters
        const filteredImage = await webGLFilter.render(image);

        // send rendered image data back <img /> element
        filter.data = filteredImage.toDataURL();
      }
    };

    // set initial picture data
    image.src = "assets/filter-placeholder.jpg";
  }

  applyStyleTransfer(imageStyle: HTMLImageElement) {
    // select the image style to apply
    this.store.dispatch(new SelectStyleTranserImage(imageStyle));
  }
}
