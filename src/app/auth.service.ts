import { Injectable } from '@angular/core';
import {
  PublicClientApplication,
  AuthError
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
    this.initializeMsal(); 
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
      const loginResponse = await this.app.loginPopup({
        scopes: ['openid', 'profile', 'User.Read'],
        prompt: 'select_account',
      });

      if (loginResponse.account) {
        this.app.setActiveAccount(loginResponse.account);
        console.log('Logged in successfully.');
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
    const activeAccount = this.app.getActiveAccount();

    if (!activeAccount) {
      console.warn('No active account set. Cannot perform logout.');
      return;
    }
    this.app.setActiveAccount(null);
    console.log('Logged out successfully.');
    setTimeout(() => {
      window.location.href = 'http://localhost:4200';
    }, 300000);
  }
}
