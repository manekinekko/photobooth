import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgxsReduxDevtoolsPluginModule } from "@ngxs/devtools-plugin";
import { NgxsModule } from "@ngxs/store";
import { environment } from "src/environments/environment";
import { AppComponent } from "./app.component";
import { CameraRollComponent } from "./camera-roll.component";
import { CameraComponent } from "./camera.component";
import { TimerState } from "./store/timer.state";
import { TimerComponent } from "./timer.component";

@NgModule({
  declarations: [AppComponent, CameraComponent, TimerComponent, CameraRollComponent],
  imports: [
    BrowserModule,
    NgxsModule.forRoot([TimerState], {
      developmentMode: !environment.production,
    }),
    NgxsReduxDevtoolsPluginModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
