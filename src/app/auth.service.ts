import { Injectable } from '@angular/core';
import {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult,
  AuthError,
} from '@azure/msal-browser';
import { msalConfig } from './auth-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly app: PublicClientApplication;
  private isMsalInitialized: boolean = false;

  constructor() {
    this.app = new PublicClientApplication(msalConfig);
  }

  private async initializeMsal(): Promise<void> {
    try {
      await this.app.initialize();
      const redirectResponse = await this.app.handleRedirectPromise();

      if (redirectResponse && redirectResponse.account) {
        this.app.setActiveAccount(redirectResponse.account);
      } else {
        const accounts = this.app.getAllAccounts();
        if (accounts.length > 0) {
          this.app.setActiveAccount(accounts[0]);
        }
      }

      this.isMsalInitialized = true;
    } catch (error: unknown) {
      console.error('MSAL initialization error:', error);
    }
  }

  async login(): Promise<void> {
    if (!this.isMsalInitialized) {
      await this.initializeMsal();
    }

    try {
      const loginResponse: AuthenticationResult = await this.app.loginPopup({
        scopes: ['openid', 'profile', 'User.Read'],
        prompt: 'select_account',
      });

      if (loginResponse.account) {
        this.app.setActiveAccount(loginResponse.account);
      }
    } catch (error: unknown) {
      if (error instanceof AuthError) {
        console.error('Authentication error:', error.errorMessage);
      } else {
        console.error('Unexpected error during login:', error);
      }
    }
  }

logout(): void {
  const account: AccountInfo | null = this.app.getActiveAccount();

  if (!account) {
    console.warn('No active account set. Cannot perform logout.');
    return;
  }

  const idToken = account.idToken; 
  const loginHint = account.idTokenClaims?.login_hint;

  if (!idToken || !loginHint) {
    console.warn('Missing id_token or login_hint. Proceeding with fallback logout.');
    this.app.logoutRedirect({
      account,
      postLogoutRedirectUri: 'http://localhost:4200',
    });
    return;
  }

  console.log('Logging out with login_hint:', loginHint);
  const tenantId = '<TenantID>'; 
  const logoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
    `?id_token_hint=${encodeURIComponent(idToken)}` +
    `&logout_hint=${encodeURIComponent(loginHint)}` +
    `&post_logout_redirect_uri=${encodeURIComponent('http://localhost:4200')}`;

  window.location.href = logoutUrl;
}
}
