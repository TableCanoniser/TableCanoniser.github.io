declare type CellValueType = string | number | undefined;
/**
 * Defines a set of keywords used in the TableCanoniser Grammar.
 *
 * - `String`: Used in `valueCstr` of `constraints` to specify that a cell must contain a string value.
 * - `Number`: Used in `valueCstr` of `constraints` to specify that a cell must contain a numeric value.
 * - `None`: Used in `valueCstr` of `constraints` to specify that a cell must be empty, null, or undefined.
 * - `NotNone`: Used in `valueCstr` of `constraints` to specify that a cell must not be empty, null, or undefined.
 * - `Forward`: Used in the `fill` property to indicate that columns with a length less than the maximum length will be filled with the last available value, ensuring that all columns in the output table have equal lengths.
 * - `Auto`: Used in the `fill` property to indicate that columns with a length less than the maximum length will be automatically filled with null or empty strings, depending on the information of the matching area and pattern.
 * - `pairSort`: Used in user-defined functions to sort array `A` according to the specified order (`asc` or `desc`) and reorders array `B`, so that its elements correspond to the newly sorted order of `A`.
 */
declare const TableCanoniserKeyWords: {
    /**
     * Used in `valueCstr` of `constraints` to specify that a cell must contain a string value.
     */
    String: string;
    /**
     * Used in `valueCstr` of `constraints` to specify that a cell must contain a numeric value.
     */
    Number: string;
    /**
     * Used in `valueCstr` of `constraints` to specify that a cell must be empty, null, or undefined.
     */
    None: string;
    /**
     * Used in `valueCstr` of `constraints` to specify that a cell must not be empty, null, or undefined.
     */
    NotNone: string;
    /**
     * Used in the `fill` property to indicate that columns with a length less than the maximum length will be filled with the last available value, ensuring that all columns in the output table have equal lengths.
     */
    Forward: string;
    /**
     * Used in the `fill` property to indicate that columns with a length less than the maximum length will be automatically filled with null or empty strings, depending on the information of the matching area and pattern.
     */
    Auto: string;
    /**
     * Used in user-defined functions to sort array `A` according to the specified order (`asc` or `desc`) and reorders array `B`
     * so that its elements correspond to the newly sorted order of `A`.
     *
     * @param {any[]} A - The array whose elements determine the sort order.
     * @param {any[]} B - The array to be reordered based on the sorted order of `A`.
     * @param {'asc' | 'desc'} sortOrder - The sorting order: 'asc' for ascending, 'desc' for descending.
     * @returns {any[]} - The reordered array `B` with elements corresponding to the sorted order of `A`.
     *
     * @example
     * ```typeScript
     * const A = [3, 1, 2];
     * const B = ['Col1', 'Col2', 'Col3'];
     * const correspondingB_Asc = TableCanoniserKeyWords.pairSort(A, B, 'asc');
     * // ['Col3', 'Col1', 'Col2']
     * const correspondingB_Desc = TableCanoniserKeyWords.pairSort(A, B, 'desc');
     * // ['Col1', 'Col3', 'Col2']
     * ```
     */
    pairSort: typeof sortWithCorrespondingArray;
};
/**
 * Represents the matched index of a matched area
 * - `templateRef`: The template reference that matches this area
 * - `instanceIndex`: The instance index of this area that matches the templateRef within the parent area
 * - `xIndex`: The x-axis index of this area within the parent area
 * - `yIndex`: The y-axis index of this area within the parent area
 */
interface MatchedIndex {
    /**
     * The template reference that matches this area
     */
    templateRef: number[];
    /**
     * The instance index of this area that matches the templateRef within the parent area
     */
    instanceIndex: number;
    /**
     * The x-axis index of this area within the parent area
     */
    xIndex: number;
    /**
     * The y-axis index of this area within the parent area
     */
    yIndex: number;
}
/**
 * Represents a single cell within an area
 * - `offsetX`: The x-axis offset of the cell within the area
 * - `offsetY`: The y-axis offset of the cell within the area
 * - `value`: The value of the cell
 */
interface AreaCell {
    /**
     * The x-axis offset of the cell within the area
     */
    offsetX: number;
    /**
     * The y-axis offset of the cell within the area
     */
    offsetY: number;
    /**
     * The value of the cell
     */
    value: CellValueType;
}
/**
 * Represents the position of a cell
 */
interface CellPosi {
    /**
     * The x-coordinate of the cell
     */
    x: number;
    /**
     * The y-coordinate of the cell
     */
    y: number;
}
/**
 * Represents information about a cell
 * - `x`: The x-coordinate of the cell
 * - `y`: The y-coordinate of the cell
 * - `value`: The value of the cell
 */
interface CellInfo extends CellPosi {
    /**
     * The value of the cell
     */
    value: CellValueType;
}
declare type Table2D = CellValueType[][];
/**
 * A function that calculates an offset based on the current area information and the root area information.
 * @param currentArea - The current area information.
 * @param rootArea - The root area information.
 * @returns The calculated offset.
 */
declare type offsetFn = (currentArea: AreaInfo, rootArea: AreaInfo) => number;
/**
 * A function that checks if a cell value meets a custom condition.
 * @param value - The value of the constrained cell.
 * @returns A boolean indicating whether the cell value meets the condition.
 */
declare type checkValueFn = (value: CellValueType) => boolean;
/**
 * A function that maps the cells in an area to their corresponding target columns.
 * @param currentAreaTbl - The current area table.
 * @returns An array of target column names or null values.
 */
declare type mapColsFn = (currentAreaTbl: Table2D) => (CellValueType | null)[];
/**
 * A function that maps the context cells to a specific target column.
 * @param ctxCells - The info (position and value) of the context cells.
 * @returns The name of the target column or null.
 */
declare type mapColbyContextFn = (ctxCells: CellInfo[]) => CellValueType | null;
/**
 * A function that defines the position of a cell's context based on the current area information and the root area information.
 * @param cell - The current cell's value and its position relative to the current area.
 * @param currentArea - The current area information.
 * @param rootArea - The root area information.
 * @returns An array of cell selections that define the positions of the cell's context.
 */
declare type contextPosiFn = (cell: AreaCell, currentArea: AreaInfo, rootArea: AreaInfo) => RegionPosition[];
/**
 * A function that determines the layer of an area based on its current area information.
 * @param currentArea - The current area information.
 * @returns The layer number of the area.
 */
declare type areaLayerFn = (currentArea: AreaInfo) => number;
/**
 * Represents the information of a selected area within the table
 * - `parent`: The parent area of this area
 * - `areaLayer`: The layer level of this area within the root area
 * - `templateRef`: The template reference that matches this area
 * - `instanceIndex`: The instance index of this area that matches the templateRef within the parent area
 * - `xIndex`: The x-axis index of this area within the parent area
 * - `yIndex`: The y-axis index of this area within the parent area
 * - `offsetX`: The x-axis offset of this area within the parent area
 * - `offsetY`: The y-axis offset of this area within the parent area
 * - `x`: The x-coordinate of this area within the entire table
 * - `y`: The y-coordinate of this area within the entire table
 * - `width`: The width of this area
 * - `height`: The height of this area
 * - `areaTbl`: All cells within this area
 * - `children`: The child areas of this area
 */
interface AreaInfo extends MatchedIndex {
    /**
     * The parent area of this area
     */
    parent: AreaInfo | null;
    /**
     * The layer level of this area within the root area
     */
    areaLayer: number;
    /**
     * The x-axis offset of this area within the parent area
     */
    offsetX: number;
    /**
     * The y-axis offset of this area within the parent area
     */
    offsetY: number;
    /**
     * The x-coordinate of this area within the entire table
     */
    x: number;
    /**
     * The y-coordinate of this area within the entire table
     */
    y: number;
    /**
     * The width of this area
     */
    width: number;
    /**
     * The height of this area
     */
    height: number;
    /**
     * Whether this area is defined from the specification
     */
    isDefinedFromSpec: boolean;
    /**
     * All cells within this area
     */
    areaTbl: Table2D;
    /**
     * The child areas of this area
     */
    children: AreaInfo[];
}
/**
 * Defines the selection position for a region within the table
 * - `offsetLayer`: The layer of the reference area for selection, default is 'current'
 * - `offsetFrom`: The start position of the reference area for selection, default is 'topLeft'
 * - `offsetX`: The x-axis offset relative to the start position of the reference area, default is 0
 * - `offsetY`: The y-axis offset relative to the start position of the reference area, default is 0
 */
interface RegionPosition {
    /**
     * The layer of the reference area for selection, default is 'current'
     * - `areaLayerFn` (currentArea: AreaInfo) => number: A function that determines the layer of an area based on its current area information.
     *   - `currentArea` : The current area information.
     *   @example
     *   (currentArea) => currentArea.areaLayer - 2
     */
    offsetLayer?: 'current' | 'parent' | 'root' | areaLayerFn;
    /**
     * The start position of the reference area for selection, default is 'topLeft'
     */
    offsetFrom?: 'topLeft' | 'bottomLeft' | 'topRight' | 'bottomRight';
    /**
     * The x-axis offset relative to the start position of the reference area, default is 0
     * - `offsetFn` (currentArea: AreaInfo, rootArea: AreaInfo) => number: A function that returns the x-axis offset
     *   - `currentArea` : The current area information.
     *   - `rootArea` : The root area information.
     *   @example
     *   (currentArea, rootArea) => currentArea.x - rootArea.x
     */
    offsetX?: number | offsetFn;
    /**
     * The y-axis offset relative to the start position of the reference area, default is 0
     * - `offsetFn` (currentArea: AreaInfo, rootArea: AreaInfo) => number: A function that returns the y-axis offset
     *   - `currentArea` : The current area information.
     *   - `rootArea` : The root area information.
     *   @example
     *   (currentArea, rootArea) => currentArea.y - rootArea.y
     */
    offsetY?: number | offsetFn;
}
/**
 * Represents a constraint on a cell's value
 * - `valueCstr`: The value constraint
 *   - `TableCanoniserKeyWords.String` (default): Specifies that the cell's value must be a string.
 *   - `TableCanoniserKeyWords.Number`: Specifies that the cell's value must be a number.
 *   - `TableCanoniserKeyWords.None`: Specifies that the cell must be empty, null, or undefined.
 *   - `TableCanoniserKeyWords.NotNone`: Specifies that the cell must not be empty, null, or undefined.
 *   - `CellValueType`: Specifies that the cell's value must be equal to the provided value.
 *   - `checkValueFn`: Specifies a custom function to check if the cell's value meets certain conditions.
 * - `ignoreOutOfBounds` - Determines whether to ignore the constraint when the specified cell exceeds the table boundaries.
 *   - `true` (default) means that if the specified cell is out of bounds, the constraint will be ignored, and the search will continue with other checks.
 *   - `false` means that if the specified cell is out of bounds, the pattern will be considered as not matching, even if other conditions are satisfied.
 */
interface CellConstraint extends RegionPosition {
    /**
     * The value constraint
     * - `TableCanoniserKeyWords.String` (default): Specifies that the cell's value must be a string.
     * - `TableCanoniserKeyWords.Number`: Specifies that the cell's value must be a number.
     * - `TableCanoniserKeyWords.None`: Specifies that the cell must be empty, null, or undefined.
     * - `TableCanoniserKeyWords.NotNone`: Specifies that the cell must not be empty, null, or undefined.
     * - `CellValueType`: Specifies that the cell's value must be equal to the provided value.
     * - `checkValueFn` (value: CellValueType) => boolean: Specifies a custom function to check if the cell's value meets certain conditions.
     *   - `value` : The value of the constrained cell.
     *   @example
     *   (value) => typeof value === 'number' && value > 0
     *   // The cell's value must be a number and greater than 0
     */
    valueCstr?: CellValueType | checkValueFn;
    /**
     * Determines whether to ignore the constraint when the specified cell exceeds the table boundaries.
     * - `true` (default) means that if the specified cell is out of bounds, the constraint will be ignored, and the search will continue with other checks.
     * - `false` means that if the specified cell is out of bounds, the pattern will be considered as not matching, even if other conditions are satisfied.
     */
    ignoreOutOfBounds?: boolean;
}
/**
 * ContextTransform specifies how to derive the target column for a cell based on its context cell.
 *
 * - `position`: Defines the location of the context cell relative to the current cell.
 *   - 'above' (default): The context cell is located directly above the current cell.
 *   - 'below': The context cell is located directly below the current cell.
 *   - 'left': The context cell is located directly to the left of the current cell.
 *   - 'right': The context cell is located directly to the right of the current cell.
 *   - `contextPosiFn`: A custom function to determine the position of a cell's context.
 *
 * - `toTargetCol`: Determines how to derive the target column based on the context cell(s).
 *   - `mapColbyContextFn` (ctxCells: CellInfo[]) => CellValueType | null: A custom function to map the context cells to a specific target column. If the function returns null, the cell will not be transformed to the output table. This function will return the first context cell's value as the target column by default (i.e., `(ctxCells) => ctxCells[0].value`).
 */
interface ContextTransform {
    /**
       * Defines the location of the context cell relative to the current cell.
       * - 'above' (default): The context cell is located directly above the current cell.
       * - 'below': The context cell is located directly below the current cell.
       * - 'left': The context cell is located directly to the left of the current cell.
       * - 'right': The context cell is located directly to the right of the current cell.
       * - `contextPosiFn` (cell: AreaCell, currentArea: AreaInfo, rootArea: AreaInfo) => RegionPosition[]: A custom function to determine the position of a cell's context
       *   - `cell`: The current cell's value and its position relative to the current area.
       *   - `currentArea`: The current area information.
       *   - `rootArea`: The root area information.
       *   - returns — An array of cell selections that define the positions of the cell's context. (A cell's context can be defined by multiple selections)
       *   @example
       *   (cell, currentArea, rootArea) => {
                  return [{
                      offsetX: cell.offsetX,
                      offsetY: cell.offsetY - (currentArea.yIndex + 1) * currentArea.height,
                  }];
              }
       */
    position?: "above" | "below" | "left" | "right" | contextPosiFn;
    /**
       * Determines how to derive the target column based on the context cell(s).
       * - `mapColbyContextFn` (ctxCells: CellInfo[]) => CellValueType | null: A custom function to map the context cells to a specific target column. If the function returns null, the cell will not be transformed to the output table. This function will return the first context cell's value as the target column by default (i.e., `(ctxCells) => ctxCells[0].value`).
       *   - `ctxCells`: The info (position and value) of the context cells.
       *   @example
       *   (ctxCells) => {
           if (typeof ctxCells[0].value === "number") {
               if (ctxCells[0].value > 0) {
                   return "positive";
               } else {
                   return "negative";
               }
           }
           return null;
       }
       */
    toTargetCol?: mapColbyContextFn;
}
/**
 * The main template for defining the transformation rules
 * - `match`: The matching criteria for a selecting area
 *   - `startCell`: The starting cell for the selection
 *     - `offsetLayer`: The layer of the reference area for selection, default is 'current'
 *     - `offsetFrom`: The start position of the reference area for selection, default is 'topLeft'
 *     - `offsetX`: The x-axis offset relative to the start position of the reference area, default is 0
 *     - `offsetY`: The y-axis offset relative to the start position of the reference area, default is 0
 *   - `size`: The size of the selected area
 *     - `width`: The width of the selected area; 'toParentX' means the distance from the startCell to the parent's x-axis end; `null` means no fixed width, default is 1
 *     - `height`: The height of the selected area; 'toParentY' means the distance from the startCell to the parent's y-axis end; `null` means no fixed height, default is 1
 *   - `constraints`: Constraints to apply to the cells within the selected area
 *     - `offsetLayer`: The reference area layer for the constrainted cell, default is 'current'
 *     - `offsetFrom`: The reference area position for the constrainted cell, default is 'topLeft'
 *     - `offsetX`: The x-axis offset relative to the reference area, default is 0
 *     - `offsetY`: The y-axis offset relative to the reference area, default is 0
 *     - `valueCstr`: The value constraint, default is `TableCanoniserKeyWords.String`
 *     - `ignoreOutOfBounds`: Determines whether to ignore the constraint when the specified cell exceeds the table boundaries, default is true
 *   - `traverse`: The traversal direction for the selected area
 *     - `xDirection`: The x-axis traversal direction; 'after' means traversing after the startCell; 'before' means traversing before the startCell; 'beforeAndAfter' means traversing the entire area; default is null, meaning no traversal
 *     - `yDirection`: The y-axis traversal direction; 'after' means traversing after the startCell; 'before' means traversing before the startCell; 'beforeAndAfter' means traversing the entire area; default is null, meaning no traversal
 * - `extract`: The extraction rules for transforming the selected area
 *   - `byContext`: The context-based transformation for the selected area
 *     - `position`: Defines the location of the context cell relative to the current cell, default is 'above'
 *     - `toTargetCol`: Determines how to derive the target column based on the context cell(s). This function will return the first context cell's value as the target column by default.
 *   - `byPositionToTargetCols`: The target columns for the transformation, which is an array (position-based transformation)
 *   - `byValue`: The custom function for value-based transformation
 * - `fill`: Specifies how to handle columns in the output table that have different lengths after extracting values from the matched region.
 *   - `TableCanoniserKeyWords.Auto` (default) means that columns with a length less than the maximum length will be automatically filled with null or empty strings, depending on the information of the matching area and pattern.
 *   - `TableCanoniserKeyWords.Forward` means that columns with a length less than the maximum length will be filled with the last available value, ensuring that all columns in the output table have equal lengths.
 *   - `null` means no filling will occur, and columns can have different lengths.
 *   - `CellValueType`: A custom value can also be provided, which will be used to fill the column to match the length of the longest column.
 * - `children`: The child templates for nested selections
 */
interface TableCanoniserTemplate {
    /**
     * The matching criteria for a selecting area
     */
    match?: {
        /**
         * The starting cell for the selection
         * - `offsetLayer`: The layer of the reference area for selection, default is 'current'
         * - `offsetFrom`: The start position of the reference area for selection, default is 'topLeft'
         * - `offsetX`: The x-axis offset relative to the start position of the reference area, default is 0
         * - `offsetY`: The y-axis offset relative to the start position of the reference area, default is 0
         */
        startCell?: RegionPosition;
        /**
         * The size of the selected area
         */
        size?: {
            /**
             * The width of the selected area; 'toParentX' means the distance from the startCell to the parent's x-axis end; `null` means that the selected area does not have a fixed width (its width depends on the constraints), default is 1
             */
            width?: number | "toParentX" | null;
            /**
             * The height of the selected area; 'toParentY' means the distance from the startCell to the parent's y-axis end; `null` means that the selected area does not have a fixed height (its height depends on the constraints), default is 1
             */
            height?: number | "toParentY" | null;
        };
        /**
         * Constraints to apply to the cells within the selected area
         * - `offsetLayer`: The reference area layer for the constrainted cell, default is 'current'
         * - `offsetFrom`: The reference area position for the constrainted cell, default is 'topLeft'
         * - `offsetX`: The x-axis offset relative to the reference area, default is 0
         * - `offsetY`: The y-axis offset relative to the reference area, default is 0
         * - `valueCstr`: The value constraint, default is `TableCanoniserKeyWords.String`
         * - `ignoreOutOfBounds`: Determines whether to ignore the constraint when the specified cell exceeds the table boundaries, default is true
         */
        constraints?: CellConstraint[];
        /**
         * The traversal direction for the selected area
         */
        traverse?: {
            /**
             * The x-axis traversal direction; 'after' means traversing after the startCell; 'before' means traversing before the startCell; 'beforeAndAfter' means traversing the entire area; default is null, meaning no traversal
             */
            xDirection?: null | "after" | "before" | 'beforeAndAfter';
            /**
             * The y-axis traversal direction; 'after' means traversing after the startCell; 'before' means traversing before the startCell; 'beforeAndAfter' means traversing the entire area; default is null, meaning no traversal
             */
            yDirection?: null | "after" | "before" | 'beforeAndAfter';
        };
    };
    /**
     * The extraction rules for transforming the selected area
     */
    extract?: {
        /**
         * The context-based transformation for the selected area
         * - `position`: Defines the location of the context cell relative to the current cell, default is 'above'
         * - `toTargetCol`: Determines how to derive the target column based on the context cell(s). This function will return the first context cell's value as the target column by default.
         */
        byContext?: ContextTransform;
        /**
         * The target columns for the transformation, which is an array (position-based transformation)
         */
        byPositionToTargetCols?: (CellValueType | null)[];
        /**
         * The custom function for value-based transformation.
         * - `mapColsFn` (currentAreaTbl: Table2D) => (CellValueType | null)[]: Map the cells in an area to their corresponding target columns.
         * @param currentAreaTbl - The current area table.
         * @example
         * (currentAreaTbl) => currentAreaTbl.flat().map((cell, i) => 'Col' + (i + 1));
         * // => ['Col1', 'Col2', 'Col3', ...]
         */
        byValue?: mapColsFn;
    } | null;
    /**
     * Specifies how to handle columns in the output table that have different lengths after extracting values from the matched region.
     * - `TableCanoniserKeyWords.Auto` (default) means that columns with a length less than the maximum length will be automatically filled with null or empty strings, depending on the information of the matching area and pattern.
     * - `TableCanoniserKeyWords.Forward` means that columns with a length less than the maximum length will be filled with the last available value, ensuring that all columns in the output table have equal lengths.
     * - `null` means no filling will occur, and columns can have different lengths.
     * - `CellValueType`: A custom value can also be provided, which will be used to fill the column to match the length of the longest column.
     */
    fill?: CellValueType | null;
    /**
     * The child templates for nested selections
     */
    children?: TableCanoniserTemplate[];
}
/**
 * Sorts array `A` according to the specified order (`asc` or `desc`) and reorders array `B`
 * so that its elements correspond to the newly sorted order of `A`.
 *
 * @param {any[]} A - The array whose elements determine the sort order.
 * @param {any[]} B - The array to be reordered based on the sorted order of `A`.
 * @param {'asc' | 'desc'} sortOrder - The sorting order: 'asc' for ascending, 'desc' for descending.
 * @returns {any[]} - The reordered array `B` with elements corresponding to the sorted order of `A`.
 *
 * @example
 * const A = [3, 1, 2];
 * const B = ['Col1', 'Col2', 'Col3'];
 * const correspondingB_Asc = sortWithCorrespondingArray(A, B, 'asc');  // ['Col3', 'Col1', 'Col2']
 * const correspondingB_Desc = sortWithCorrespondingArray(A, B, 'desc'); // ['Col1', 'Col3', 'Col2']
 */
declare function sortWithCorrespondingArray(A: any[], B: any[], sortOrder: 'asc' | 'desc'): any[];
/********************************************************************************/
declare type NonUndefined<T> = T extends undefined ? never : T;
declare type AllParams<T> = {
    [K in keyof T]-?: NonUndefined<T[K]> extends object ? AllParams<NonUndefined<T[K]>> : NonUndefined<T[K]>;
};
declare function completeRegionPosition(selection: RegionPosition | undefined): RegionPosition;
declare function completeCellConstraint(constraint: CellConstraint): AllParams<CellConstraint>;
declare function completeSpecification(template: TableCanoniserTemplate): AllParams<TableCanoniserTemplate>;
declare class CustomError extends Error {
    constructor(message: string, name?: string);
}
export { Table2D, TableCanoniserTemplate, CellValueType, CellConstraint, ContextTransform, CellPosi, TableCanoniserKeyWords, CellInfo, AllParams, AreaInfo, MatchedIndex, RegionPosition, offsetFn, completeSpecification, completeRegionPosition, completeCellConstraint, CustomError, };
