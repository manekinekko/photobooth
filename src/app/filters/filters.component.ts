import { Component, EventEmitter, OnInit, Output } from "@angular/core";

export interface EffectFilter {
  label: string;
  args?: number[];
}

@Component({
  selector: "app-filters",
  template: `
    <select (change)="onEffectSelect($event)" class="filters-list">
      <option *ngFor="let effect of filters" [value]="effect.label">{{ effect.label }}</option>
    </select>
  `,
  styles: [],
})
export class FiltersComponent implements OnInit {
  @Output() onFilterSelect: EventEmitter<EffectFilter>;

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
    this.onFilterSelect = new EventEmitter<EffectFilter>();
  }

  ngOnInit(): void {}

  onEffectSelect(event: any /* Event */) {
    const filterLabel = event.target.value;
    if (filterLabel === "none") {
      this.onFilterSelect.emit(null);
    } else {
      this.onFilterSelect.emit({
        label: filterLabel,
        args: this.filters.filter((effect) => effect.label === filterLabel).pop().args,
      });
    }
  }
}
