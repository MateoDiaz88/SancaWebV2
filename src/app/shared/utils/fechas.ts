import { Rama } from "../../entitys/usuario.interface";

export function calcularEdad(fecha: string): number {
    const hoy = new Date();
    const nac = new Date(fecha + 'T00:00:00');
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
}

// Rangos aproximados: ajustalos a los de tu grupo
export function ramaPorEdad(edad: number): Rama | null {
    if (edad >= 7 && edad <= 10) return 'manada';
    if (edad >= 11 && edad <= 14) return 'unidad';
    if (edad >= 15 && edad <= 18) return 'caminantes';
    if (edad >= 18 && edad <= 22) return 'rover';
    return null;
}