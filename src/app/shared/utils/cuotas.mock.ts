export interface Pago {
    usuarioId: string;
    anio: number;
    mes: number;          // 3 a 12
    fechaPago: string;    // 'YYYY-MM-DD'
}



const ANIO = new Date().getFullYear();

const pagar = (usuarioId: string, meses: number[]): Pago[] =>
    meses.map(mes => ({
        usuarioId,
        anio: ANIO,
        mes,
        fechaPago: `${ANIO}-${String(mes).padStart(2, '0')}-10`,
    }));

export const PAGOS_MOCK: Pago[] = [
    ...pagar('3', [3, 4, 5, 6, 7, 8, 9, 10]),   // Tomás: al día
    ...pagar('4', [3, 4, 5, 6, 7]),             // Valentina: debe ago, sep, oct
    ...pagar('5', [3, 4, 6, 9]),                // Joaquín: debe varias
];