#!/bin/bash
# Ensures that the file crdentials.sh is populated with client ID and secret,
# API key, access and refresh tokens, and the expiration period.

case $(uname) in
  (Darwin|Linux|CYGWIN*) ;;
  (*) echo "This code lab requires one of Darwin, Linux, or Cygwin"; exit;;
esac

which curl > /dev/null || \
  (echo "Please install curl. This code lab requires it"; exit)

source common.sh
source credentials.sh
chmod 600 credentials.sh

until [[ -n "$CLIENT_ID" && -n "$CLIENT_SECRET" && -n "$API_KEY" ]]; do
  cat <<EOF
Please populate the credentials.sh file based on values from the Google
API console as described in README.html. The initial file will look something
like:

CLIENT_ID=148678966448.apps.googleusercontent.com
CLIENT_SECRET=YvV6DmasdfghPDaNkOvdcKUa
API_KEY=AIzaSasdfghjklvIbuyLXr1PT0cPXJavh9CLQxVg
EOF
  read -p "Hit enter to browse to Google API console"
  browse https://code.google.com/apis/console

  read -p "Hit enter to continue after credentials.sh is properly populated"
  source credentials.sh
done

function oauth_get_initial_tokens() {
  oauth -d grant_type=authorization_code -d code="$1" -d redirect_uri=$redirect_uri
}

until grep -q access_token credentials.sh; do
    cat <<EOF
The file credentials.sh should now contain API_KEY, CLIENT_ID, and
CLIENT_SECRET for some API project. Next we add OAUTH tokens specific to this
"installed application".
EOF
    read -p "Hit enter to request an OAUTH code and enter it at the next prompt"

    scope="https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffusiontables"
    scope+="+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffusiontables.readonly"
    url="https://accounts.google.com/o/oauth2/auth"
    url+="?scope=$scope&redirect_uri=$redirect_uri&response_type=code&client_id=$CLIENT_ID"
    browse "$url" > /dev/null
    read -p "Enter code> " code

    oauth_get_initial_tokens $code | oauth_reply_to_bash | egrep '_' >> credentials.sh
    save_expires_at

done

cat <<EOF
Congratulations. Your file credentials.sh contains a value for access_token.
EOF
