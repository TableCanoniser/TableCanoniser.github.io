# table-canoniser

Define a declarative grammar that transforms messy data (non-aligned tables) into canonical/tidy tables (axis-aligned tables).

## System

[TableCanoniser Online System](https://tablecanoniser.github.io/)

### System Interface

![System Interface](https://github.com/TableCanoniser/TableCanoniser.github.io/blob/deploy/system-interface.png)

## Installation

Install the package into your project using [NPM](https://npmjs.com):
`$ npm install table-canoniser`

## The Declarative Grammar

`TableCanoniserTemplate`: The main template for defining the transformation rules:

- `match`: The matching criteria for a selecting area
  - `startCell`: The starting cell for the selection
    - `offsetLayer`: The layer of the reference area for selection, default is 'current'
    - `offsetFrom`: The start position of the reference area for selection, default is 'topLeft'
    - `offsetX`: The x-axis offset relative to the start position of the reference area, default is 0
    - `offsetY`: The y-axis offset relative to the start position of the reference area, default is 0
  - `size`: The size of the selected area
    - `width`: The width of the selected area; 'toParentX' means the distance from the startCell to the parent's x-axis end; `null` means no fixed width, default is 1
    - `height`: The height of the selected area; 'toParentY' means the distance from the startCell to the parent's y-axis end; `null` means no fixed height, default is 1
  - `constraints`: Constraints to apply to the cells within the selected area
    - `offsetLayer`: The reference area layer for the constrainted cell, default is 'current'
    - `offsetFrom`: The reference area position for the constrainted cell, default is 'topLeft'
    - `offsetX`: The x-axis offset relative to the reference area, default is 0
    - `offsetY`: The y-axis offset relative to the reference area, default is 0
    - `valueCstr`: The value constraint, default is `TableCanoniserKeyWords.String`
    - `ignoreOutOfBounds`: Determines whether to ignore the constraint when the specified cell exceeds the table boundaries, default is true
  - `traverse`: The traversal direction for the selected area
    - `xDirection`: The x-axis traversal direction; 'after' means traversing after the startCell; 'before' means traversing before the startCell; 'beforeAndAfter' means traversing the entire area; default is null, meaning no traversal
    - `yDirection`: The y-axis traversal direction; 'after' means traversing after the startCell; 'before' means traversing before the startCell; 'beforeAndAfter' means traversing the entire area; default is null, meaning no traversal
- `extract`: The extraction rules for transforming the selected area
  - `byContext`: The context-based transformation for the selected area
    - `position`: Defines the location of the context cell relative to the current cell, default is 'above'
    - `toTargetCol`: Determines how to derive the target column based on the context cell(s). This function will return the first context cell's value as the target column by default.
  - `byPositionToTargetCols`: The target columns for the transformation, which is an array (position-based transformation)
  - `byValue`: The custom function for value-based transformation
- `fill`: Specifies how to handle columns in the output table that have different lengths after extracting values from the matched region.
  - `TableCanoniserKeyWords.Auto` (default) means that columns with a length less than the maximum length will be automatically filled with null or empty strings, depending on the information of the matching area and pattern.
  - `TableCanoniserKeyWords.Forward` means that columns with a length less than the maximum length will be filled with the last available value, ensuring that all columns in the output table have equal lengths.
  - `null` means no filling will occur, and columns can have different lengths.
  - `CellValueType`: A custom value can also be provided, which will be used to fill the column to match the length of the longest column.
- `children`: The child templates for nested selections

## Example

```ts
import {
  Table2D,
  TableCanoniserTemplate,
  TableCanoniserKeyWords,
  transformTable,
} from "table-canoniser";

const messyData: Table2D = [
  ["Rank", "Name", "Age"],
  [1, "Bob", 16],
  ["", "Score", 92],
  [2, "Sam", 15],
  ["", "Score", 89],
  [3, "Alice", 16],
  ["", "Score", 87],
  [4, "John", 16],
  ["", "Score", 86],
];

const spec: TableCanoniserTemplate = {
  match: {
    startCell: { offsetX: 0, offsetY: 1 },
    size: { width: "toParentX", height: 2 },
    constraints: [
      { offsetX: 0, offsetY: 0, valueCstr: TableCanoniserKeyWords.Number },
    ],
    traverse: { yDirection: "after" },
  },
  children: [
    {
      match: {
        startCell: { offsetX: 0, offsetY: 0 },
        size: { width: "toParentX" },
      },
      extract: { byPositionToTargetCols: ["Rank", "Name", "Age"] },
    },
    {
      match: {
        startCell: { offsetX: 2, offsetY: 1 },
        constraints: [{ offsetX: -1, offsetY: 0, valueCstr: "Score" }],
      },
      extract: { byPositionToTargetCols: ["Score"] },
    },
  ],
};

const { tidyData } = transformTable(messyData, [spec]);
console.log(tidyData);
/*
{
  Rank: [
    { x: 0, y: 1, value: 1 },
    { x: 0, y: 3, value: 2 },
    { x: 0, y: 5, value: 3 },
    { x: 0, y: 7, value: 4 }
  ],
  Name: [
    { x: 1, y: 1, value: 'Bob' },
    { x: 1, y: 3, value: 'Sam' },
    { x: 1, y: 5, value: 'Alice' },
    { x: 1, y: 7, value: 'John' }
  ],
  Age: [
    { x: 2, y: 1, value: 16 },
    { x: 2, y: 3, value: 15 },
    { x: 2, y: 5, value: 16 },
    { x: 2, y: 7, value: 16 }
  ],
  Score: [
    { x: 2, y: 2, value: 92 },
    { x: 2, y: 4, value: 89 },
    { x: 2, y: 6, value: 87 },
    { x: 2, y: 8, value: 86 }
  ]
}
*/
```
