
export type Rama = 'manada' | 'unidad' | 'caminantes' | 'rover';
export interface Usuario {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    email: string;
    fechaNacimiento: string;   // 'YYYY-MM-DD'
    rol: 'protagonista' | 'educador' | 'admin';
    rama: Rama | null;
    activo: boolean;
}