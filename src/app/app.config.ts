import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { catchError, firstValueFrom } from 'rxjs';

import { routes } from './app.routes';

function initializeTranslations(translate: TranslateService): () => Promise<unknown> {
  return () => {
    const fallbackLanguage = 'pt-BR';
    const selectedLanguage = sessionStorage.getItem('language') ?? fallbackLanguage;

    translate.setDefaultLang(fallbackLanguage);
    return firstValueFrom(
      translate.use(selectedLanguage).pipe(
        catchError(() => translate.use(fallbackLanguage)),
      ),
    );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initializeTranslations,
      deps: [TranslateService],
    },
    provideRouter(routes),
    provideAnimationsAsync(),
  ]
};
