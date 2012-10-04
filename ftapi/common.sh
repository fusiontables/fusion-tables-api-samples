# File for definitions that are used in multiple scripts. It is included in
# other scripts using the "source" directive, rather than executed.

# Remove tmp files on exit
trap "rm -f *.tmp" EXIT

# Redirect URI for "installed application"
redirect_uri=urn:ietf:wg:oauth:2.0:oob
declare expires_at

# Opens the given URL in a browser
function browse() {
  case $(uname) in
    (Darwin) open $* ;;
    (Linux) gnome-open $* ;;
    (CYGWIN*) cygstart $* ;;
    (*) firefox $* ;;
  esac
}

# Pipe element that converts JSON objects to assignments of variables for each
# JSON field. Example.
#   echo '{"foo" : "bar"}' | oauth_reply_to_bash
# results in
#   foo="bar"
function oauth_reply_to_bash() {
  tr '{},' \\n | sed -e 's/" : /=/' -e 's/^ *"//'
}

# POSTs to Google accounts OAuth service to request token for a given
# credential. Examples:
#   oauth -d grant_type=authorization_code -d code=4/87987 -d redirect_uri=$redirect_uri
#   oauth -d refresh_token=1/76abcf -d grant_type=refresh_token
function oauth() {
  curl -s -S $* -d client_id=$CLIENT_ID -d client_secret=$CLIENT_SECRET \
    https://accounts.google.com/o/oauth2/token
}

function oauth_get_refresh_token() {
  oauth -d refresh_token="$refresh_token" -d grant_type=refresh_token
}

# Adds $expires_in to current time and writes it out as expires_at.
function save_expires_at() {
  source credentials.sh
  expires_at=$(( $(date +%s) + $expires_in ))
  echo "expires_at=$expires_at" >> credentials.sh
}

# Updates credentials.sh with new access_token using the refresh_token.
function refresh_oauth_access_token() {
  sed -i -e "/^access/d" credentials.sh
  sed -i -e '/^expires/d' credentials.sh
  oauth_get_refresh_token | oauth_reply_to_bash | egrep '^(access_token|expires)' >> credentials.sh
  save_expires_at
}

# Updates credentials.sh if it is older than expires_in value.
function ensure_fresh_access_token() {
  [[ $expires_at > $(date +%s) ]] || refresh_oauth_access_token
}
