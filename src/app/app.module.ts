import { APP_INITIALIZER, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { NgxsReduxDevtoolsPluginModule } from "@ngxs/devtools-plugin";
import { NgxsModule } from "@ngxs/store";
import { FoldableModule } from 'ngx-foldable';
import { environment } from "src/environments/environment";
import { AppComponent } from "./app.component";
import { AppState } from "./app.state";
import { BootComponent } from "./boot.component";
import { CameraRollComponent } from "./camera-roll/camera-roll.component";
import { CameraRollState } from "./camera-roll/camera-roll.state";
import { CameraComponent } from "./camera/camera.component";
import { CameraState } from "./camera/camera.state";
import { FaceMeshService } from "./camera/face-mesh.service";
import { DeviceSourceComponent } from "./device-source/device-source.component";
import { DeviceSourceService } from "./device-source/device-source.service";
import { FiltersPreviewComponent } from "./filters-preview/filters-preview.component";
import { FilterState } from "./filters-preview/filters-preview.state";
import { FoldableComponent } from "./foldable.component";
import { DeviceIdFormatPipe } from "./shared/device-id-format.pipe";
import { DragDropDirective } from "./shared/drag-drop.directive";
import { StopEventPropagation } from "./shared/stop-event-propagation.directive";
import { ThemeDirective } from "./shared/theme.directive";
import { TimerComponent } from "./timer/timer.component";
import { TimerState } from "./timer/timer.state";

// Load the MediaPipe facemesh model assets.
export function loadTFMediaPipeModel(faceMesh: FaceMeshService) {
  return async () => {
    const model = await faceMesh.initialize();
    console.log("MediaPipe facemesh model assets loaded.");
  };
}

export function installVirtualMediaDevice(deviceSource: DeviceSourceService) {
  return async () => {
    return Promise.resolve(deviceSource.installVirtualMediaDevice());
  };
}

@NgModule({
  declarations: [
    AppComponent,
    CameraComponent,
    TimerComponent,
    CameraRollComponent,
    DeviceIdFormatPipe,
    FiltersPreviewComponent,
    DeviceSourceComponent,
    ThemeDirective,
    StopEventPropagation,
    FoldableComponent,
    BootComponent,
    DragDropDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    FoldableModule,
    NgxsModule.forRoot([AppState, TimerState, CameraRollState, CameraState, FilterState], {
      developmentMode: false,
    }),
    NgxsReduxDevtoolsPluginModule.forRoot(),
  ],
  providers: [
    // @todo: uncomment to enable TF
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: loadTFMediaPipeModel,
    //   multi: true,
    //   deps: [FaceMeshService],
    // },
    {
      provide: APP_INITIALIZER,
      useFactory: installVirtualMediaDevice,
      multi: true,
      deps: [DeviceSourceService],
    },
  ],
  bootstrap: [BootComponent],
})
export class AppModule {}
