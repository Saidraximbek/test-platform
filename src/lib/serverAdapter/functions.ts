import { apiRequest } from './client';

export const getFunctions = () => ({});
export const connectFunctionsEmulator = () => {};

export function httpsCallable<Req = any, Res = any>(
  _functions: any,
  name: string
): (data: Req) => Promise<{ data: Res }> {
  return async (data: Req) => {
    const res = await apiRequest<Res>(`/functions/${name}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { data: res };
  };
}
