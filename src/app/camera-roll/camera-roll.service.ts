import { Injectable } from "@angular/core";
import { openDB } from "idb";
import { defer, Observable, of } from "rxjs";
import { PictureItem } from "./camera-roll.state";

const PHOTO_DB = `photobooth_image`;
const PHOTO_STORE = `photobooth_image_store`;
export const enum MODE {
  INSERT,
  DELETE,
}

@Injectable({
  providedIn: "root",
})
export class CameraRollService {
  db;
  constructor() {
    this.db = openDB(PHOTO_DB, 1, {
      upgrade(db) {
        db.createObjectStore(PHOTO_STORE);
      },
    });
  }

  save(data: string) {
    return defer(async () => {
      const insertIndex = await (await this.db).count(PHOTO_STORE);
      const picture = { data, date: Date.now() };
      (await this.db).put(PHOTO_STORE, picture, insertIndex);
      return picture;
    });
  }

  read(index: number): Observable<PictureItem> {
    return defer(async () => (await this.db).get(PHOTO_STORE, index));
  }

  delete(index: number): Observable<void> {
    return defer(async () => (await this.db).delete(PHOTO_STORE, index));
  }

  getAll(): Observable<PictureItem[]> {
    return defer(async () => (await this.db).getAll(PHOTO_STORE));
  }
}
