#!/bin/bash
# Invokes the Fusion Tables API with given SQL

source credentials.sh
source common.sh
ensure_fresh_access_token
curl -d sql="$*" -H "Authorization: Bearer $access_token" "https://www.googleapis.com/fusiontables/v1/query?alt=csv"
