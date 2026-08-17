import { DOCUMENT, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { type IntroductionConfig, IntroductionStore } from '@mas/frontend-shared-data-access';
import { catchError, map, of, tap } from 'rxjs';

const DEFAULT_TITLE_ENDING = 'Financial Wellbeing Alliance';

const formatTitle = (pageTitle: string | undefined, titleEnding: string): string =>
  [pageTitle?.trim(), titleEnding.trim()].filter(Boolean).join(' | ');

export const seoResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const document = inject(DOCUMENT);
  const title = inject(Title);
  const introductionStore = inject(IntroductionStore);
  const cachedIntroduction = introductionStore.introduction();
  const introduction$ =
    cachedIntroduction.id === '-1'
      ? inject(HttpClient)
          .get<IntroductionConfig>('/api/introduction')
          .pipe(tap((introduction) => introductionStore.setIntroduction(introduction)))
      : of(cachedIntroduction);

  inject(Meta).updateTag({ name: 'description', content: route.data['seo']?.description });

  // Add canonical link
  const link = document.createElement('link');
  link.setAttribute('rel', 'canonical');
  document.head.appendChild(link);
  link.setAttribute('href', document.URL.replace(/^https?/g, 'https'));

  return introduction$.pipe(
    tap((introduction) => title.setTitle(formatTitle(route.data['seo']?.title, introduction.titleEnding))),
    map(() => true),
    catchError(() => {
      title.setTitle(formatTitle(route.data['seo']?.title, DEFAULT_TITLE_ENDING));
      return of(true);
    }),
  );
};
