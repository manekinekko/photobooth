import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { AppService } from "../app.service";
import { CameraService } from "../camera/camera.service";
import { CameraState, SwitchCameraDevice } from "../camera/camera.state";

@Component({
  selector: "app-device-source",
  template: `
    <section class="selection" appTheme>
      <select id="source" (change)="onDeviceSelect($event)" [value]="source">
        <option *ngFor="let device of availableDevices" [value]="device.deviceId">
          {{ device.label | deviceIdFormat }}
        </option>
      </select>
    </section>
  `,
  styles: [
    `
      .selection {
        position: relative;
        display: flex;
        height: 30px;
        line-height: 1.9;
        background: var(--background-color);
        overflow: hidden;
        border-radius: 30px;
        padding: 0px 14px;
        margin: 10px;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.6);
      }

      .selection select {
        appearance: none;
        outline: 0;
        width: 200px;
        text-align-last: center;
        box-shadow: none;
        border: 0 !important;
        background: var(--background-color);
        background-image: none;
        flex: 1;
        padding: 0 0.5em;
        color: #fff;
        cursor: pointer;
      }

      .selection::after {
        content: "▼";
        position: absolute;
        top: 4px;
        right: 0;
        padding: 0 1em;
        background: var(--background-color);
        cursor: pointer;
        pointer-events: none;
        transition: 0.25s all ease;
        font-size: 13px;
      }

      .selection:hover::after {
        color: #8e8e8e;
      }
    `,
  ],
})
export class DeviceSourceComponent implements OnInit {
  @Input() source: string;
  @Output() onDeviceSelected: EventEmitter<string>;
  availableDevices: Array<{ deviceId: string; label: string }>;
  @Select(CameraState.source) source$: Observable<string>;

  constructor(
    private app: AppService,
    private cameraService: CameraService,
    private store: Store,
    private element: ElementRef<HTMLElement>
  ) {
    this.onDeviceSelected = new EventEmitter();
    this.source$.subscribe((source) => (this.source = source));
  }

  async ngOnInit() {
    this.availableDevices = await this.cameraService.getVideosDevices();
    if (await this.app.isRunningInMSTeams()) {
      this.element.nativeElement.classList.add("ms-teams");
    }
  }

  onDeviceSelect(event: any /* Event */) {
    const selectedSource = event.target.value;
    this.store.dispatch(new SwitchCameraDevice(selectedSource));
    this.onDeviceSelected.emit(selectedSource);
  }
}
