import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { User, LoginRequest, RegisterRequest, AuthResponse } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MockApiService {
  private users: User[] = [
    {
      id: 1,
      name: 'Administrador',
      email: 'admin@atenas.com',
      role: 'ADMIN'
    },
    {
      id: 2,
      name: 'Usuário Teste',
      email: 'user@atenas.com',
      role: 'USER'
    }
  ];

  private passwords: { [key: string]: string } = {
    'admin@atenas.com': 'admin123',
    'user@atenas.com': 'user123'
  };

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        const user = this.users.find(u => u.email === credentials.email);

        if (!user || this.passwords[credentials.email] !== credentials.password) {
          observer.error({ message: 'Email ou senha inválidos' });
          return;
        }

        const token = this.generateJWT(user);
        observer.next({
          token,
          user
        });
        observer.complete();
      }, 1000); // Simula delay da API
    });
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        // Verifica se email já existe
        if (this.users.find(u => u.email === userData.email)) {
          observer.error({ message: 'Email já cadastrado' });
          return;
        }

        // Verifica se aceitou os termos
        if (!userData.agreeTerms) {
          observer.error({ message: 'Você deve aceitar os termos de privacidade' });
          return;
        }

        const newUser: User = {
          id: this.users.length + 1,
          name: userData.name,
          email: userData.email,
          role: 'USER' // Novos usuários sempre começam como USER
        };

        this.users.push(newUser);
        this.passwords[userData.email] = userData.password;

        const token = this.generateJWT(newUser);
        observer.next({
          token,
          user: newUser
        });
        observer.complete();
      }, 1500); // Simula delay da API
    });
  }

  // Métodos para gerenciamento de usuários
  getUsers(): Observable<User[]> {
    return of([...this.users]).pipe(delay(500));
  }

  getUserById(id: number): Observable<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return throwError(() => ({ message: 'Usuário não encontrado' }));
    }
    return of(user).pipe(delay(300));
  }

  createUser(userData: { name: string; email: string; password: string; role: 'USER' | 'ADMIN' }): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        // Verifica se email já existe
        if (this.users.find(u => u.email === userData.email)) {
          observer.error({ message: 'Email já cadastrado' });
          return;
        }

        const newUser: User = {
          id: Math.max(...this.users.map(u => u.id), 0) + 1,
          name: userData.name,
          email: userData.email,
          role: userData.role
        };

        this.users.push(newUser);
        this.passwords[userData.email] = userData.password;

        observer.next(newUser);
        observer.complete();
      }, 800);
    });
  }

  updateUser(id: number, userData: { name: string; email: string; role: 'USER' | 'ADMIN'; password?: string }): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) {
          observer.error({ message: 'Usuário não encontrado' });
          return;
        }

        const oldEmail = this.users[index].email;

        // Verifica se o novo email já existe em outro usuário
        if (userData.email !== oldEmail && this.users.find(u => u.email === userData.email)) {
          observer.error({ message: 'Email já cadastrado' });
          return;
        }

        this.users[index] = {
          id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        };

        // Atualiza email no registro de senhas
        if (userData.email !== oldEmail) {
          this.passwords[userData.email] = this.passwords[oldEmail];
          delete this.passwords[oldEmail];
        }

        // Atualiza senha se fornecida
        if (userData.password) {
          this.passwords[userData.email] = userData.password;
        }

        observer.next(this.users[index]);
        observer.complete();
      }, 800);
    });
  }

  deleteUser(id: number): Observable<void> {
    return new Observable(observer => {
      setTimeout(() => {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) {
          observer.error({ message: 'Usuário não encontrado' });
          return;
        }

        const email = this.users[index].email;
        this.users.splice(index, 1);
        delete this.passwords[email];

        observer.next();
        observer.complete();
      }, 600);
    });
  }

  private generateJWT(user: User): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`${encodedHeader}.${encodedPayload}.secret`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
}
