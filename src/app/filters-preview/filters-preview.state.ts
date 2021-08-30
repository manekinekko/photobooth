import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { FiltersPreviewService } from "./filters-preview.service";

// actions

export class SelectFilter {
  static readonly type = "[filter] select filter";
  constructor(public readonly currentFilter: CameraFilter) { }
}

// state
export interface CameraFilterItem {
  id: string;
  args?: number[];
}

export interface CameraFilter {
  label: string;
  data?: string; // base64 of the image with the applied filter
  filters: Array<CameraFilterItem>;
}

export interface FilterStateModel {
  filters: CameraFilter[];
  selectedFilter: Partial<CameraFilter>;
}

@State<FilterStateModel>({
  name: "filters",
  defaults: {
    filters: [],
    selectedFilter: null,
  },
})
@Injectable()
export class FilterState {
  constructor(private readonly filterPreviewService: FiltersPreviewService) { }

  @Selector()
  static filters(filtersModel: FilterStateModel) {
    return filtersModel.filters;
  }

  @Selector()
  static selectedFilter(filtersModel: FilterStateModel) {
    return filtersModel.selectedFilter;
  }

  @Action(SelectFilter)
  selectFilter({ patchState }: StateContext<FilterStateModel>, payload: SelectFilter) {

    payload = {
      ...payload,
      currentFilter: {
        ...payload.currentFilter,
        data: null
      }
    }

    patchState({
      selectedFilter: payload.currentFilter,
    });
  }
}
