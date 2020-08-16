import { Injectable } from "@angular/core";

const PHOTO_PREFIX = `photobooth_image`;
const FD_PREFIX = `photobooth_fd`;
export const enum MODE {
  INSERT,
  DELETE,
}

@Injectable({
  providedIn: "root",
})
export class FileService {
  constructor() {}

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

  save(data: string) {
    const name = `${PHOTO_PREFIX}_${Date.now()}`;
    localStorage.setItem(name, data);

    this.updateFileDescriptor(name, MODE.INSERT);
    return name;
  }

  read(name: string) {
    return localStorage.getItem(name);
  }

  delete(name: string) {
    localStorage.removeItem(name);
    this.updateFileDescriptor(name, MODE.DELETE);
    return this.load();
  }

  load() {
    const fd = this.readFD();

    return fd.map((filename) => {
      return {
        filename,
        selected: false,
        data: this.read(filename),
      };
    });
  }
}
