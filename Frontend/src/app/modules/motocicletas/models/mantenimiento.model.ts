export interface Mantenimiento {
  id: string;
  moto_id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  costo: number;
  tecnico: string;
  kilometraje?: number | null;
  fechaRegistro: string;
}
