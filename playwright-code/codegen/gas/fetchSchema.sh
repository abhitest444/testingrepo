#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fetch the schema and write it to a file in the same directory as the script
rover graph fetch QBO-Payroll@prod > "$SCRIPT_DIR/schema.graphql"
