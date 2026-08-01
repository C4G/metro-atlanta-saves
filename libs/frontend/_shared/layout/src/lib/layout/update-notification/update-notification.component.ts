import { Component, effect, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { PwaUpdateService } from '../../services/pwa-update.service';

@Component({
  selector: 'mas-update-notification',
  imports: [],
  template: '',
  standalone: true,
})
export class UpdateNotificationComponent {
  private readonly pwaUpdateService = inject(PwaUpdateService);
  private readonly snackBar = inject(MatSnackBar);
  private snackBarRef?: MatSnackBarRef<unknown>;

  constructor() {
    effect(() => {
      const isUpdateAvailable = this.pwaUpdateService.updateAvailable();
      if (isUpdateAvailable) {
        this.showUpdateNotification();
      }
    });
  }

  private showUpdateNotification(): void {
    // Dismiss any existing notification
    this.snackBarRef?.dismiss();

    // Show the update notification
    this.snackBarRef = this.snackBar.open(
      'A new version is available! Update now for the latest features and improvements.',
      'Update Now',
      {
        duration: undefined, // Keep open until user dismisses or clicks action
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass: ['update-snackbar'],
      },
    );

    // Handle the action button click
    this.snackBarRef.onAction().subscribe(async () => {
      try {
        await this.pwaUpdateService.applyUpdate();
      } catch (err) {
        console.error('Failed to apply update:', err);
        this.snackBar.open('Failed to apply update. Please refresh manually.', 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }
    });
  }
}
