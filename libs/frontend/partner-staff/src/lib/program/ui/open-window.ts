import { ComponentType } from '@angular/cdk/portal';
import { Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

export type WindowOptions<D> = {
  width: string;
  labelledBy: string;
  data?: D;
  injector?: Injector;
};

export const isPhoneWidth = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(max-width: 639px)').matches;

export const openWindow = <T, D = unknown, R = unknown>(
  dialog: MatDialog,
  component: ComponentType<T>,
  { width, labelledBy, data, injector }: WindowOptions<D>,
) =>
  dialog.open<T, D, R>(component, {
    data,
    injector,
    width,
    maxWidth: 'calc(100vw - 1rem)',
    panelClass: 'mas-card-dialog',
    backdropClass: 'mas-card-backdrop',
    position: isPhoneWidth() ? { top: '4.5rem' } : undefined,
    ariaLabelledBy: labelledBy,
    autoFocus: 'dialog',
  });
