import { DOCUMENT, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';

export const seoResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const document = inject(DOCUMENT);
  // Add meta title
  inject(Title).setTitle(route.data['seo']?.title);
  // Update meta description
  inject(Meta).updateTag({ name: 'description', content: route.data['seo']?.description });

  // Add canonical link
  const link = document.createElement('link');
  link.setAttribute('rel', 'canonical');
  document.head.appendChild(link);
  link.setAttribute('href', document.URL.replace(/^https?/g, 'https'));

  return true;
};
