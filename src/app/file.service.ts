import { Injectable } from "@angular/core";
import { openDB } from "idb";

const PHOTO_DB = `photobooth_image`;
const PHOTO_STORE = `photobooth_image_store`;
const FD_PREFIX = `photobooth_fd`;
export const enum MODE {
  INSERT,
  DELETE,
}

@Injectable({
  providedIn: "root",
})
export class FileService {
  db;
  constructor() {
    this.db = openDB(PHOTO_DB, 1, {
      upgrade(db) {
        db.createObjectStore(PHOTO_STORE);
      },
    });
  }

  private readFD() {
    return JSON.parse(localStorage.getItem(FD_PREFIX) || "[]") as string[];
  }

  private updateFileDescriptor(name: string, mode: MODE) {
    let fd = this.readFD();

    switch (mode) {
      case MODE.INSERT:
        fd.push(name);
        break;
      case MODE.DELETE:
        fd = fd.filter((filename) => filename !== name);
        break;
    }

    localStorage.setItem(FD_PREFIX, JSON.stringify(fd));
  }

  async save(data: string) {
    const name = `${PHOTO_DB}_${Date.now()}`;
    (await this.db).put(PHOTO_STORE, data, name);

    this.updateFileDescriptor(name, MODE.INSERT);
    return name;
  }

  async read(name: string): Promise<string> {
    return (await this.db).get(PHOTO_STORE, name);
  }

  async delete(name: string) {
    (await this.db).delete(PHOTO_STORE, name);

    this.updateFileDescriptor(name, MODE.DELETE);
    return this.load();
  }

  load() {
    const fd = this.readFD();

    return Promise.all(
      fd.map(async (filename) => {
        return {
          filename,
          selected: false,
          data: await this.read(filename),
        };
      })
    );
  }
}
