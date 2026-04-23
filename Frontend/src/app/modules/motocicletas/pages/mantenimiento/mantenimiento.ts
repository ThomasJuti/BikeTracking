import { isPlatformBrowser, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SectionHeroComponent } from '../../components/section-hero/section-hero';
import { Mantenimiento } from '../../models/mantenimiento.model';
import { Moto } from '../../models/moto.model';
import { MotocicletasApiService } from '../../services/motocicletas-api.service';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, SectionHeroComponent, CurrencyPipe, DatePipe],
  templateUrl: './mantenimiento.html',
})
export class MantenimientoPageComponent implements OnInit {
  private readonly api = inject(MotocicletasApiService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  motos: Moto[] = [];
  mantenimientos: Mantenimiento[] = [];
  loadingMotos = true;
  alertText = '';
  alertType: 'success' | 'danger' | 'warning' | '' = '';

  readonly todayIso = this.toIsoDate(new Date());

  form = this.fb.nonNullable.group({
    moto_id: ['', Validators.required],
    tipo: ['', Validators.required],
    descripcion: ['', Validators.required],
    fecha: ['', Validators.required],
    costo: [0 as number, [Validators.required, Validators.min(0)]],
    tecnico: ['', Validators.required],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loadingMotos = false;
      return;
    }
    this.loadMotos();
  }

  private toIsoDate(d: Date): string {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.toISOString().slice(0, 10);
  }

  loadMotos(): void {
    this.loadingMotos = true;
    forkJoin({
      motos: this.api.listMotos(),
      mantenimientos: this.api.listMantenimientos(),
    }).subscribe({
      next: ({ motos, mantenimientos }) => {
        this.motos = motos;
        this.mantenimientos = mantenimientos;
        const motoCtrl = this.form.controls.moto_id;
        if (!motos.length) {
          motoCtrl.disable();
          motoCtrl.setValue('');
        } else {
          motoCtrl.enable();
          if (motos.length === 1) {
            motoCtrl.setValue(motos[0].id);
          }
        }
        this.loadingMotos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notify('warning', 'No se pudo cargar la lista de motocicletas.');
        this.loadingMotos = false;
        this.cdr.detectChanges();
      },
    });
  }

  submit(): void {
    if (this.form.invalid || !this.motos.length) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const fecha = v.fecha;
    if (fecha) {
      const selected = new Date(fecha + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected > today) {
        this.notify('danger', 'La fecha no puede ser futura.');
        return;
      }
    }

    this.api
      .createMantenimiento({
        moto_id: v.moto_id,
        tipo: v.tipo,
        descripcion: v.descripcion.trim(),
        fecha: v.fecha,
        costo: Number(v.costo),
        tecnico: v.tecnico.trim(),
      })
      .subscribe({
        next: () => {
          this.notify('success', 'Mantenimiento registrado correctamente.');
          this.form.reset({
            moto_id: this.motos.length === 1 ? this.motos[0].id : '',
            tipo: '',
            descripcion: '',
            fecha: '',
            costo: 0,
            tecnico: '',
          });
          this.loadMotos();
        },
        error: (e: Error) => this.notify('danger', e.message),
      });
  }

  limpiar(): void {
    this.form.reset({
      moto_id: this.motos.length === 1 ? this.motos[0].id : '',
      tipo: '',
      descripcion: '',
      fecha: '',
      costo: 0,
      tecnico: '',
    });
  }

  getMotoPlaca(id: string): string | undefined {
    return this.motos.find((m) => m.id === id)?.placa;
  }

  private notify(
    type: 'success' | 'danger' | 'warning',
    text: string,
  ): void {
    this.alertType = type;
    this.alertText = text;
    if (type === 'success' || type === 'warning') {
      setTimeout(() => {
        this.alertText = '';
        this.alertType = '';
      }, 3000);
    }
  }
}
