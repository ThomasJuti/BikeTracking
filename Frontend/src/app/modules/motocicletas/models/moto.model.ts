export interface Moto {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  cilindraje: string;
  estado: string;
  propietario: string;
  kilometrajeActual?: number | null;
  fechaRegistro: string;
}
