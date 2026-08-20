    #!/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fetch the schema and write it to a file in the same directory as the script
rover subgraph fetch OneIntuit-GQL-Orchestrator@prd --name data-aggregation-service > "$SCRIPT_DIR/schema.graphql"

# Fetch the schema for entitlement-grants and append it to the same file
rover subgraph fetch OneIntuit-GQL-Orchestrator@prd --name entitlement-grants >> "$SCRIPT_DIR/schema.graphql"

# Fetch the schema for payroll and append it to the same file
rover subgraph fetch OneIntuit-GQL-Orchestrator@prd --name payroll >> "$SCRIPT_DIR/schema.graphql"

rover subgraph fetch OneIntuit-GQL-Orchestrator@prd --name worker-management >> "$SCRIPT_DIR/schema.graphql"

rover subgraph fetch OneIntuit-GQL-Orchestrator@prd --name task-management-service >> "$SCRIPT_DIR/schema.graphql"


rover subgraph fetch OneIntuit-GQL-Orchestrator@prd --name accounts >> "$SCRIPT_DIR/schema.graphql"

rover subgraph fetch OneIntuit-GQL-Orchestrator@prd --name user-mgmt-orchestration >> "$SCRIPT_DIR/schema.graphql"