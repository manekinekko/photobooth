import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

export interface EffectFilter {
  label: string;
  args?: number[];
}

@Component({
  selector: "app-filters",
  template: `
    <ul class="filter-list">
      <li class="filter-list-item" *ngFor="let effect of filters">
        <img (click)="onFilterClicked(effect.label)" src="assets/filter-placeholder.jpg" height="50" />
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
        display: inline-block;
        margin: 2px;
        border-radius: 2px;
        position: relative;
      }
      .filter-list-item img {
        border: 1px solid transparent;
      }
      .filter-list-item.selected img {
        border: 1px solid white;
        transition: 0.3s;
      }
    `,
  ],
})
export class FiltersComponent implements OnInit {
  @Output() onFilterSelected: EventEmitter<EffectFilter>;
  @Input() width: number;

  filters: EffectFilter[] = [
    { label: "none" },
    { label: "negative" },
    { label: "brightness", args: [1.5] },
    { label: "saturation", args: [1.5] },
    { label: "contrast", args: [1.5] },
    { label: "hue", args: [180] },
    { label: "desaturate" },
    { label: "desaturateLuminance" },
    { label: "brownie" },
    { label: "sepia" },
    { label: "vintagePinhole" },
    { label: "kodachrome" },
    { label: "technicolor" },
    { label: "detectEdges" },
    { label: "sharpen" },
    { label: "emboss" },
    { label: "blur", args: [7] },
  ];
  constructor() {
    this.onFilterSelected = new EventEmitter<EffectFilter>();
  }

  ngOnInit(): void {}

  onFilterClicked(filterLabel: string) {
    if (filterLabel === "none") {
      this.onFilterSelected.emit(null);
    } else {
      this.onFilterSelected.emit({
        label: filterLabel,
        args: this.filters.filter((effect) => effect.label === filterLabel).pop().args,
      });
    }
  }
}
