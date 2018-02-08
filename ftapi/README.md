# Using Fusion Tables from bash

## Introduction

This code lab shows how to access [Google Fusion
Tables](https://www.google.com/fusiontables) from a bash<sup>[1](#fn.1)</sup>
command line. Google provides Fusion Tables to let you visualize and share table
data. To keep private data secure, a certain amount of setup is required to
access Fusion Tables from your computer's command line. This code lab walks you
through that setup and demonstrates success with some extensible examples. The
[developer website](https://developers.google.com/fusiontables) has more
details, [sample
code](https://developers.google.com/fusiontables/docs/sample_code), and [client
libraries](https://developers.google.com/fusiontables/docs/v2/libraries) for
specific programming languages. The [APIs
Explorer](https://developers.google.com/apis-explorer/#p/fusiontables/v2/) site
also provides an interactive web interface to test out calls to the API.

### Installation

We will configure bash scripts in this directory to act as an ["installed
application"](https://developers.google.com/accounts/docs/OAuth2InstalledApp)
for a specific "Google developer project". The installed application manages
OAuth credentials so that it can access Fusion Table data on your behalf.

1.  Select or create a project from the [cloud
    console](https://cloud.google.com/console/start/api?id=fusiontables).
    Register a new Native application.
2.  Edit the file `credentials.sh` to supply the values for CLIENT_ID and
    CLIENT_SECRET. One way to accomplish that is to click "Download JSON" and
    process it like so:

    <pre>cat $(ls -t ~/Downloads/client_secret*.json | head -1) \
      | sed -e 's/[{},]/\n/g' -e 's/":"/=/g' -e 's/"//g' \
      | sed -e 's/client_id/CLIENT_ID/' -e 's/client_secret/CLIENT_SECRET/' \
      | grep CLIENT_ > credentials.sh
    </pre>

3.  Execute `RUN_ME_FIRST.sh`, which opens a browser where you grant the
    "installed application" access to your tables. Copy the resulting "code" and
    paste it into the running script's prompt. The script exchanges the code for
    OAuth credentials and updates `credentials.sh` with them.

## Example use

Now you are ready to use the other scripts. For example

<pre> ./ftsql.sh show tables
</pre>

lists your tables. Taking one of those IDs you can issue a query like

<pre> TABLE_ID=15lS4CdWZdi7inPHrCwPNjRjFLywYdskHZE8L
 ./ftsql.sh "select * from $TABLE_ID limit 10"
</pre>

The output consists of comma separated values from a table with country names
and image URLs to flags.

<pre> Afghanistan,http://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Afghanistan.svg/22px-Flag_of_Afghanistan.svg.png
 Albania,http://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Flag_of_Albania.svg/22px-Flag_of_Albania.svg.png
 Algeria,http://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Algeria.svg/22px-Flag_of_Algeria.svg.png
</pre>

The script `ftapi.sh` lets you access Fusion Tables features beyond SQL. For
example

<pre> function get_table_id() {
  grep tableId | cut -d\" -f4
 }
 TABLE_COPY=$(./ftapi.sh tables/$TABLE_ID | ./ftapi.sh tables -d @- | get_table_id)
</pre>

creates a new table with the the schema of the flags table and assigns its ID to
`TABLE_COPY`. Here the first call to `ftapi.sh` retrieves the definition of one
table and the result is piped as a POST body to create a new table. The curl
parameter option `-d` indicates HTTP method POST and `@-` specifies the contents
of the standard input stream as the value of the POST body. The function
`get_table_id` extracts the quoted right hand side value from a line like

<pre> "tableId": "1-Zrlr9Kle9ljjMl2WjqHfytRKqbVlN_r00ELHig",
</pre>

See [this
mapping](https://developers.google.com/fusiontables/docs/v2/getting_started#background-operations)
of API operations to HTTP methods for more information.

Now look at the definition of the copied table.

<pre> ./ftapi.sh tables/$TABLE_COPY
</pre>

Except for the table's ID, the output should look like:

<pre> {
  "kind": "fusiontables#table",
  "tableId": "1-Zrlr9Kle9ljjMl2WjqHfytRKqbVlN_r00ELHig",
  "name": "Country Flags",
  "columns": [
   {
    "kind": "fusiontables#column",
    "columnId": 0,
    "name": "Country",
    "type": "LOCATION"
   },
   {
    "kind": "fusiontables#column",
    "columnId": 1,
    "name": "Flag",
    "type": "STRING"
   }
  ],
  "isExportable": true,
  "attribution": "Wikipedia"
 }
</pre>

It is a JSON representation of the copied table metadata.

Now let us copy some rows:

<pre> ./ftsql.sh "select * from $TABLE_ID" | sed -e '1 d' | ./ftupload.sh $TABLE_COPY
</pre>

Here we created a large payload of CSV content without the header row and
uploaded it to the freshly created table. Expect to see output like this:

<pre> {
  "kind": "fusiontables#import",
  "numRowsReceived": "204"
 }
</pre>

The script `ftupload.sh` is useful to add rows to an existing table. Duplicating
an existing table is specially supported in the API. This command line will
create another copy of the same table and assign its ID to `TABLE_COPY`.

<pre> TABLE_COPY=$(./ftapi.sh tables/$TABLE_ID/copy -d method=post | get_table_id)
</pre>

Verify that rows were copied with

<pre> ./ftsql.sh "select count() from $TABLE_COPY"
</pre>

You should see something like

<pre> count()
 204
</pre>

Now look at column 1

<pre> ./ftapi.sh tables/$TABLE_COPY/columns/1
</pre>

You should see something like

<pre> {
  "kind": "fusiontables#column",
  "columnId": 1,
  "name": "Country",
  "type": "LOCATION"
 }
</pre>

Finally, let us change the column's type from LOCATION to STRING.

<pre> ./ftapi.sh tables/$TABLE_COPY/columns/1 | \
   sed -e 's/LOCATION/STRING/' | \
   ./ftapi.sh tables/$TABLE_COPY/columns/1 -T -
</pre>

Here the curl option `-T` indicates HTTP method PUT, which is how you update
rather than insert or create with this API.

If you want to work more extensively with JSON in bash, check out
[TickTick](https://github.com/kristopolous/TickTick).

## Explanations

The script `RUN_ME_FIRST.sh` talks to
[https://accounts.google.com/o/oauth2/token](https://accounts.google.com/o/oauth2/token)
to set up an initial working file `credentials.sh`. Code in `common.sh` updates
this file to manage credentials for an "installed application" that can access
tables on your behalf. The script `ftsql.sh` is the simplest illustration of
using the possibly refreshed access token. It uses curl to send a POST request
to
[https://www.googleapis.com/fusiontables/v2/query?alt=csv](https://www.googleapis.com/fusiontables/v2/query?alt=csv).
Its invocation arguments become the value of the request parameter, `sql`. The
script `ftapi.sh` uses curl to send requests to a URI under
[https://www.googleapis.com/fusiontables/v2](https://www.googleapis.com/fusiontables/v2).
The first argument is the URI. Additional arguments are passed through to curl.
The examples above use only `-d` and `-T` on the command line. Internally, the
scripts also use `-H` to set the following two headers

<pre> -H "Content-Type: application/json"
 -H "Authorization: Bearer $access_token"
</pre>

### Managing credentials

The script `RUN_ME_FIRST.sh` obtains `refresh_token`, `access_token`, and
`expires_in` in exchange for the code pasted in Step 3 above. [This
documentation](https://developers.google.com/accounts/docs/OAuth2#installed)
includes a nice graphic to understand the flow. Function
`ensure_fresh_access_token` in `common.sh` obtains a new `access_token` after
the old one expires. A working `credentials.sh` file looks something like this:

<pre> CLIENT_ID=148678966448.apps.googleusercontent.com
 CLIENT_SECRET=YvV6DmasdfghPDaNkOvdcKUa
 refresh_token="1/FaOigPi4Gasdfghjkl5eSesDqw304EoI45YgaT65UFAM"
 access_token="ya29.AHES6Zasdfghjkl0KkTMM6ZtY-5_BcM74rwcSQrpp8NIEvNI"
 expires_in=3600
 expires_at=1348109704
</pre>

<sup>[1](#fnr.1)</sup>Tested with Ubuntu, Mac OS, and Cygwin

Author: Anno Langen
[<googletables-feedback@google.com>](mailto:googletables-feedback@google.com)

Date: 2012/10/02 12:35:44
