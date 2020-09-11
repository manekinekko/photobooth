import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
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
        *ngFor="let filter of filters; let currentFilterIndex = index"
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
  @ViewChildren("filterListItemRef") filterListItemRef: Array<ElementRef<HTMLLIElement>>;
  @Output() onFilterSelected: EventEmitter<Array<CameraFilterItem>>;
  selectedFilterLabel: string;
  selectedFilterIndex: number;
  isScrollFilterListEnabled = false;

  filters: CameraFilter[] = [];
  constructor(private renderer: Renderer2, private filtersService: FiltersPreviewService, private store: Store) {
    this.onFilterSelected = new EventEmitter<Array<CameraFilterItem>>();
    this.filters = this.filtersService.getFilters();

    this.selectedFilterIndex = 0;
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.initializeSelectedFiltersFromUrlHash();
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
    const filterElementRef = this.filterListItemRef.find(
      (item) => item.nativeElement.dataset.label === this.selectedFilterLabel
    );

    setTimeout((_) => {
      filterElementRef.nativeElement.scrollIntoView({ behavior: "smooth", inline: "center" });
    }, 900);
  }

  toggleScrollingInFilterList(enable: boolean) {
    this.isScrollFilterListEnabled = enable;
  }

  private initializeSelectedFiltersFromUrlHash() {
    const selectedFiltersHash = location.hash.replace("#", "");
    // is there any hash?
    let filterIndex = 0;
    if (selectedFiltersHash) {
      // example: f=Gingham:sepia,0.5|contrast,0.9
      // ignore the key "k" and extract the filter definition
      const [_, filtersHash] = selectedFiltersHash.split("=");

      // extract the label and filters setting
      // example: Gingham" and "sepia,0.5|contrast,0.9"
      let [label, filtersSetting] = filtersHash.split(":");

      // extract the array of filters
      // example: sepia,0.5|contrast,0.9
      const filters = filtersSetting.split("|");

      // create a filter definition {id, args} for each filter setting
      const selectedFilters: Array<CameraFilterItem> = filters.map((filter: string, index: number) => {
        const [id, ...args] = filter.split(",");
        return {
          id,
          args: args.map(Number),
        };
      });
      // trigger filter propagation
      this.onFilterClicked(
        {
          label: decodeURIComponent(label),
          filters: selectedFilters,
        },
        filterIndex
      );
    } else {
      const noopFilter = this.filters.find((filter) => filter.label === "Normal");
      this.onFilterClicked(
        {
          label: noopFilter.label,
          filters: noopFilter.filters,
        },
        filterIndex,
        true
      );
    }
  }

  onFilterClicked(filter: CameraFilter, filterIndex: number, updateUrlHash = false) {
    if (this.selectedFilterLabel !== filter.label) {
      this.selectedFilterLabel = filter.label;
      this.selectedFilterIndex = filterIndex;

      if (filter.filters.length === 0) {
        this.onFilterSelected.emit(null);
      } else {
        this.onFilterSelected.emit(filter.filters);
      }

      // run only after filterListItemRef is populated
      if (this.filterListItemRef) {
        this.filterListItemRef
          .find((filter, index) => index === this.selectedFilterIndex)
          .nativeElement.scrollIntoView({
            behavior: "smooth",
            inline: "center",
          });
      }

      if (updateUrlHash) {
        const serializedFilters = filter.filters.map((f) => {
          let str = `${f.id}`;
          if (f.args && f.args.length > 0) {
            str = `${str},${f.args.join(",")}`;
          }
          return str;
        });
        location.hash = `f=${filter.label}:${serializedFilters.join("|")}`;
      }

      this.store.dispatch(new SelectFilter(filter));
    }
  }

  @HostListener("window:keyup.arrowright", ["$event"])
  onFilterNext(event: KeyboardEvent) {
    this.selectedFilterIndex = this.computeNewFilterIndex(this.selectedFilterIndex, 1);
    console.log(this.selectedFilterIndex);

    const filter = this.filters[this.selectedFilterIndex];
    this.onFilterClicked(filter, this.selectedFilterIndex, true);
  }

  @HostListener("window:keyup.arrowleft", ["$event"])
  onFilterPrevious(event: KeyboardEvent) {
    this.selectedFilterIndex = this.computeNewFilterIndex(this.selectedFilterIndex, -1);

    const filter = this.filters[this.selectedFilterIndex];
    this.onFilterClicked(filter, this.selectedFilterIndex, true);
  }

  computeNewFilterIndex(index: number, sign: 1 | -1) {
    const length = this.filters.length;
    return (((index + sign) % length) + length) % length;
  }

  // initialize preview thumbnails
  private initializeFilters() {
    const image = new Image();
    image.onload = () => {
      const webGLFilter = new WebGLFilter(image.width, image.height);

      this.filters
        // skip the "Normal" filter
        .filter((filter) => filter.filters.length > 0)
        .map((filter) => {
          webGLFilter.reset();
          filter.filters.forEach((f) => {
            webGLFilter.addFilter(f.id, f.args);
          });
          const filteredImage = webGLFilter.render(image);
          filter.data = filteredImage.toDataURL();
        });
    };

    // set initial picture data
    image.src = "assets/filter-placeholder.jpg";
  }
}
