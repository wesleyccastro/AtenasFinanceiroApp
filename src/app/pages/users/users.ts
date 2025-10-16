import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { MockApiService } from '../../services/mock-api.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {
  currentUser = signal<User | null>(null);
  isMenuOpen = signal(false);
  activeMenu = signal<string>('users');

  users = signal<User[]>([]);
  isLoading = signal(false);
  showModal = signal(false);
  editingUser = signal<User | null>(null);
  userForm!: FormGroup;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  constructor(
    private authService: AuthService,
    private mockApiService: MockApiService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
    this.loadUsers();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', []],
      role: ['USER', Validators.required]
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.mockApiService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Erro ao carregar usuários');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.editingUser.set(null);
    this.userForm.reset({ role: 'USER' });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingUser.set(null);
    this.userForm.reset();
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const userData = this.userForm.value;

    if (this.editingUser()) {
      // Atualizar usuário existente
      const updateData: any = {
        name: userData.name,
        email: userData.email,
        role: userData.role
      };

      if (userData.password) {
        updateData.password = userData.password;
      }

      this.mockApiService.updateUser(this.editingUser()!.id, updateData).subscribe({
        next: () => {
          this.successMessage.set('Usuário atualizado com sucesso!');
          this.loadUsers();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Erro ao atualizar usuário');
          this.isLoading.set(false);
        }
      });
    } else {
      // Criar novo usuário
      this.mockApiService.createUser(userData).subscribe({
        next: () => {
          this.successMessage.set('Usuário criado com sucesso!');
          this.loadUsers();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Erro ao criar usuário');
          this.isLoading.set(false);
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (user.id === this.currentUser()?.id) {
      alert('Você não pode excluir seu próprio usuário!');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      return;
    }

    this.isLoading.set(true);
    this.mockApiService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage.set('Usuário excluído com sucesso!');
        this.loadUsers();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Erro ao excluir usuário');
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 3000);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return 'Este campo é obrigatório';
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['minLength']) return `Mínimo de ${field.errors['minLength'].requiredLength} caracteres`;
    }
    return '';
  }

  // Navegação
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
    this.router.navigate(['/dashboard']);
  }

  goToUsers(): void {
    this.setActiveMenu('users');
  }

  goToRevenue(): void {
    this.router.navigate(['/revenue']);
  }

  goToExpenses(): void {
    this.router.navigate(['/expenses']);
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }
}

