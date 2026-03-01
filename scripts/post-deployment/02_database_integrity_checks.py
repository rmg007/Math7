import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

def load_environment():
    for f in ['.env.local', '.env', '.secrets']:
        if os.path.exists(f"../../{f}"):
            load_dotenv(f"../../{f}")
    if os.path.exists("../../supabase/.env"):
        load_dotenv("../../supabase/.env")

class IntegrityError(Exception):
    pass

def _run_assertion(conn, query, error_msg, threshold=0):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query)
        res = cur.fetchone()
        count = res['count'] if res else 0
        if count > threshold:
            raise IntegrityError(f"{error_msg} (Found {count} cases)")

def verify_integrity():
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print("ERROR: SUPABASE_DB_URL must be set in the environment payload. (Session DB URL ideally).", file=sys.stderr)
        sys.exit(1)
        
    print("[1/3] Connecting to Supabase pooler...")
    try:
        conn = psycopg2.connect(db_url)
    except psycopg2.OperationalError as e:
        print(f"Failed to connect: {e}", file=sys.stderr)
        sys.exit(1)
        
    print("[2/3] Running Database Integrity Spot-Checks...")
    try:
        # Check 1: Orphaned Auth Users without Public Profiles
        print("  -> Asserting no users missing profiles...")
        _run_assertion(
            conn,
            "SELECT count(*) FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL;",
            "Integrity failure: auth.users exist without matching public.profiles"
        )
        
        # Check 2: Skill Progress invariants
        print("  -> Asserting skill progress totals are non-negative...")
        _run_assertion(
            conn,
            "SELECT count(*) FROM public.skill_progress WHERE total_points < 0 OR total_attempts < 0 OR correct_attempts < 0;",
            "Integrity failure: skill_progress contains negative points/attempts"
        )
        
        # Check 3: Attempts constraints
        print("  -> Asserting attempts points are non-negative...")
        _run_assertion(
            conn,
            "SELECT count(*) FROM public.attempts WHERE points_earned < 0;",
            "Integrity failure: attempts contains negative points_earned"
        )
        
        # Check 4: Test Account flag exists in schema
        # If this fails, the migration wasn't applied
        cur = conn.cursor()
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_test_account';")
        if not cur.fetchone():
            raise IntegrityError("Missing 'is_test_account' column in 'profiles'. Has the migration been applied?")
            
        print("[3/3] Integrity checks passed cleanly! DB Logic is intact.")

    except IntegrityError as e:
        print(f"FAILED: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    load_environment()
    verify_integrity()
