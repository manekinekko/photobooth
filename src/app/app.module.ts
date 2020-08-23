import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';

import { AppComponent } from './app.component';
import { CameraComponent } from './camera.component';
import { TimerComponent } from './timer.component';
import { CameraRollComponent } from './camera-roll.component';
import { environment } from 'src/environments/environment';
import { TimerState as TimerState } from './store/timer.state';

@NgModule({
  declarations: [
    AppComponent,
    CameraComponent,
    TimerComponent,
    CameraRollComponent
  ],
  imports: [
    BrowserModule,
    NgxsModule.forRoot([TimerState], {
      developmentMode: !environment.production
    }),
    NgxsReduxDevtoolsPluginModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
