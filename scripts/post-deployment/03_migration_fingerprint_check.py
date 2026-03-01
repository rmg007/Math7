import os
import sys
import glob
import psycopg2
from dotenv import load_dotenv

def load_environment():
    for f in ['.env.local', '.env', '.secrets']:
        if os.path.exists(f"../../{f}"):
            load_dotenv(f"../../{f}")
    if os.path.exists("../../supabase/.env"):
        load_dotenv("../../supabase/.env")

def get_latest_local_migration():
    migrations_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'supabase', 'migrations')
    files = glob.glob(os.path.join(migrations_dir, '*.sql'))
    if not files:
        return None
        
    versions = []
    for f in files:
        basename = os.path.basename(f)
        # Assuming format like "20260301000000_add_is_test_account.sql"
        parts = basename.split('_')
        if parts:
            versions.append(parts[0])
            
    if not versions:
        return None
        
    return sorted(versions)[-1]

def verify_migration_fingerprint():
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print("ERROR: SUPABASE_DB_URL must be set in the environment.", file=sys.stderr)
        sys.exit(1)
        
    latest_local = get_latest_local_migration()
    if not latest_local:
        print("ERROR: No local migrations found in supabase/migrations/", file=sys.stderr)
        sys.exit(1)
        
    print(f"[1/3] Latest local migration version is: {latest_local}")
    print("[2/3] Connecting to Supabase pooler...")
    try:
        conn = psycopg2.connect(db_url)
    except psycopg2.OperationalError as e:
        print(f"Failed to connect: {e}", file=sys.stderr)
        sys.exit(1)
        
    try:
        cur = conn.cursor()
        print("[3/3] Checking supabase_migrations.schema_migrations...")
        # Get the latest applied version
        cur.execute("SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 1;")
        res = cur.fetchone()
        
        if not res:
            print("ERROR: No migrations found in the database. Are you sure this is the right environment?", file=sys.stderr)
            sys.exit(1)
            
        latest_db = res[0]
        print(f"  -> Latest DB migration version is: {latest_db}")
        
        if latest_db != latest_local:
            print(f"FAILED: Migration mismatch! Local={latest_local}, DB={latest_db}")
            print("Alert: Code merge happened without the required schema changes being applied.", file=sys.stderr)
            sys.exit(1)
            
        print("SUCCESS! Database migration fingerprint perfectly matches local code.")

    except Exception as e:
        print(f"FAILED: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    load_environment()
    verify_migration_fingerprint()
