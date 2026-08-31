import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';
export type BundleItem = {
  routineId: string;
  position: number;
  routine: { id: string; name: string; emoji: string } | null;
};
export type RoutineBundle = { id: string; title: string; streak: number; items: BundleItem[] };
export type BundlePage = {
  items: RoutineBundle[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};
export const fetchBundles = (page = 1, pageSize = 6) =>
  httpClient.get('/api/routine-bundles', { params: { page, pageSize } }).then(unwrap<BundlePage>);
export const createBundle = (input: { title: string; routineIds: string[] }) =>
  httpClient.post('/api/routine-bundles', input).then(unwrap<RoutineBundle>);
export const fetchBundle = (id: string) =>
  httpClient.get(`/api/routine-bundles/${id}`).then(unwrap<RoutineBundle>);
export const checkInBundle = (id: string, completed: boolean) =>
  httpClient
    .post(`/api/routine-bundles/${id}/check-ins`, { completed })
    .then(unwrap<{ bundle: RoutineBundle }>);
