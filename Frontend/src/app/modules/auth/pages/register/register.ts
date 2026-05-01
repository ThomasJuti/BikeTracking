import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  passwordStrength = computed(() => {
    const pw = this.form.get('password')?.value ?? '';
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  });

  strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Muy segura'];

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    const { name, email, password } = this.form.getRawValue();
    this.auth.register({ name, email, password }).subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (err: Error) => {
        this.error.set(err.message || 'Error al crear cuenta. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
