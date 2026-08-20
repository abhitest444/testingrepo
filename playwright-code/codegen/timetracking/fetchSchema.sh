#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fetch the schema and write it to a file in the same directory as the script
# rover graph introspect https://localhost:8443/graphql --insecure-accept-invalid-certs > "$SCRIPT_DIR/schema.graphql"
rover subgraph fetch OneIntuit-GQL-Orchestrator@prd --name qbtime > "$SCRIPT_DIR/schema.graphql"
