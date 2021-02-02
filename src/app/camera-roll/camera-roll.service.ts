import { Injectable } from "@angular/core";
import { IDBPDatabase, openDB } from "idb";
import { defer, Observable } from "rxjs";
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
  db: Promise<IDBPDatabase<unknown>>;
  constructor() {
    this.db = openDB(PHOTO_DB, 1, {
      upgrade(db) {
        db.createObjectStore(PHOTO_STORE);
      },
    });
  }

  save(data: string) {
    return defer(async () => {
      const id = this.id();
      const picture = { id, data, date: Date.now() } as PictureItem;
      (await this.db).put(PHOTO_STORE, picture, id);
      return picture;
    });
  }

  read(id: string): Observable<PictureItem> {
    return defer(async () => (await this.db).get(PHOTO_STORE, id));
  }

  delete(id: string): Observable<void> {
    return defer(async () => (await this.db).delete(PHOTO_STORE, id));
  }

  getAll(): Observable<PictureItem[]> {
    return defer(async () => (await this.db).getAll(PHOTO_STORE));
  }

  private id() {
    return (Date.now() % 9e6).toString(36);
  }
}
