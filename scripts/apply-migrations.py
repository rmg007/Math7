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
    
    # Get migration files
    migrations_dir = Path(__file__).parent.parent / 'supabase' / 'migrations'
    migration_files = sorted(glob.glob(str(migrations_dir / '*.sql')))
    
    print(f"📁 Found {len(migration_files)} migration files\n")
    
    # Apply each migration
    for migration_file in migration_files:
        filename = os.path.basename(migration_file)
        print(f"  Applying: {filename}...")
        
        try:
            with open(migration_file, 'r') as f:
                sql_content = f.read()
            
            cursor.execute(sql_content)
            conn.commit()
            print("    ✓ Success")
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
    
    print("\n✅ All migrations applied successfully!")
    print("\nNext steps:")
    print("  1. Verify tables exist")
    print("  2. Run Phase 1 validation: ./scripts/validate-phase-1.sh")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    database_url = sys.argv[1]
    apply_migrations(database_url)
