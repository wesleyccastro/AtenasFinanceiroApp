import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentUser = signal<User | null>(null);
  isMenuOpen = signal(false);
  activeMenu = signal<string>('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  setActiveMenu(menu: string): void {
    this.activeMenu.set(menu);
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }

  goToHome(): void {
    this.setActiveMenu('home');
    // Implementar navegação para home
  }

  goToUsers(): void {
    this.router.navigate(['/users']);
  }

  goToRevenue(): void {
    this.setActiveMenu('revenue');
    // Implementar navegação para receitas
  }

  goToExpenses(): void {
    this.setActiveMenu('expenses');
    // Implementar navegação para despesas
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }
}
