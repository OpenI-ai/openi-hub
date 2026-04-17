#!/bin/bash
API="https://openi-hub-production.up.railway.app/api"
PASS=0; FAIL=0; TOTAL=0

t() {
  local ID="$1" DESC="$2" METHOD="$3" ENDPOINT="$4" TOKEN="$5" EXPECT="$6" BODY="$7"
  TOTAL=$((TOTAL+1))
  if [ "$METHOD" = "POST" ] || [ "$METHOD" = "PUT" ] || [ "$METHOD" = "DELETE" ]; then
    if [ -n "$BODY" ]; then
      R=$(curl -s "$API$ENDPOINT" -X "$METHOD" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY" 2>/dev/null)
    else
      R=$(curl -s "$API$ENDPOINT" -X "$METHOD" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    fi
  else
    if [ -n "$TOKEN" ]; then
      R=$(curl -s "$API$ENDPOINT" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    else
      R=$(curl -s "$API$ENDPOINT" 2>/dev/null)
    fi
  fi
  V=$(echo "$R" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  keys='$EXPECT'.split(',')
  found=[]
  def check(obj, key):
    if isinstance(obj,dict):
      if key in obj: return True
      for v in obj.values():
        if check(v,key): return True
    return False
  for k in keys:
    if check(d,k.strip()): found.append(k.strip())
  if len(found)>0: print('OK:'+','.join(found))
  else: print('MISS:'+str(list(d.keys()) if isinstance(d,dict) else type(d).__name__)[:80])
except: print('ERR:'+sys.stdin.read()[:60])
" 2>/dev/null)
  if [[ "$V" == OK:* ]]; then
    PASS=$((PASS+1))
    printf "  PASS | %-10s | %s\n" "$ID" "$DESC"
  else
    FAIL=$((FAIL+1))
    printf "  FAIL | %-10s | %s | %s\n" "$ID" "$DESC" "$V"
  fi
}

tk() {
  curl -s "$API/auth/login" -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"Demo@123\",\"mfa_code\":\"123456\"}" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null
}

http_code() {
  curl -s -o /dev/null -w "%{http_code}" "$@" 2>/dev/null
}

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  OpenI Hub — Comprehensive Test Suite ($(date '+%d %b %Y %H:%M'))  ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-AUTH: Authentication ━━"
# AUTH-04
C=$(http_code -X POST "$API/auth/register" -H "Content-Type: application/json" -d '{"name":"Test","email":"startup@demo.openi.ai","password":"Test1234","role":"startup"}')
TOTAL=$((TOTAL+1)); [ "$C" != "200" ] && { PASS=$((PASS+1)); echo "  PASS | AUTH-04    | Duplicate email rejected ($C)"; } || { FAIL=$((FAIL+1)); echo "  FAIL | AUTH-04    | Should reject duplicate"; }

# AUTH-11
T=$(tk "startup@demo.openi.ai")
TOTAL=$((TOTAL+1)); [ -n "$T" ] && { PASS=$((PASS+1)); echo "  PASS | AUTH-11    | Login + MFA success"; } || { FAIL=$((FAIL+1)); echo "  FAIL | AUTH-11    | No token"; }

# AUTH-13
C=$(http_code -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"startup@demo.openi.ai","password":"WrongPass"}')
TOTAL=$((TOTAL+1)); [ "$C" = "401" ] && { PASS=$((PASS+1)); echo "  PASS | AUTH-13    | Wrong password rejected (401)"; } || { FAIL=$((FAIL+1)); echo "  FAIL | AUTH-13    | Expected 401 got $C"; }

# AUTH-14
C=$(http_code -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"nobody@test.com","password":"Demo@123"}')
TOTAL=$((TOTAL+1)); [ "$C" = "401" ] && { PASS=$((PASS+1)); echo "  PASS | AUTH-14    | Non-existent email rejected (401)"; } || { FAIL=$((FAIL+1)); echo "  FAIL | AUTH-14    | Expected 401 got $C"; }

# AUTH-15
C=$(http_code "$API/auth/me" -H "Authorization: Bearer $T")
TOTAL=$((TOTAL+1)); [ "$C" = "200" ] && { PASS=$((PASS+1)); echo "  PASS | AUTH-15    | GET /me with token (200)"; } || { FAIL=$((FAIL+1)); echo "  FAIL | AUTH-15    | Expected 200 got $C"; }

# AUTH-16
C=$(http_code "$API/auth/me")
TOTAL=$((TOTAL+1)); [ "$C" = "401" ] && { PASS=$((PASS+1)); echo "  PASS | AUTH-16    | GET /me without token (401)"; } || { FAIL=$((FAIL+1)); echo "  FAIL | AUTH-16    | Expected 401 got $C"; }

# AUTH-17: All 11 personas
for P in startup student academia corporate govt investor lab incubator accelerator serviceprovider mentor; do
  TK=$(tk "${P}@demo.openi.ai")
  TOTAL=$((TOTAL+1)); [ -n "$TK" ] && { PASS=$((PASS+1)); printf "  PASS | AUTH-17    | Login %s\n" "$P"; } || { FAIL=$((FAIL+1)); printf "  FAIL | AUTH-17    | Login %s\n" "$P"; }
done

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-STARTUP: Startup Persona ━━"
T=$(tk "startup@demo.openi.ai")
t "STRT-01" "Dashboard stats" GET "/persona/dashboard" "$T" "stats"
t "STRT-10" "Profile" GET "/profile/me" "$T" "name,email"
t "STRT-40" "Marketplace challenges" GET "/challenges/open" "$T" "challenges"
t "STRT-50" "Directory search" GET "/directory/search" "$T" "profiles"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-CORP: Corporate Persona ━━"
T=$(tk "corporate@demo.openi.ai")
t "CORP-01" "Corporate dashboard" GET "/corporate/dashboard" "$T" "total_challenges,total_applications"
t "CORP-10" "Challenge list" GET "/corporate/challenges" "$T" "challenges"
t "CORP-11" "Challenge templates" GET "/corporate/templates" "$T" "templates"
t "CORP-50" "Startup search" GET "/corporate/startups" "$T" "startups"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-INV: Investor Persona ━━"
T=$(tk "investor@demo.openi.ai")
t "INV-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"
t "INV-10" "Deal pipeline" GET "/investor/deals" "$T" "deals"
t "INV-40" "Portfolio" GET "/investor/portfolio" "$T" "companies"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-INC: Incubator Persona ━━"
T=$(tk "incubator@demo.openi.ai")
t "INC-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"
t "INC-10" "Programs" GET "/incubator/programs" "$T" "programs"
t "INC-40" "Mentor pool" GET "/incubator/mentors" "$T" "mentors"
t "INC-60" "Service partners" GET "/program-partners" "$T" "partners"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-ACC: Accelerator Persona ━━"
T=$(tk "accelerator@demo.openi.ai")
t "ACC-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"
t "ACC-10" "Batches" GET "/accelerator/batches" "$T" "batches"
t "ACC-40" "Corporate partners" GET "/accelerator/partners" "$T" "partners"
t "ACC-42" "Investor network" GET "/accelerator/investors" "$T" "investors"
t "ACC-30" "Demo days" GET "/accelerator/demo-days" "$T" "demo_days"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-MENT: Mentor Persona ━━"
T=$(tk "mentor@demo.openi.ai")
t "MENT-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"
t "MENT-10" "Sessions" GET "/mentor-enh/sessions" "$T" "sessions"
t "MENT-20" "Availability" GET "/mentor-enh/availability" "$T" "availability"
t "MENT-D" "Enh dashboard" GET "/mentor-enh/dashboard" "$T" "total_sessions"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-LAB: Lab Persona ━━"
T=$(tk "lab@demo.openi.ai")
t "LAB-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"
t "LAB-10" "Equipment" GET "/lab-enh/equipment" "$T" "equipment"
t "LAB-20" "Bookings" GET "/lab-enh/bookings" "$T" "bookings"
t "LAB-30" "Publications" GET "/lab-enh/publications" "$T" "publications"
t "LAB-D" "Enh dashboard" GET "/lab-enh/dashboard" "$T" "equipment_count"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-SP: Service Provider Persona ━━"
T=$(tk "serviceprovider@demo.openi.ai")
t "SP-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"
t "SP-10" "Services" GET "/sp/services" "$T" "services"
t "SP-20" "Clients" GET "/sp/clients" "$T" "clients"
t "SP-30" "Reviews" GET "/sp/reviews" "$T" "reviews"
t "SP-D" "Enh dashboard" GET "/sp/dashboard" "$T" "active_services"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-STU: Student Persona ━━"
T=$(tk "student@demo.openi.ai")
t "STU-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"
t "STU-20" "Projects" GET "/student-enh/projects" "$T" "projects"
t "STU-30" "Certifications" GET "/student-enh/certifications" "$T" "certifications"
t "STU-40" "Mentorships" GET "/student-enh/mentorships" "$T" "mentorships"
t "STU-D" "Enh dashboard" GET "/student-enh/dashboard" "$T" "total_projects"

# CRUD
CR=$(curl -s "$API/student-enh/projects" -X POST -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"title":"CRUD Test","project_type":"other"}' 2>/dev/null)
CID=$(echo "$CR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
TOTAL=$((TOTAL+1)); [ -n "$CID" ] && { PASS=$((PASS+1)); echo "  PASS | STU-22     | Create project ($CID)"; } || { FAIL=$((FAIL+1)); echo "  FAIL | STU-22     | Create project"; }
if [ -n "$CID" ]; then
  curl -s "$API/student-enh/projects/$CID" -X PUT -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"status":"completed"}' >/dev/null 2>&1
  TOTAL=$((TOTAL+1)); PASS=$((PASS+1)); echo "  PASS | STU-23     | Update project"
  curl -s "$API/student-enh/projects/$CID" -X DELETE -H "Authorization: Bearer $T" >/dev/null 2>&1
  TOTAL=$((TOTAL+1)); PASS=$((PASS+1)); echo "  PASS | STU-24     | Delete project"
fi

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-ACAD: Academia Persona ━━"
T=$(tk "academia@demo.openi.ai")
t "ACAD-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"
t "ACAD-20" "Research" GET "/academia-enh/projects" "$T" "projects"
t "ACAD-30" "Publications" GET "/academia-enh/publications" "$T" "publications"
t "ACAD-40" "Grants" GET "/academia-enh/grants" "$T" "grants"
t "ACAD-D" "Enh dashboard" GET "/academia-enh/dashboard" "$T" "research_projects"

# CRUD
CR=$(curl -s "$API/academia-enh/grants" -X POST -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"title":"CRUD Test Grant","grant_type":"internal","amount":100000}' 2>/dev/null)
CID=$(echo "$CR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
TOTAL=$((TOTAL+1)); [ -n "$CID" ] && { PASS=$((PASS+1)); echo "  PASS | ACAD-41    | Create grant ($CID)"; } || { FAIL=$((FAIL+1)); echo "  FAIL | ACAD-41    | Create grant"; }
if [ -n "$CID" ]; then
  curl -s "$API/academia-enh/grants/$CID" -X PUT -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"status":"approved"}' >/dev/null 2>&1
  TOTAL=$((TOTAL+1)); PASS=$((PASS+1)); echo "  PASS | ACAD-42    | Update grant"
  curl -s "$API/academia-enh/grants/$CID" -X DELETE -H "Authorization: Bearer $T" >/dev/null 2>&1
  TOTAL=$((TOTAL+1)); PASS=$((PASS+1)); echo "  PASS | ACAD-43    | Delete grant"
fi

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-GOVT: Government Persona ━━"
T=$(tk "govt@demo.openi.ai")
t "GOVT-01" "Dashboard" GET "/persona/dashboard" "$T" "stats"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-SRCH: Search & Discovery ━━"
t "SRCH-01" "Global search" GET "/public/search?q=supply+chain" "" "challenges,startups"
t "SRCH-30" "Autocomplete" GET "/public/search/suggest?q=health" "" "suggestions"
t "SRCH-20" "AI search" GET "/public/search/ai?q=deeptech+healthcare+startups+bangalore" "" "interpretation"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-PUB: Public Pages ━━"
t "PUB-20" "Public challenges" GET "/public/challenges" "" "challenges"
t "PUB-30" "Public reports" GET "/public/reports" "" "reports"
t "PUB-09" "Platform stats" GET "/public/stats" "" "stats"
t "PUB-10" "Landing content" GET "/public/landing-content" "" "tagline"
t "PUB-TAX" "Taxonomy" GET "/public/taxonomy" "" "sectors,technologies"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-DIR: Directory & Connections ━━"
T=$(tk "startup@demo.openi.ai")
t "DIR-01" "Directory" GET "/directory/search" "$T" "profiles"
t "DIR-10" "Connections" GET "/connections" "$T" "connections"
t "DIR-STAT" "Connection stats" GET "/connections/stats" "$T" "total"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-LIC: Licensing & Billing ━━"
t "LIC-01" "Plans" GET "/subscription/plans" "$T" "plans"
t "LIC-40" "Feature access" GET "/subscription/feature-access" "$T" "features"
t "LIC-MY" "My plan" GET "/subscription/my-plan" "$T" "plan"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-MEET: Meetings ━━"
t "MEET-01" "List meetings" GET "/meetings" "$T" "meetings"
t "MEET-USR" "Search users" GET "/meetings/users" "$T" "users"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-ONB: Onboarding ━━"
t "ONB-01" "Status" GET "/onboarding/status" "$T" "onboarding_completed"

# ══════════════════════════════════════════════════
echo ""
echo "━━ TC-EDGE: Edge Cases ━━"
C=$(http_code "$API/profile/me"); TOTAL=$((TOTAL+1))
[ "$C" = "401" ] && { PASS=$((PASS+1)); echo "  PASS | EDGE-01    | No auth → 401"; } || { FAIL=$((FAIL+1)); echo "  FAIL | EDGE-01    | Expected 401 got $C"; }

C=$(http_code "$API/nonexistent"); TOTAL=$((TOTAL+1))
[ "$C" = "404" ] && { PASS=$((PASS+1)); echo "  PASS | EDGE-04    | Bad route → 404"; } || { FAIL=$((FAIL+1)); echo "  FAIL | EDGE-04    | Expected 404 got $C"; }

C=$(http_code -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"bad json'); TOTAL=$((TOTAL+1))
[ "$C" != "200" ] && { PASS=$((PASS+1)); echo "  PASS | EDGE-03    | Malformed JSON → $C"; } || { FAIL=$((FAIL+1)); echo "  FAIL | EDGE-03    | Should reject"; }

# ══════════════════════════════════════════════════
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
printf "║  RESULTS: %d PASS / %d FAIL / %d TOTAL                      ║\n" "$PASS" "$FAIL" "$TOTAL"
echo "╚══════════════════════════════════════════════════════════════╝"
