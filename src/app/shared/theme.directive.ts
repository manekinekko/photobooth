import { Directive, ElementRef, Renderer2 } from "@angular/core";
import { AppService } from "../app.service";

@Directive({
  selector: "[appTheme]",
})
export class ThemeDirective {
  constructor(private element: ElementRef<HTMLElement>, private renderer: Renderer2, private app: AppService) {}

  async ngOnInit() {
    if (await this.app.isRunningInMSTeams()) {
      this.element.nativeElement.style.setProperty("--background-color", "#464775");
      this.element.nativeElement.style.setProperty("--border-color", "#333448");
    } else {
      this.element.nativeElement.style.setProperty("--background-color", "#585454");
      this.element.nativeElement.style.setProperty("--border-color", "#474444");
    }
  }
}
