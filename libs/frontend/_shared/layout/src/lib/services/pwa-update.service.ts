import { ApplicationRef, inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface UpdateNotification {
  message: string;
  action: () => void;
  dismiss?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  readonly updateAvailable = toSignal(
    this.swUpdate.versionUpdates.pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')),
  );

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.initializeUpdateCheck();
    }
  }

  /**
   * Initialize periodic update checks
   * Checks every 6 hours after the app stabilizes
   */
  private initializeUpdateCheck(): void {
    // Wait for app to stabilize, then check for updates every 6 hours
    const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable === true));
    const everySixHours$ = interval(6 * 60 * 60 * 1000); // 6 hours

    concat(appIsStable$, everySixHours$).subscribe(async () => {
      try {
        const updateFound = await this.swUpdate.checkForUpdate();
        console.log(updateFound ? 'A new version is available.' : 'Already on the latest version.');
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    });
  }

  /**
   * Force immediate update and reload
   * Use this if you want to force updates without user interaction
   */
  async forceUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      console.warn('Service Worker is not enabled');
      return;
    }

    try {
      // Activate the new version immediately
      await this.swUpdate.activateUpdate();
      // Reload the page to apply the update
      document.location.reload();
    } catch (err) {
      console.error('Failed to apply update:', err);
    }
  }

  /**
   * Apply update with user confirmation
   * Returns a promise that resolves when the update is applied
   */
  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      console.warn('Service Worker is not enabled');
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch (err) {
      console.error('Failed to apply update:', err);
      throw err;
    }
  }

  /**
   * Check for updates manually
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.swUpdate.checkForUpdate();
    } catch (err) {
      console.error('Failed to check for updates:', err);
      return false;
    }
  }
}
