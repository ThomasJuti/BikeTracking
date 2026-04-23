import { isPlatformBrowser } from '@angular/common';
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
import { MotoStatusBadgeComponent } from '../../components/moto-status-badge/moto-status-badge';
import { SectionHeroComponent } from '../../components/section-hero/section-hero';
import { Moto } from '../../models/moto.model';
import { MotocicletasApiService } from '../../services/motocicletas-api.service';

@Component({
  selector: 'app-mi-moto',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    SectionHeroComponent,
    MotoStatusBadgeComponent,
  ],
  templateUrl: './mi-moto.html',
})
export class MiMotoPageComponent implements OnInit {
  private readonly api = inject(MotocicletasApiService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly maxYear = new Date().getFullYear() + 1;

  motos: Moto[] = [];
  loading = true;
  alertText = '';
  alertType: 'success' | 'danger' | '' = '';
  modalOpen = false;
  modalTitle = 'Registrar mi motocicleta';

  form = this.fb.nonNullable.group({
    id: [''],
    placa: ['', Validators.required],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    anio: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(1900), Validators.max(this.maxYear)],
    ],
    cilindraje: ['', Validators.required],
    estado: ['activa', Validators.required],
    propietario: ['', Validators.required],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }
    this.loadMotos();
  }

  loadMotos(): void {
    this.loading = true;
    this.api.listMotos().subscribe({
      next: (data) => {
        this.motos = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e: Error) => {
        this.notify('danger', e.message);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openModalNew(): void {
    this.modalTitle = 'Registrar mi motocicleta';
    this.form.reset({
      id: '',
      placa: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      cilindraje: '',
      estado: 'activa',
      propietario: '',
    });
    this.modalOpen = true;
  }

  openModalEdit(moto: Moto): void {
    this.modalTitle = 'Editar mi motocicleta';
    this.form.patchValue({
      id: moto.id,
      placa: moto.placa,
      marca: moto.marca,
      modelo: moto.modelo,
      anio: moto.anio,
      cilindraje: moto.cilindraje,
      estado: moto.estado,
      propietario: moto.propietario,
    });
    this.modalOpen = true;
  }

  editMotoClick(moto: Moto): void {
    this.openModalEdit(moto);
  }

  deleteMotoClick(id: string): void {
    this.deleteMoto(id);
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      placa: v.placa.trim().toUpperCase(),
      marca: v.marca.trim(),
      modelo: v.modelo.trim(),
      anio: v.anio,
      cilindraje: v.cilindraje.trim(),
      estado: v.estado,
      propietario: v.propietario.trim(),
    };
    const targetId = v.id;

    if (targetId) {
      this.api.updateMoto(targetId, payload).subscribe({
        next: () => {
          this.notify('success', 'Datos de tu moto actualizados.');
          this.closeModal();
          this.loadMotos();
        },
        error: (e: Error) => this.notify('danger', e.message),
      });
    } else {
      this.api.createMoto(payload).subscribe({
        next: () => {
          this.notify('success', 'Tu moto fue registrada.');
          this.closeModal();
          this.loadMotos();
        },
        error: (e: Error) => this.notify('danger', e.message),
      });
    }
  }

  deleteMoto(id: string): void {
    if (!confirm('Esta accion eliminara la ficha de tu moto. Deseas continuar?')) {
      return;
    }
    this.api.deleteMoto(id).subscribe({
      next: () => {
        this.notify('success', 'La ficha de tu moto fue eliminada.');
        this.loadMotos();
      },
      error: (e: Error) => this.notify('danger', e.message),
    });
  }

  private notify(type: 'success' | 'danger', text: string): void {
    this.alertType = type;
    this.alertText = text;
    setTimeout(() => {
      this.alertText = '';
      this.alertType = '';
    }, 2800);
  }
}
