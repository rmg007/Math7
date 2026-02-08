# 🔐 Test Accounts Reference

**Purpose:** Standard test credentials for browser automation and manual testing.  
**Location:** This file should stay in `.agent/` and NOT be committed to public repos.

---

## ⚠️ Security Notice

This file contains test credentials. Ensure:
1. Real production passwords are NEVER stored here
2. This file is in `.gitignore` (add if missing)
3. Use these ONLY in development environments

---

## 🔑 Test Accounts

**Note:** For all accounts below, the password is identical to the email address.

### Super Admin
| Field | Value |
|-------|-------|
| **Email** | `mhalim80@hotmail.com` |
| **Password** | `mhalim80@hotmail.com` |
| **Name** | Ryan Gonzalez |
| **Role** | `super_admin` |
| **User ID** | `30610d88-44ce-4b16-8971-9490eb76cdb5` |
| **Permissions** | Full system access, manage all apps, users, curriculum |

---

### Admin
| Field | Value |
|-------|-------|
| **Email** | `testadmin@example.com` |
| **Password** | `testadmin@example.com` |
| **Name** | Test Admin |
| **Role** | `admin` |
| **User ID** | `aa50402a-0934-4616-a1b7-81d3d1b431d9` |
| **Permissions** | Manage curriculum, publish content, view analytics |

---

### Admin One
| Field | Value |
|-------|-------|
| **Email** | `admin1@example.com` |
| **Password** | `admin1@example.com` |
| **Name** | Admin One |
| **Role** | `admin` |
| **User ID** | `2ad17108-d1d2-4b66-ac4d-3a81682b36ae` |
| **Permissions** | Manage curriculum, publish content, view analytics |

---

### Admin Two
| Field | Value |
|-------|-------|
| **Email** | `admin2@example.com` |
| **Password** | `admin2@example.com` |
| **Name** | Admin Two |
| **Role** | `admin` |
| **User ID** | `d0645d96-ebfc-42af-9491-5c00f33dfd39` |
| **Permissions** | Manage curriculum, publish content, view analytics |

---

### Admin Three
| Field | Value |
|-------|-------|
| **Email** | `admin3@example.com` |
| **Password** | `admin3@example.com` |
| **Name** | Admin Three |
| **Role** | `admin` |
| **User ID** | `daffb975-d557-4cc5-a585-7e9b2e1b113c` |
| **Permissions** | Manage curriculum, publish content, view analytics |

---

### Mentor (Created via Browser)
| Field | Value |
|-------|-------|
| **Email** | `testmentor@example.com` |
| **Password** | `testmentor@example.com` |
| **Name** | Test Mentor |
| **Role** | `mentor` |
| **User ID** | *(Dynamic)* |
| **Permissions** | Create groups, manage students, assign work |

---

### Student Test Accounts

#### Alice (Student 1)
| Field | Value |
|-------|-------|
| **Email** | `alice@example.com` |
| **Password** | `alice@example.com` |
| **Name** | Alice Roberts |
| **Role** | `student` |
| **User ID** | `11111111-1111-4111-8111-111111111111` |

#### Bob (Student 2)
| Field | Value |
|-------|-------|
| **Email** | `bob@example.com` |
| **Password** | `bob@example.com` |
| **Name** | Bob Chen |
| **Role** | `student` |
| **User ID** | `22222222-2222-4222-8222-222222222222` |

#### Charlie (Student 3)
| Field | Value |
|-------|-------|
| **Email** | `charlie@example.com` |
| **Password** | `charlie@example.com` |
| **Name** | Charlie Davis |
| **Role** | `student` |
| **User ID** | `33333333-3333-4333-8333-333333333333` |

#### Diana (Student 4)
| Field | Value |
|-------|-------|
| **Email** | `diana@example.com` |
| **Password** | `diana@example.com` |
| **Name** | Diana Martinez |
| **Role** | `student` |
| **User ID** | `44444444-4444-4444-8444-444444444444` |

---

## 🧪 Testing Scenarios

### Admin Panel Testing
Use these combinations:

| Scenario | Account | Expected Access |
|----------|---------|-----------------|
| Full system admin | Super Admin | All features, all apps, user management |
| Content admin | Admin | Curriculum management, publish, analytics |
| Teacher/Parent view | Mentor | Groups, assignments, student progress |

### Student App Testing
Use student accounts for:
- Session creation and progress tracking
- Group joining via codes
- Attempt submission and syncing

---

## 🚦 Dynamic Verification Strategy (Feb 2026)

**Critical Update:** For automated scripts and regression testing, do **NOT** rely on the static accounts above, as their passwords may be reset or rate-limited.

**Standards:**
1. **Dynamic Creation:** Scripts must create fresh users with timestamps (e.g., `user_verif_{timestamp}@example.com`).
2. **Signup**: Use `supabase.auth.signUp()` in the script logic.
3. **Role Injection**: If an Admin/Mentor role is required, scripts must use a `service_role` client (or `execute_sql` tool) to update `app_metadata` immediately after signup.
4. **Cleanup**: Scripts should ideally clean up users, or use a consistent prefix (`verif_`) to allow bulk purging via SQL later.

Example Pattern:
```javascript
const email = `alice_v_${Date.now()}@example.com`;
const { data, error } = await supabase.auth.signUp({ email, password: email });
if (error) throw error;
```

---

## 📝 How to Update Passwords

If you need to reset a password, you can do it in Supabase Dashboard:
1. Go to [Supabase Auth > Users](https://supabase.com/dashboard/project/qvslbiceoonrgjxzkotb/auth/users)
2. Find the user
3. Click the three dots menu → "Reset Password"
4. Or use SQL: `SELECT auth.set_user_password('user-id', 'new-password')`

---

*Last Updated: 2026-02-03 (Added Dynamic Verification Strategy)*
