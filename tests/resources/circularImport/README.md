# Issue #915: Circular Import Test Resources

Test fixtures for circular dependency scenarios that previously caused stack overflow during type inference and import resolution.

## Test Resources

| File | Role | Description |
|------|------|-------------|
| **ExtendA.ts** | Cycle participant | `class ExtendA extends ExtendB` |
| **ExtendB.ts** | Cycle participant | `class ExtendB extends ExtendA` |
| **LazyA.ts** | Re-export cycle | `export { Sym } from './LazyB'` |
| **LazyB.ts** | Re-export cycle | `export { Sym } from './LazyA'` |
| **LazyConsumer.ts** | Consumer | `import { Sym } from './LazyA'` |
| **VisitedA.ts** | Local + export * | `export const X = 1`; `export * from './VisitedB'` |
| **VisitedB.ts** | Re-export | `export { X } from './VisitedA'` |
| **VisitedConsumer.ts** | Consumer | `import { X } from './VisitedA'` |

## Scenarios

### Scenario 1: Circular Class Inheritance (ExtendA ↔ ExtendB)

- **Trigger**: `buildSceneFromFiles` → `updateOrAddDefaultConstructors` → `buildDefaultConstructor`
- **Fix**: `visited: Set<ArkClass>` in `recursivelyCheckAndBuildSuperConstructor`

### Scenario 2: Circular Re-export (LazyA ↔ LazyB)

- **Trigger**: `getLazyExportInfo()` → `findExportInfo` → `findArkExport` (re-export chain)
- **Fix**: Pass `visited` through `findArkExport`; return `undefined` when target file is in `visited`

### Scenario 3: Export * + Re-export (VisitedA ↔ VisitedB)

- **Trigger**: `export *` expansion overwrites local export with re-export
- **Fix**: Do not overwrite local export when adding from `export *`; prefer existing local definition

## Expected Behavior

All scenarios must complete without `RangeError: Maximum call stack size exceeded`. Scenario 3 must resolve `X` from VisitedA's local definition (`export const X = 1`), not from the re-export cycle.
