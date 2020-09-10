import { Directive, HostListener } from "@angular/core";

@Directive({
  selector: "[stopEventPropagation]",
})
export class StopEventPropagation {
  @HostListener("click", ["$event"])
  public onClick(event: any): void {
    event.stopPropagation();
  }
}
