#!/bin/bash
# Invokes the Fusion Tables API with given SQL

# Obtain a fresh OAuth access token, if necessary
source credentials.sh
source common.sh
ensure_fresh_access_token

# Invoke Fusion Tables query via curl. Option, -s for less output, but -S to
# print output on failure. Other arguments from the command are joined for the
# sql parameter. Authorization header per OAuth 2. Finally the URL of the query
# API with option alt=csv, because the default (JSON) is harder to read for
# humans.
curl -s -S -d sql="$*" -H "Authorization: Bearer $access_token" \
  "https://www.googleapis.com/fusiontables/v1/query?alt=csv"
