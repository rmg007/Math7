BEGIN;
INSERT INTO kb_registry (name, type, platform, tech_stack) 
             VALUES ('questerix-admin', 'app', 'cloudflare-pages', '{"framework":"react","build":"vite"}') 
             ON CONFLICT (name) DO UPDATE SET 
                type = EXCLUDED.type, 
                platform = EXCLUDED.platform, 
                tech_stack = EXCLUDED.tech_stack,
                updated_at = NOW();
INSERT INTO kb_registry (name, type, platform, tech_stack) 
             VALUES ('questerix-student', 'app', 'cloudflare-pages', '{"framework":"flutter","target":"web"}') 
             ON CONFLICT (name) DO UPDATE SET 
                type = EXCLUDED.type, 
                platform = EXCLUDED.platform, 
                tech_stack = EXCLUDED.tech_stack,
                updated_at = NOW();
INSERT INTO kb_registry (name, type, platform, tech_stack) 
             VALUES ('questerix-landing (DISABLED - NEVER DEPLOY)', 'app', 'cloudflare-pages', '{"framework":"react","build":"vite"}') 
             ON CONFLICT (name) DO UPDATE SET 
                type = EXCLUDED.type, 
                platform = EXCLUDED.platform, 
                tech_stack = EXCLUDED.tech_stack,
                updated_at = NOW();
INSERT INTO kb_registry (name, type, platform, tech_stack) 
             VALUES ('questerix-backend', 'service', 'supabase', '{"rls":"enabled","database":"postgresql"}') 
             ON CONFLICT (name) DO UPDATE SET 
                type = EXCLUDED.type, 
                platform = EXCLUDED.platform, 
                tech_stack = EXCLUDED.tech_stack,
                updated_at = NOW();
INSERT INTO kb_registry (name, type, platform, tech_stack) 
             VALUES ('project-oracle', 'service', 'local-psh', '{"engine":"pgvector","model":"text-embedding-3-small"}') 
             ON CONFLICT (name) DO UPDATE SET 
                type = EXCLUDED.type, 
                platform = EXCLUDED.platform, 
                tech_stack = EXCLUDED.tech_stack,
                updated_at = NOW();
INSERT INTO kb_registry (name, type, platform, tech_stack) 
             VALUES ('questerix-domain', 'library', 'dart-package', '{"framework":"dart","codegen":"freezed"}') 
             ON CONFLICT (name) DO UPDATE SET 
                type = EXCLUDED.type, 
                platform = EXCLUDED.platform, 
                tech_stack = EXCLUDED.tech_stack,
                updated_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('questerix-admin', 'sql', 35, 1)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('questerix-admin', 'typescript', 18153, 116)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('questerix-student', 'dart', 18284, 77)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('questerix-landing (DISABLED - NEVER DEPLOY)', 'typescript', 3345, 21)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('questerix-backend', 'sql', 5855, 64)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('questerix-backend', 'typescript', 748, 6)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('project-oracle', 'powershell', 92, 1)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('project-oracle', 'typescript', 659, 9)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('questerix-domain', 'dart', 1648, 21)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();
COMMIT;
