#!/bin/bash

# URL to be pinged
URL="https://plugin-localhost.intuitcdn.net:34212/config.json"

# Ping the URL and capture the HTTP status code
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)

# Check if the HTTP status code is 200 (OK)
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo -e "\nLocal plugin not running on port 34212. Run 'yarn serve' command in a separate terminal tab\n"
    exit 1
fi
