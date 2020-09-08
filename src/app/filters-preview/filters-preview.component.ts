import { Component, ElementRef, EventEmitter, OnInit, Output, Renderer2, ViewChild, ViewChildren } from "@angular/core";
import { WebGLFilter } from "../shared/webgl-filter.class";

export interface PresetFilter {
  id: string;
  args?: number[];
}
export interface PresetFilters {
  label: string;
  data?: string; // the applied filter result
  filters: Array<PresetFilter>;
}

@Component({
  selector: "app-filters-preview",
  template: `
    <ul
      class="filter-list"
      #filterListRef
      (mouseenter)="toggleScrollingInFilterList(true)"
      (mouseleave)="toggleScrollingInFilterList(false)"
    >
      <li
        #filterListItemRef
        [attr.data-label]="filter.label"
        class="filter-list-item"
        *ngFor="let filter of filters"
        [ngClass]="{ selected: selectedFilterLabel === filter.label }"
        (click)="onFilterClicked(filter, true)"
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
        min-width: 21px;
        text-align: center;
        position: absolute;
        bottom: -100px;
        transition: bottom 0.1s ease-in;
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
  @Output() onFilterSelected: EventEmitter<Array<PresetFilter>>;
  selectedFilterLabel: string;
  isScrollFilterListEnabled = false;

  filters: PresetFilters[] = [
    { label: "Normal", filters: [] },
    { label: "BGR", filters: [{ id: "bgr" }] },
    { label: "Blur Hor.", filters: [{ id: "blurHorizontal", args: [20] }] },
    { label: "Blur Ver.", filters: [{ id: "blurVertical", args: [20] }] },
    { label: "Blur", filters: [{ id: "blur", args: [20] }] },
    { label: "Brightness", filters: [{ id: "brightness", args: [1.5] }] },
    { label: "Brownie", filters: [{ id: "brownie" }] },
    { label: "Contrast", filters: [{ id: "contrast", args: [1.5] }] },
    { label: "Grayscal 1", filters: [{ id: "desaturateLuminance" }] },
    { label: "Grayscal 2", filters: [{ id: "desaturate" }] },
    { label: "Edges", filters: [{ id: "edges" }] },
    { label: "Emboss", filters: [{ id: "emboss" }] },
    { label: "Hue", filters: [{ id: "hue", args: [180] }] },
    { label: "Koda", filters: [{ id: "kodachrome" }] },
    { label: "Negative", filters: [{ id: "negative" }] },
    { label: "Pixelate", filters: [{ id: "pixelate", args: [10] }] },
    { label: "Polaroid", filters: [{ id: "polaroid" }] },
    { label: "Saturate", filters: [{ id: "saturate", args: [1.5] }] },
    { label: "Sepia", filters: [{ id: "sepia", args: [1] }] },
    { label: "Sharpen", filters: [{ id: "sharpen" }] },
    { label: "Sobel Hor.", filters: [{ id: "sobelHorizontal" }] },
    { label: "Sobel Ver.", filters: [{ id: "sobelVertical" }] },
    { label: "Technicolor", filters: [{ id: "technicolor" }] },
    { label: "Vignette", filters: [{ id: "vignette" }] },
    { label: "Vintage", filters: [{ id: "vintagePinhole" }] },
    // instagram-like filters
    {
      label: "Clarendon",
      filters: [
        {
          id: "brightness",
          args: [1.1],
        },
        {
          id: "contrast",
          args: [1.5],
        },
        {
          id: "saturate",
          args: [1],
        },
      ],
    },
    {
      label: "Gingham",
      filters: [
        {
          id: "sepia",
          args: [0.5],
        },
        {
          id: "contrast",
          args: [0.9],
        },
      ],
    },
    {
      label: "Moon",
      filters: [
        {
          id: "desaturateLuminance",
          args: [],
        },
        {
          id: "contrast",
          args: [0.6],
        },
        {
          id: "brightness",
          args: [1.2],
        },
      ],
    },
  ];
  constructor(private renderer: Renderer2) {
    this.onFilterSelected = new EventEmitter<Array<PresetFilter>>();
    this.selectedFilterLabel = "Normal";
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.initializeSelectedFiltersFromUrlHash();
    this.renderer.listen(this.filterListRef.nativeElement, "mousewheel", (event: WheelEvent) => {
      if (this.isScrollFilterListEnabled) {
        this.filterListRef.nativeElement.scrollLeft -= event.deltaY;
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
      const selectedFilters: Array<PresetFilter> = filters.map((filter: string) => {
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
    }
  }

  onFilterClicked(filter: PresetFilters, updateUrlHash = false) {
    if (this.selectedFilterLabel !== filter.label) {
      this.selectedFilterLabel = filter.label;

      if (filter.filters.length === 0) {
        this.onFilterSelected.emit(null);
      } else {
        this.onFilterSelected.emit(filter.filters);
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
    }
  }

  // initialize preview thumbnails
  private initializeFilters() {
    const image = new Image();
    image.onload = () => {
      const webGlFilter = new WebGLFilter(image.width, image.height);

      this.filters
        // skip the "Normal" filter
        .filter((filter) => filter.filters.length > 0)
        .map((filter) => {
          webGlFilter.reset();
          filter.filters.forEach((f) => {
            webGlFilter.addFilter(f.id, f.args);
          });
          const filteredImage = webGlFilter.apply(image);
          filter.data = filteredImage.toDataURL();
        });
    };

    // set initial picture data
    image.src = "assets/filter-placeholder.jpg";
  }
}
