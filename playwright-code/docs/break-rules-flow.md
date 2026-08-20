# Break Rules Create and Update Flow

```mermaid
flowchart TD
    A[User Opens Break Form] --> B{Is Create Mode?}
    
    %% Create Flow
    B -->|Yes| C[Fill Break Rule Details]
    C --> D[Select Team Members]
    D --> E[User Clicks Save]
    E --> F{All Team Members Selected?}
    F -->|Yes| G[Set isDefaultPolicy = true]
    F -->|No| H[Set isDefaultPolicy = false]
    G --> I[Call createBreaksPolicy]
    H --> I
    I --> J{isDefaultPolicy?}
    J -->|Yes| K[Skip Break Assignments]
    J -->|No| L[Create Break Assignments]
    K --> M[Close Form & Show Success]
    L --> M
    
    %% Update Flow
    B -->|No| N[Load Original Break Rule]
    N --> O[User Modifies Fields]
    O --> P[User Clicks Save]
    P --> Q[getModifiedBreakRuleFields]
    Q --> R{Any Break Rule Fields Modified?}
    
    R -->|Yes| S[Call updateBreaksPolicy with modified fields]
    S --> T[Handle Break Assignments if provided]
    T --> M
    
    R -->|No| U{Assignments Provided?}
    U -->|No| V[Close Form - No Changes]
    
    U -->|Yes| W{All Team Members Selected?}
    W -->|Yes| X[Call updateBreaksPolicy with isDefaultPolicy: true]
    W -->|No| Y[Call createBreakAssignments]
    X --> M
    Y --> M
    
    %% Field Dependencies (shown as subgraph)
    subgraph "Field Dependencies"
        Z1[breakDuration] --> Z2[durationUnit]
        Z3[shiftThresholdLimit] --> Z2
        Z3 --> Z4[specificTime]
        Z5[autoRule Changes] --> Z6[allowAuto]
        Z7[manualRule Changes] --> Z8[allowManual]
    end
    
    %% Utility Function Details
    subgraph "getModifiedBreakRuleFields Logic"
        AA[Compare Original vs Updated] --> BB{Basic Fields Changed?}
        BB -->|Yes| CC[Add to Modified Fields]
        BB -->|No| DD{autoRule Changed?}
        DD -->|Yes| EE[Compare autoRule Fields + allowAuto]
        DD -->|No| FF{manualRule Changed?}
        EE --> FF
        FF -->|Yes| GG[Compare manualRule Fields + allowManual]
        FF -->|No| HH[Return Modified Fields]
        GG --> HH
        CC --> HH
    end
    
    %% Styling
    classDef createFlow fill:#e1f5fe
    classDef updateFlow fill:#f3e5f5
    classDef dependencies fill:#fff3e0
    classDef utility fill:#e8f5e8
    
    class C,D,E,F,G,H,I,J,K,L createFlow
    class N,O,P,Q,R,S,T,U,V,W,X,Y updateFlow
    class Z1,Z2,Z3,Z4,Z5,Z6,Z7,Z8 dependencies
    class AA,BB,CC,DD,EE,FF,GG,HH utility
```

## Key Features

- **Sparse Updates**: Only sends modified fields to reduce payload size
- **Dependency Handling**: Ensures related fields are updated together
- **Smart Assignment Logic**: Handles default policies vs individual assignments
- **Performance Optimization**: Avoids unnecessary API calls when no changes detected
- **Null/Undefined Equality**: Treats null and undefined as equal for comparison 