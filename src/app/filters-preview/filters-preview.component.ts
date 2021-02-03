import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { Store } from "@ngxs/store";
import { WebGLFilter } from "../shared/webgl-filter.class";
import { FiltersPreviewService } from "./filters-preview.service";
import { CameraFilter, CameraFilterItem, SelectFilter } from "./filters-preview.state";

@Component({
  selector: "app-filters-preview",
  template: `
    <ul
      role="list"
      aria-label="Filter preview items"
      class="filter-list"
      #filterListRef
      (mouseenter)="toggleScrollingInFilterList(true)"
      (mouseleave)="toggleScrollingInFilterList(false)"
    >
      <li
        role="preview-filter"
        [attr.tabindex]="currentFilterIndex + 2"
        [attr.aria-label]="'Filter name ' + filter.label"
        #filterListItemRef
        [attr.data-label]="filter.label"
        class="filter-list-item"
        *ngFor="let filter of availableFilters; let currentFilterIndex = index"
        [ngClass]="{ selected: selectedFilterLabel === filter.label }"
        (click)="onFilterClicked(filter, currentFilterIndex, true)"
        (focus)="onFilterClicked(filter, currentFilterIndex, true)"
        (keydown.enter)="onFilterClicked(filter, currentFilterIndex, true)"
      >
        <span>{{ filter.label }}</span>
        <img [src]="filter.data || 'assets/filter-placeholder.jpg'" height="50" />
      </li>
    </ul>
  `,
  styles: [
    `
      .filter-list {
        border-bottom: 1px solid #474444;
        display: flex;
        height: 62px;
        padding: 0px 4px;
        margin: 0;
        position: relative;
        overflow-x: scroll;
        overflow-y: hidden;
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
        margin: 2px;
        border-radius: 2px;
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
    `,
  ],
})
export class FiltersPreviewComponent implements OnInit {
  @ViewChild("filterListRef", { static: true }) filterListRef: ElementRef<HTMLUListElement>;
  @ViewChildren("filterListItemRef") filterListItemRef: QueryList<ElementRef<HTMLLIElement>>;
  @Output() onFilterSelected: EventEmitter<Array<CameraFilterItem>>;
  selectedFilterLabel: string;
  selectedFilterIndex: number;
  isScrollFilterListEnabled = false;

  availableFilters: CameraFilter[] = [];
  constructor(private renderer: Renderer2, private filtersService: FiltersPreviewService, private store: Store) {
    this.onFilterSelected = new EventEmitter<Array<CameraFilterItem>>();
    this.availableFilters = this.filtersService.getFilters();

    this.selectedFilterIndex = 0;
  }

  ngOnInit(): void {
    this.initializeFilters();
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

  ngAfterViewInit() {
    this.initializeSelectedFiltersFromUrlHash();

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
      });
    } else {
      const noopFilter = this.availableFilters.find((filter) => filter.label === "Normal");
      this.onFilterClicked(
        {
          label: noopFilter.label,
          filters: noopFilter.filters,
        },
        true
      );
    }
  }

  onFilterClicked(filter: CameraFilter, updateUrlHash = false) {
    // if (this.selectedFilterLabel !== filter.label) {
    if (true) {
      this.selectedFilterLabel = filter.label;
      this.selectedFilterIndex = this.availableFilters.findIndex((f) => f.label === filter.label);

      if (this.selectedFilterIndex >= 0) {
        setTimeout((_) => {
          this.filterListItemRef.toArray()[this.selectedFilterIndex].nativeElement.scrollIntoView({
            behavior: "smooth",
            inline: "center",
          });
        }, 100);
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
        filter.data = (await filteredImage).toDataURL();
      }
    };

    // set initial picture data
    image.src = "assets/filter-placeholder.jpg";
  }
}
