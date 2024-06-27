import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  OnChanges,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements AfterViewInit, OnChanges {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.updateTooltip();
  }

  ngOnChanges() {
    this.updateTooltip();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateTooltip();
  }

  updateTooltip() {
    const element = this.el.nativeElement;
    setTimeout(() => {
      const textContent = element.textContent.trim();
      console.log(
        'Element:',
        element,
        'ScrollWidth:',
        element.scrollWidth,
        'ClientWidth:',
        element.clientWidth,
        'Text:',
        textContent
      );
      if (element.scrollWidth > element.clientWidth) {
        this.renderer.setAttribute(element, 'data-tooltip', textContent);
        console.log('Tooltip added:', textContent);
      } else {
        this.renderer.removeAttribute(element, 'data-tooltip');
        console.log('Tooltip removed');
      }
    }, 0);
  }
}
