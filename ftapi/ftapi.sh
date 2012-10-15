#!/bin/bash
# Invokes the Fusion Tables API with given URI and extra curl options.

uri=${1:-tables}
shift

# Obtain a fresh OAuth access token, if necessary
source credentials.sh
source common.sh
ensure_fresh_access_token

# Invoke Fusion Tables API via curl. Option, -s for less output, but -S to
# print output on failure. Other arguments from the command line, for example
# -d ... or -T ... Authorization header per OAuth 2. Content type header, which
# is required when there is a message body (PUT and some POST), and harmless
# otherwise. Finally the URL with the suffix from the command line's first
# argument.
curl -s -S $* -H "Authorization: Bearer $access_token" \
  -H "Content-Type: application/json" \
  "https://www.googleapis.com/fusiontables/v1/$uri"
