#!/bin/bash
# Invokes the Fusion Tables API with given URI and extra curl options.

[[ -n "$1" ]] || (echo "Usage ftupload.sh tableId"; exit -1)

# Obtain a fresh OAuth access token, if necessary
source credentials.sh
source common.sh
ensure_fresh_access_token

# Invoke Fusion Tables upload API via curl. Option, -s for less output, but -S
# to print output on failure. Option --data-binary for post preserving newlines
# with @- for content in message body read from standard input.  Authorization
# header per OAuth 2. Content type header, since the content is CSV in the
# message body. Finally the upload URL with table ID from command line.
curl -s -S --data-binary @- -H "Authorization: Bearer $access_token" \
  -H "Content-Type: application/octet-stream" \
  "https://www.googleapis.com/upload/fusiontables/v1/tables/$1/import"
