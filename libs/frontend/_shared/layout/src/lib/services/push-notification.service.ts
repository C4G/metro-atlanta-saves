import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async subscribe(): Promise<void> {
    if (!this.isBrowser) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await this.sendSubscriptionToServer(existing);
        return;
      }

      const { publicKey } = await firstValueFrom(
        this.http.get<{ publicKey: string }>('/api/discussion-boards/push/vapid-public-key'),
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey),
      });

      await this.sendSubscriptionToServer(subscription);
    } catch {
      return;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.isBrowser) return;
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await firstValueFrom(
        this.http.post('/api/discussion-boards/push/unsubscribe', { endpoint: subscription.endpoint }),
      );
      await subscription.unsubscribe();
    } catch {
      return;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    await firstValueFrom(
      this.http.post('/api/discussion-boards/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: json.keys?.['p256dh'] ?? '',
          auth: json.keys?.['auth'] ?? '',
        },
      }),
    );
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const output = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      output[i] = rawData.charCodeAt(i);
    }
    return output;
  }
}
