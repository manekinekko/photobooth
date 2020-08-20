import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CameraComponent } from './camera.component';
import { CounterComponent } from './counter.component';
import { CameraRollComponent } from './camera-roll.component';

@NgModule({
  declarations: [
    AppComponent,
    CameraComponent,
    CounterComponent,
    CameraRollComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
