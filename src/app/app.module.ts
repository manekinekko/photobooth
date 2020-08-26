import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgxsReduxDevtoolsPluginModule } from "@ngxs/devtools-plugin";
import { NgxsModule } from "@ngxs/store";
import { environment } from "src/environments/environment";
import { AppComponent } from "./app.component";
import { CameraRollComponent } from "./camera-roll/camera-roll.component";
import { CameraComponent } from "./camera/camera.component";
import { TimerState } from "./timer/timer.state";
import { TimerComponent } from "./timer/timer.component";
import { CameraRollState } from "./camera-roll/camera-roll.state";
import { CameraState } from "./camera/camera.state";
import { DeviceIdFormatPipe } from './camera/device-id-format.pipe';
import { FiltersComponent } from './filters/filters.component';

@NgModule({
  declarations: [AppComponent, CameraComponent, TimerComponent, CameraRollComponent, DeviceIdFormatPipe, FiltersComponent],
  imports: [
    BrowserModule,
    NgxsModule.forRoot([TimerState, CameraRollState, CameraState], {
      developmentMode: !environment.production,
    }),
    NgxsReduxDevtoolsPluginModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
