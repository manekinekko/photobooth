import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appDragDrop]',
})
export class DragDropDirective {
  @Output() onFileDropped = new EventEmitter<FileList>();

  @HostBinding('style.background-color') private background = '';

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.background = '#E17361';
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.background = '';
  }

  @HostListener('drop', ['$event']) public ondrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.background = '';
    let files = event.dataTransfer?.files;
    if (files?.length! > 0) {
      this.onFileDropped.emit(files);
    }
  }
}