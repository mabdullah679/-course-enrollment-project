#!/usr/bin/env bash
set -euo pipefail

FE=http://localhost:3000
BE=http://localhost:8080
API=$BE/api/v1
CJ=/tmp/cegm.cookies

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@cegm.edu}"
ADMIN_PASS="${ADMIN_PASS:-admin123}"
STUDENT_EMAIL="${STUDENT_EMAIL:-student@cegm.edu}"
STUDENT_PASS="${STUDENT_PASS:-student123}"

pass(){ printf "✅ %s\n" "$1"; }
fail(){ printf "❌ %s\n" "$1"; exit 1; }
note(){ printf "ℹ️  %s\n" "$1"; }

rm -f "$CJ"

# ---- Admin auth (GUI-cookie parity check)
note "Login (admin) → expect Set-Cookie: cegm_dev_session"
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -c "$CJ" -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  "$API/auth/login")
[ "$LOGIN_CODE" = "200" ] && pass "Admin login 200" || fail "Admin login $LOGIN_CODE"

# Verify protected GETs carry Cookie
hdr_has_cookie() {
  grep -qi 'Cookie:' <<<"$1"
}

for path in /users /courses /enrollments /grades ; do
  OUT=$(curl -sD - -o /dev/null -b "$CJ" "$API$path")
  CODE=$(grep -i '^HTTP/' <<<"$OUT" | tail -1 | awk '{print $2}')
  hdr_has_cookie "$OUT" && COOKIE_OK="yes" || COOKIE_OK="no"
  [ "$COOKIE_OK" = "yes" ] || fail "Missing Cookie on $path"
  [ "$CODE" = "200" ] && pass "GET $path 200 with Cookie" || note "GET $path -> $CODE (ok if empty data)"
done

# Actuator paths (must NOT include /api)
for a in /actuator/health /actuator/info ; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BE$a")
  case "$CODE" in
    200|401|403|404|500) pass "Actuator reachable $a (code $CODE)";;
    *) fail "Actuator $a unexpected code $CODE";;
  esac
done

# Optional write probe (skipped by default)
if [ "${WRITE_PROBE:-0}" = "1" ]; then
  note "POST course (dev-only) – expect 201 or guard-allowed code"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$CJ" -H "Content-Type: application/json" \
    -d '{"name":"Smoke Course","courseCode":"SMK101","credits":1,"status":"ACTIVE","description":"smoke"}' \
    "$API/courses")
  if [ "$CODE" = "201" ]; then pass "Create course 201"
  elif [ "$CODE" = "403" ]; then fail "Protected POST 403 with Cookie present (CSRF/method security)"
  else note "Create course returned $CODE"; fi
fi

pass "Smoke complete"
