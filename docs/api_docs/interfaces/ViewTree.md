[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ViewTree

# Interface: ViewTree

Defined in: src/core/graph/ViewTree.ts:118

ArkUI Component Tree

## Example

```ts
// Component Class get ViewTree
let arkClas: ArkClass = ...;
let viewtree = arkClas.getViewTree();

// get viewtree root node
let root: ViewTreeNode = viewtree.getRoot();

// get viewtree stateValues Map
let stateValues: Map<ArkField, Set<ViewTreeNode>> = viewtree.getStateValues();

// walk all nodes
root.walk((node) => {
  // check node is builder
  if (node.isBuilder()) {
     xx
  }

  // check node is sub CustomComponent
  if (node.isCustomComponent()) {
     xx
  }

  if (xxx) {
     // Skip the remaining nodes and end the traversal
     return true;
  }

  return false;
})
```

## Methods

### ~~getClassFieldType()~~

> **getClassFieldType**(`name`): `undefined` \| [`Decorator`](../classes/Decorator.md) \| [`Type`](../classes/Type.md)

Defined in: src/core/graph/ViewTree.ts:127

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`Decorator`](../classes/Decorator.md) \| [`Type`](../classes/Type.md)

#### Deprecated

Use [getStateValues](#getstatevalues) instead.

***

### getRoot()

> **getRoot**(): `null` \| [`ViewTreeNode`](ViewTreeNode.md)

Defined in: src/core/graph/ViewTree.ts:139

ViewTree root node.

#### Returns

`null` \| [`ViewTreeNode`](ViewTreeNode.md)

root node

***

### getStateValues()

> **getStateValues**(): `Map`\<[`ArkField`](../classes/ArkField.md), `Set`\<[`ViewTreeNode`](ViewTreeNode.md)\>\>

Defined in: src/core/graph/ViewTree.ts:133

Map of the component controlled by the state variable

#### Returns

`Map`\<[`ArkField`](../classes/ArkField.md), `Set`\<[`ViewTreeNode`](ViewTreeNode.md)\>\>

***

### ~~isClassField()~~

> **isClassField**(`name`): `boolean`

Defined in: src/core/graph/ViewTree.ts:122

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Deprecated

Use [getStateValues](#getstatevalues) instead.
