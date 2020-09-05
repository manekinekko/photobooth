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
import { FiltersPreviewComponent } from "./filters-preview/filters-preview.component";
import { DeviceIdFormatPipe } from "./shared/device-id-format.pipe";
import { TimerComponent } from "./timer/timer.component";
import { TimerState } from "./timer/timer.state";

// Load the MediaPipe facemesh model assets.
export function loadTFMediaPipeModel(faceMesh: FaceMeshService) {
  return async () => {
    const model = await faceMesh.initialize();
    console.log("MediaPipe facemesh model assets loaded.");
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
  ],
  imports: [
    BrowserModule,
    NgxsModule.forRoot([TimerState, CameraRollState, CameraState], {
      developmentMode: !environment.production,
    }),
    NgxsReduxDevtoolsPluginModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: loadTFMediaPipeModel,
      multi: true,
      deps: [FaceMeshService],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
