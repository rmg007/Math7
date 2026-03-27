#!/usr/bin/env python3
"""
Apply Supabase Migrations using Direct Database Connection

This script applies all migration files to your Supabase PostgreSQL database.

USAGE:
    python3 scripts/apply-migrations.py <DATABASE_URL>

EXAMPLE:
    python3 scripts/apply-migrations.py "postgresql://postgres:[PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"

Get your database URL from:
    https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/settings/database
    Look for "Connection string" under "Connection pooling"
"""

import sys
import os
import glob
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed")
    print("Install it with: pip install psycopg2-binary")
    sys.exit(1)

def apply_migrations(database_url):
    """Apply all migrations to the database"""
    
    # Connect to database
    print("🔗 Connecting to database...")
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = False
        cursor = conn.cursor()
        print("✓ Connected successfully\n")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    
    # Create schema_migrations table if it doesn't exist
    print("📋 Setting up migration tracking...")
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64)
            )
        """)
        conn.commit()
        print("✓ Migration tracking table ready\n")
    except Exception as e:
        print(f"❌ Failed to create migration tracking table: {e}")
        conn.rollback()
        sys.exit(1)
    
    # Get migration files
    migrations_dir = Path(__file__).parent.parent / 'supabase' / 'migrations'
    migration_files = sorted(glob.glob(str(migrations_dir / '*.sql')))
    
    print(f"📁 Found {len(migration_files)} migration files\n")
    
    # Get already applied migrations
    try:
        cursor.execute("SELECT filename FROM schema_migrations ORDER BY filename")
        applied_migrations = {row[0] for row in cursor.fetchall()}
        print(f"📊 {len(applied_migrations)} migrations already applied\n")
    except Exception as e:
        print(f"⚠️ Could not fetch applied migrations: {e}")
        applied_migrations = set()
    
    # Apply each migration
    applied_count = 0
    for migration_file in migration_files:
        filename = os.path.basename(migration_file)
        
        # Skip if already applied
        if filename in applied_migrations:
            print(f"  ⏭️  Skipping: {filename} (already applied)")
            continue
        
        print(f"  🔄 Applying: {filename}...")
        
        try:
            with open(migration_file, 'r') as f:
                sql_content = f.read()
            
            cursor.execute(sql_content)
            
            # Record the migration
            import hashlib
            checksum = hashlib.sha256(sql_content.encode()).hexdigest()
            cursor.execute(
                "INSERT INTO schema_migrations (filename, checksum) VALUES (%s, %s)",
                (filename, checksum)
            )
            
            conn.commit()
            print("    ✓ Success")
            applied_count += 1
        except Exception as e:
            print(f"    ❌ Failed: {e}")
            conn.rollback()
            print("\n⚠️  Migration failed. Rolling back...")
            sys.exit(1)
    
    # Apply seed data
    seed_file = Path(__file__).parent.parent / 'supabase' / 'seed.sql'
    if seed_file.exists():
        print("\n🌱 Applying seed data...")
        try:
            with open(seed_file, 'r') as f:
                sql_content = f.read()
            
            cursor.execute(sql_content)
            conn.commit()
            print("  ✓ Seed data applied")
        except Exception as e:
            print(f"  ❌ Seed data failed: {e}")
            conn.rollback()
    
    cursor.close()
    conn.close()
    
    if applied_count > 0:
        print(f"\n✅ Applied {applied_count} new migrations successfully!")
    else:
        print("\n✅ All migrations are already up to date!")
    print("\nNext steps:")
    print("  1. Verify tables exist")
    print("  2. Run Phase 1 validation: ./scripts/validate-phase-1.sh")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    database_url = sys.argv[1]
    apply_migrations(database_url)
