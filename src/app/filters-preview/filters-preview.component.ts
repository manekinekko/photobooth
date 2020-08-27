import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { WebGLFilter } from "../shared/webgl-filter.class";

export interface EffectFilter {
  id: string;
  data?: string;
  label: string;
  args?: number[];
}

@Component({
  selector: "app-filters-preview",
  template: `
    <ul class="filter-list">
      <li
        class="filter-list-item"
        *ngFor="let filter of filters"
        [ngClass]="{ selected: selectedFilterId === filter.id }"
      >
        <span>{{ filter.label }}</span>
        <img (click)="onFilterClicked(filter)" [src]="filter.data || 'assets/filter-placeholder.jpg'" height="50" />
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
        overflowL hidden;
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
        bottom: -20px;
        transition: bottom 0.1s ease-in;
      }
      .filter-list-item.selected span,
      .filter-list-item:hover span {
        bottom: 5px;
      }
      .filter-list-item.selected img {
        border: 1px solid black;
        transition: 0.3s;
      }
    `,
  ],
})
export class FiltersPreviewComponent implements OnInit {
  @Output() onFilterSelected: EventEmitter<Partial<EffectFilter>>;
  @Input() width: number;
  selectedFilterId: string;

  filters: EffectFilter[] = [
    { id: "none", label: "Normal" },
    { id: "negative", label: "Negative" },
    { id: "brightness", label: "Brightness", args: [1.5] },
    { id: "saturation", label: "Saturation", args: [1.5] },
    { id: "contrast", label: "Contrast", args: [1.5] },
    { id: "hue", label: "Hue", args: [180] },
    { id: "desaturate", label: "Desaturate" },
    { id: "desaturateLuminance", label: "Luminance" },
    { id: "brownie", label: "Brownie" },
    { id: "sepia", label: "Sepia" },
    { id: "vintagePinhole", label: "Vintage" },
    { id: "kodachrome", label: "Koda" },
    { id: "technicolor", label: "Technicolor" },
    { id: "detectEdges", label: "Edges" },
    { id: "sharpen", label: "Sharpen" },
    { id: "emboss", label: "Emboss" },
    { id: "blur", label: "Blur", args: [20] },
    { id: "blurHorizontal", label: "Blur Hor.", args: [20] },
    { id: "blurVertical", label: "Blur Ver.", args: [20] },
    { id: "pixelate", label: "Pixelate", args: [10] },
  ];
  constructor() {
    this.onFilterSelected = new EventEmitter<EffectFilter>();
    this.selectedFilterId = "none";
  }

  ngOnInit(): void {
    this.initializeFilters();
  }

  onFilterClicked(filter: EffectFilter) {
    if (this.selectedFilterId !== filter.id) {
      this.selectedFilterId = filter.id;

      if (filter.id === "none") {
        this.onFilterSelected.emit(null);
      } else {
        this.onFilterSelected.emit(filter);
      }
    }
  }

  private initializeFilters() {
    const image = new Image();
    const webGlFilter = new WebGLFilter();
    image.onload = () => {
      this.filters
        .filter((filter) => filter.id !== "none")
        .map((filter) => {
          webGlFilter.reset();
          webGlFilter.addFilter(filter.id, filter.args);
          const filteredImage = webGlFilter.apply(image);
          filter.data = filteredImage.toDataURL();
        });
    };
    image.src = "assets/filter-placeholder.jpg";
  }
}
