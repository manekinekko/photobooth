import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { AppService } from "../app.service";
import { UnselectPicture } from "../camera-roll/camera-roll.state";
import { CameraDeviceSource, CameraState, SwitchCameraDevice } from "../camera/camera.state";

@Component({
  selector: "app-device-source",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="selection" appTheme>
      <select (change)="onDeviceSelect($event)" tabindex="1" [(ngModel)]="source">
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
        padding: 0px 14px 0 0;
        margin: 10px;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.6);
        width: 220px;
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
  availableDevices: Array<CameraDeviceSource>;
  source: string;

  @Select(CameraState.source) source$: Observable<string>;
  @Select(CameraState.devices) devices$: Observable<CameraDeviceSource[]>;

  constructor(
    private cd: ChangeDetectorRef,
    private app: AppService,
    private store: Store,
    private element: ElementRef<HTMLElement>
  ) {
    this.source$.subscribe((source) => {
      this.source = source;
    });
    this.devices$.subscribe((devices) => {
      this.availableDevices = devices;
      this.cd.markForCheck();
    });
  }

  async ngOnInit() {
    if (this.app.isRunningInMSTeams()) {
      this.element.nativeElement.classList.add("ms-teams");
    }
  }

  onDeviceSelect(event: Event) {
    const selectedSource = (event.target as HTMLSelectElement).value;
    this.store.dispatch([new SwitchCameraDevice(selectedSource), new UnselectPicture()]);
  }
}
