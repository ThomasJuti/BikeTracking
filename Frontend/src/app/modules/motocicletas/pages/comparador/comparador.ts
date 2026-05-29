import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SectionHeroComponent } from '../../components/section-hero/section-hero';
import { MotocicletasApiService } from '../../services/motocicletas-api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Moto } from '../../models/moto.model';

@Component({
  selector: 'app-comparador',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    SectionHeroComponent,
    DecimalPipe,
  ],
  templateUrl: './comparador.html',
})
export class ComparadorPageComponent implements OnInit {
  private readonly api = inject(MotocicletasApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  searchQuery = '';
  searchResults: any[] = [];
  comparedBikes: any[] = [];
  userMotos: Moto[] = [];
  selectedUserMotoId = '';
  loadingUserMotos = true;
  loading = false;
  alertText = '';
  alertType: 'success' | 'danger' | '' = '';
  modalOpen = false;
  selectedCatalogBike: any = null;

  form = this.fb.nonNullable.group({
    placa: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
    estado: ['activa', Validators.required],
    propietario: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Set default owner based on current logged in user
    const currentUser = this.auth.currentUser();
    if (currentUser) {
      this.form.patchValue({
        propietario: currentUser.name || currentUser.email || '',
      });
    }
    this.loadUserMotos();
  }

  loadUserMotos(): void {
    this.loadingUserMotos = true;
    this.api.listMotos().subscribe({
      next: (motos) => {
        this.userMotos = motos;
        if (motos.length === 1) {
          this.selectedUserMotoId = motos[0].id;
        }
        this.loadingUserMotos = false;
        this.cdr.detectChanges();
      },
      error: (e: Error) => {
        this.notify('danger', e.message || 'No se pudieron cargar tus motos.');
        this.loadingUserMotos = false;
        this.cdr.detectChanges();
      },
    });
  }

  get selectedUserMoto(): Moto | null {
    return this.userMotos.find((m) => m.id === this.selectedUserMotoId) ?? null;
  }

  selectUserMoto(id: string): void {
    this.selectedUserMotoId = id;
    this.cdr.detectChanges();
  }

  parseCilindraje(value: string | undefined): string {
    if (!value) return 'N/D';
    const match = value.match(/[\d.]+/);
    return match ? `${match[0]} cc` : value;
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.triggerSearch();
  }

  triggerSearch(): void {
    if (this.searchQuery.trim().length < 2) {
      this.searchResults = [];
      return;
    }

    this.loading = true;
    this.api.searchCatalog(this.searchQuery.trim(), 10).subscribe({
      next: (data) => {
        this.searchResults = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e: Error) => {
        this.searchResults = [];
        this.loading = false;
        this.notify('danger', e.message || 'Error al buscar en el catálogo.');
        this.cdr.detectChanges();
      },
    });
  }

  addToComparison(bike: any): void {
    // Check duplicate
    if (this.comparedBikes.some((b) => b.id === bike.id)) {
      this.notify('danger', 'Esta motocicleta ya esta en la lista de comparacion.');
      return;
    }

    if (this.comparedBikes.length >= 3) {
      this.notify('danger', 'Solo puedes comparar un maximo de 3 motocicletas.');
      return;
    }

    this.comparedBikes.push(bike);
    this.searchResults = [];
    this.searchQuery = '';
    this.cdr.detectChanges();
  }

  removeFromComparison(index: number): void {
    this.comparedBikes.splice(index, 1);
    this.cdr.detectChanges();
  }

  openRegisterModal(bike: any): void {
    this.selectedCatalogBike = bike;
    // Prefill owner if not set
    const currentUser = this.auth.currentUser();
    this.form.reset({
      placa: '',
      estado: 'activa',
      propietario: currentUser?.name || currentUser?.email || '',
    });
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.selectedCatalogBike = null;
  }

  onSubmitRegister(): void {
    if (this.form.invalid || !this.selectedCatalogBike) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const displacementStr = this.selectedCatalogBike.displacement
      ? `${this.selectedCatalogBike.displacement}cc`
      : 'N/D';

    const payload = {
      placa: v.placa.trim().toUpperCase(),
      marca: this.selectedCatalogBike.brand,
      modelo: this.selectedCatalogBike.model,
      anio: this.selectedCatalogBike.year,
      cilindraje: displacementStr,
      estado: v.estado,
      propietario: v.propietario.trim(),
    };

    this.api.createMoto(payload).subscribe({
      next: () => {
        this.notify('success', `Motocicleta ${payload.marca} ${payload.modelo} agregada a tus vehiculos.`);
        this.closeModal();
        this.loadUserMotos();
      },
      error: (e: Error) => {
        this.notify('danger', e.message);
      },
    });
  }

  private notify(type: 'success' | 'danger', text: string): void {
    this.alertType = type;
    this.alertText = text;
    setTimeout(() => {
      this.alertText = '';
      this.alertType = '';
      this.cdr.detectChanges();
    }, 3500);
  }
}
