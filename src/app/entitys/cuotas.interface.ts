export interface Cuota {
    id: string;
    userId: string;
    year: number;
    month: number;            // 3 a 12
    paid: boolean;
    paidAt: string | null;    // 'YYYY-MM-DD'
    amount: number | null;    // lo que se cobró
}

export interface CuotasConfig {
    id: string;
    year: number;
    amount: number;           // valor de la cuota mensual de ese año
}