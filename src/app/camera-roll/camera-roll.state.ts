import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { insertItem, patch, removeItem } from "@ngxs/store/operators";
import { dispatch } from "rxjs/internal/observable/pairs";
import { map, tap } from "rxjs/operators";
import { CameraRollService } from "./camera-roll.service";

// actions

export class InitializePictures {
  static readonly type = "[CameraRoll] initialize pictures";
}

export class AddPicture {
  static readonly type = "[CameraRoll] add picture";
  constructor(public readonly data: string) {}
}

export class DeletePicture {
  static readonly type = "[CameraRoll] delete picture";
}

export class SelectPicture {
  static readonly type = "[CameraRoll] select picture";
  constructor(public readonly currentPictureIndex: number) {}
}

export class SelectPictureData {
  static readonly type = "[CameraRoll] select picture data";
  constructor(public readonly data: string) {}
}

export class UnselectPicture {
  static readonly type = "[CameraRoll] unselect picture";
}

// state

export interface PictureItem {
  data: string;
  date: number;
}
export interface CameraRollStateModel {
  pictures: PictureItem[];
  selectedPictureIndex: number;
}

@State<CameraRollStateModel>({
  name: "cameraRoll",
  defaults: {
    pictures: [],
    selectedPictureIndex: -1,
  },
})
@Injectable()
export class CameraRollState {
  constructor(private cameraRollService: CameraRollService) {}

  @Selector()
  static pictures(picture: CameraRollStateModel) {
    return picture.pictures;
  }

  @Selector()
  static selectedPictureIndex(picture: CameraRollStateModel) {
    return picture.selectedPictureIndex;
  }

  @Action(InitializePictures)
  initializePictures({ patchState }: StateContext<CameraRollStateModel>) {
    return this.cameraRollService.getAll().pipe(
      tap((pictures) => {
        patchState({
          pictures,
        });
      })
    );
  }

  @Action(SelectPicture)
  selectPicture({ patchState, dispatch }: StateContext<CameraRollStateModel>, payload: SelectPicture) {
    return this.cameraRollService.read(payload.currentPictureIndex).pipe(
      map((picture: PictureItem) => picture.data),
      tap((data: string) => {
        patchState({
          selectedPictureIndex: payload.currentPictureIndex,
        });

        dispatch(new SelectPictureData(data));
      })
    );
  }

  @Action(DeletePicture)
  deletePicture({ setState, getState, dispatch }: StateContext<CameraRollStateModel>) {
    const { selectedPictureIndex } = getState();
    return this.cameraRollService.delete(selectedPictureIndex).pipe(
      tap((_) => {
        setState(
          patch({
            pictures: removeItem<PictureItem>(selectedPictureIndex),
          })
        );
        const { pictures } = getState();
        if (pictures.length === 0) {
          // no more pictures in camera roll, show camera
          dispatch(new DeletePicture());
        } else {
          // try selecting the previous picture in camera roll
          // TODO: if deleting the last picture, we will select the first one (because it's 3am and I am being lazy)!
          const nextPictureIndex = selectedPictureIndex % pictures.length;
          dispatch(new SelectPicture(nextPictureIndex));
        }
      })
    );
  }

  @Action(AddPicture)
  addPicture({ getState, setState }: StateContext<CameraRollStateModel>, payload: AddPicture) {
    return this.cameraRollService.save(payload.data).pipe(
      tap((newPicture: any) => {
        setState(
          patch({
            pictures: insertItem<PictureItem>(newPicture),
          })
        );
      })
    );
  }

  @Action(UnselectPicture)
  unelectPicture({ patchState }: StateContext<CameraRollStateModel>) {
    patchState({
      selectedPictureIndex: -1,
    });
  }
}
