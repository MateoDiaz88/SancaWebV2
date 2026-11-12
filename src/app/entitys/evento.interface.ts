// entitys/evento.interface.ts
import { Rama } from './usuario.interface';

export type TipoEvento = 'reunion' | 'salida' | 'campamento' | 'otro';

export interface Evento {
    id: string;
    titulo: string;
    descripcion: string | null;
    tipo: TipoEvento;
    lugar: string | null;
    rama: Rama | null;      // null = todas las ramas
    fecha: string;          // 'YYYY-MM-DD'
    creado_por: string;
    fechaFin: string;       // 'YYYY-MM-DD'
    hora: string | null;    // 'HH:mm'
}

export interface EventoForm {
    titulo: string;
    tipo: TipoEvento;
    fecha: string;
    fechaFin: string;
    hora: string | null;
    lugar: string | null;
    rama: Rama | null;
    descripcion: string | null;
}