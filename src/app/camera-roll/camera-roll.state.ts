import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { insertItem, patch, removeItem } from "@ngxs/store/operators";
import { of } from "rxjs";
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
  constructor(public readonly currentPictureId: string, public readonly useForGreenScreen: boolean = false) {}
}

export class SelectPictureData {
  static readonly type = "[CameraRoll] select picture data";
  constructor(public readonly data: string) {}
}

export class SelectPictureDataForChromaKey {
  static readonly type = "[CameraRoll] select picture data for chroma key";
  constructor(public readonly data: string) {}
}

export class UnselectPicture {
  static readonly type = "[CameraRoll] unselect picture";
}

export class NoMorePictures {
  static readonly type = "[CameraRoll] no more pictures";
}

// state

export interface PictureItem {
  id: string;
  data: string;
  date: number;
}
export interface CameraRollStateModel {
  pictures: PictureItem[];
  selectedPictureId: string;
}

@State<CameraRollStateModel>({
  name: "cameraRoll",
  defaults: {
    pictures: [],
    selectedPictureId: null,
  },
})
@Injectable()
export class CameraRollState {
  constructor(private cameraRollService: CameraRollService) {}

  @Selector()
  static pictures(cameraRoll: CameraRollStateModel) {
    return cameraRoll.pictures;
  }

  @Selector()
  static selectedPictureId(picture: CameraRollStateModel) {
    return picture.selectedPictureId;
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
  selectPicture({ patchState, getState, dispatch }: StateContext<CameraRollStateModel>, payload: SelectPicture) {
    if (payload.useForGreenScreen && payload.currentPictureId === null) {
      // remove background picture from chroma key 
      dispatch(new SelectPictureDataForChromaKey(null));
    }
    
    const { selectedPictureId } = getState();

    if (selectedPictureId === payload.currentPictureId) {
      // if the picture is already selected, ignore it
      // TODO: should we toggle selection?
      return of();
    }

    return this.cameraRollService.read(payload.currentPictureId).pipe(
      map((picture: PictureItem) => picture.data),
      tap((data: string) => {
        if (payload.useForGreenScreen) {
          dispatch(new SelectPictureDataForChromaKey(data));
        } else {
          patchState({
            selectedPictureId: payload.currentPictureId,
          });

          dispatch(new SelectPictureData(data));
        }
      })
    );
  }

  @Action(DeletePicture)
  deletePicture({ setState, getState, dispatch }: StateContext<CameraRollStateModel>) {
    const { selectedPictureId, pictures } = getState();
    let selectedPictureIndex = pictures.findIndex((picture) => picture.id === selectedPictureId);

    return this.cameraRollService.delete(selectedPictureId).pipe(
      tap((_) => {
        // update state
        setState(
          patch({
            pictures: removeItem<PictureItem>(selectedPictureIndex),
          })
        );

        // get new state
        const { pictures } = getState();

        if (pictures.length === 0) {
          // no more pictures in camera roll, show camera
          dispatch(new NoMorePictures());
        } else {
          // try selecting the previous picture in camera roll
          const nextPictureIndex = Math.max(0, (selectedPictureIndex - 1) % pictures.length);
          const nextPictureId = pictures[nextPictureIndex].id;

          dispatch(new SelectPicture(nextPictureId));
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
            pictures: insertItem<PictureItem>(newPicture, getState().pictures.length),
          })
        );
      })
    );
  }

  @Action(UnselectPicture)
  unelectPicture({ patchState }: StateContext<CameraRollStateModel>) {
    patchState({
      selectedPictureId: null,
    });
  }
}
