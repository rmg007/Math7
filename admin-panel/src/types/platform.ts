import { Tables, TablesInsert, TablesUpdate } from '@questerix/core/types/database';

export type App = Tables<'apps'>;
export interface CompiledApp extends App {
  subjects: {
    title: string;
  } | null;
}
export type AppInsert = TablesInsert<'apps'>;
export type AppUpdate = TablesUpdate<'apps'>;
