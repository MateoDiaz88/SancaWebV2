export interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  rama: string | null;
  importante: boolean;
  created_at: string;
}
