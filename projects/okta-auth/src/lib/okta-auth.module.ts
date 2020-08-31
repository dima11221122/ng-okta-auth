import { ModuleWithProviders, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { OktaAuthInterceptor } from './services/okta-auth/okta-auth.interceptor';

@NgModule({
  declarations: [],
  imports: [
  ],
  exports: [],
})
export class OktaAuthModule {
  static forRoot(): ModuleWithProviders<OktaAuthModule> {
    return {
      ngModule: OktaAuthModule,
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: OktaAuthInterceptor, multi: true }
      ]
    };
  }
}
