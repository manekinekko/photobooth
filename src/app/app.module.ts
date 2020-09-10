import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgxsReduxDevtoolsPluginModule } from "@ngxs/devtools-plugin";
import { NgxsModule } from "@ngxs/store";
import { environment } from "src/environments/environment";
import { AppComponent } from "./app.component";
import { CameraRollComponent } from "./camera-roll/camera-roll.component";
import { CameraRollState } from "./camera-roll/camera-roll.state";
import { CameraComponent } from "./camera/camera.component";
import { CameraState } from "./camera/camera.state";
import { FaceMeshService } from "./camera/face-mesh.service";
import { DeviceSourceComponent } from "./device-source/device-source.component";
import { DeviceSourceService } from "./device-source/device-source.service";
import { FiltersPreviewComponent } from "./filters-preview/filters-preview.component";
import { FilterState } from "./filters-preview/filters-preview.state";
import { DeviceIdFormatPipe } from "./shared/device-id-format.pipe";
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
  ],
  imports: [
    BrowserModule,
    NgxsModule.forRoot([TimerState, CameraRollState, CameraState, FilterState], {
      developmentMode: !environment.production,
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
  bootstrap: [AppComponent],
})
export class AppModule {}
