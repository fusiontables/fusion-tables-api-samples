#!/bin/bash
# Invokes the Fusion Tables API with given URI and extra curl options.

uri=${1:-tables}
shift
source credentials.sh
source common.sh
ensure_fresh_access_token
curl -s -S $* -H "Authorization: Bearer $access_token" \
  -H "Content-Type: application/json" \
  "https://www.googleapis.com/fusiontables/v1/$uri"
