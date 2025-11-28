import http from '@/utils/http';
import type { LoginResponseDTO } from '@/types/login';

export async function login(params: { account: string; password: string }) {
    const res = await http.post<LoginResponseDTO>('/auth/login', params);
    return res;
}
