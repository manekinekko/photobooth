import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import * as microsoftTeams from "@microsoft/teams-js";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { AppModule } from "./app/app.module";
import { AppService, CONTEXT } from "./app/app.service";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then((moduleRef) => {
    if (environment.production) {
      microsoftTeams.initialize(() => {
        const app = moduleRef.injector.get(AppService);
        app.setContext(CONTEXT.MS_TEAMS);
      });

      microsoftTeams.settings.setValidityState(true);
      microsoftTeams.settings.registerOnSaveHandler((saveEvent) => {
        microsoftTeams.settings.setSettings(environment.msTeams);
        saveEvent.notifySuccess();
      });
    }
  })
  .catch((err) => console.error(err));
