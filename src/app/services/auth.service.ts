import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MockApiService } from './mock-api.service';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  agreeTerms: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  public isAuthenticated = signal(false);
  public currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private mockApiService: MockApiService
  ) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Usa o MockApiService para validar credenciais
    return this.mockApiService.login(credentials).pipe(
      tap(response => {
        this.setAuthData(response, credentials.rememberMe || false);
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    // Usa o MockApiService para registrar usuário
    return this.mockApiService.register(userData).pipe(
      tap(response => {
        this.setAuthData(response, false);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  hasRole(role: 'ADMIN' | 'USER'): boolean {
    const user = this.currentUser();
    return user?.role === role;
  }

  private setAuthData(response: AuthResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', response.token);
    storage.setItem('user', JSON.stringify(response.user));

    this.currentUserSubject.next(response.user);
    this.isAuthenticated.set(true);
    this.currentUser.set(response.user);
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (token && userStr && this.isLoggedIn()) {
      const user = JSON.parse(userStr);
      this.currentUserSubject.next(user);
      this.isAuthenticated.set(true);
      this.currentUser.set(user);
    }
  }
}
