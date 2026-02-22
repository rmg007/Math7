import { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';

export type App = Tables<'apps'>;
export interface CompiledApp extends App {
  subjects: {
    title: string;
  } | null;
}
export type AppInsert = TablesInsert<'apps'>;
export type AppUpdate = TablesUpdate<'apps'>;
