import os
import sys
import secrets
from supabase import create_client, Client
from dotenv import load_dotenv

# Load available env files in order of precedence
def load_environment():
    for f in ['.env.local', '.env', '.secrets']:
        if os.path.exists(f"../../{f}"):
            load_dotenv(f"../../{f}")
    if os.path.exists("../../supabase/.env"):
        load_dotenv("../../supabase/.env")

def provision_test_user():
    print("[1/3] Initializing Admin Client...")
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.", file=sys.stderr)
        sys.exit(1)
        
    supabase: Client = create_client(url, key)
    
    email = os.getenv("PROD_BOT_EMAIL")
    
    # 1. Provision Account securely
    print(f"[2/3] Provisioning Test Account: {email}")
    password = os.getenv("PROD_BOT_PASSWORD")
    
    if not email or not password:
        print("ERROR: PROD_BOT_EMAIL and PROD_BOT_PASSWORD must be set in the environment.", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Check if user exists by listing all users (only possible via admin API)
        # However, supabase python client admin.list_users() is paginated.
        # Alternatively, try admin.invite_user or just try creating and catch errors.
        try:
            user = supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": { "test_account": True }
            })
            user_id = user.user.id
            print(f"Created new test user with ID: {user_id}")
            
            # Save the secure password if it was randomly generated so CI can pick it up
            if not os.getenv("PROD_BOT_PASSWORD"):
                print(f"--> PROD_BOT_PASSWORD={password}")
                # Append to a local file for the E2E suite to use
                with open("test-credentials.env", "w") as f:
                    f.write(f"PROD_BOT_EMAIL={email}\nPROD_BOT_PASSWORD={password}\n")
                
        except Exception as e:
            if "already exists" in str(e).lower() or "users_email_key" in str(e):
                print(f"User {email} already exists. Proceeding to update flags.")
                # We need to find the ID to update the profile
                users = supabase.auth.admin.list_users()
                # Finding by email from list
                existing = next((u for u in users if u.email == email), None)
                if not existing:
                    print("Could not retrieve user ID after creation failure. Ensure Admin rights.", file=sys.stderr)
                    sys.exit(1)
                    
                user_id = existing.id
                # Reset password to ensure we have access if provided
                supabase.auth.admin.update_user_by_id(user_id, {"password": password})
                print("Updated password to match PROD_BOT_PASSWORD.")
            else:
                raise e

        # 2. Flag in profiles to bypass analytics
        print("[3/3] Setting analytics bypass flags in profiles...")
        # Assume the profile exists since trigger creates it, if not it will fail
        res = supabase.table("profiles").update({"is_test_account": True, "role": "student"}).eq("id", user_id).execute()
        if not res.data:
            # Maybe trigger hasn't fired yet? 
            print("Warning: Profile update returned empty array. Ensure the profile trigger created a profile for this user.")
        else:
            print("Successfully flagged test account in profiles table.")
            
        print("Provisioning complete!")
        
    except Exception as e:
        print(f"Failed to provision test user: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    load_environment()
    provision_test_user()
