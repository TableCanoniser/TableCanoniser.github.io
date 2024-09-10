import { Table2D, TableCanoniserTemplate, CellValueType, CellInfo, AllParams, AreaInfo, RegionPosition } from "./grammar";
export declare function serialize(obj: any): string;
export declare const getNodebyPath: (nodes: any, path: number[]) => any;
export declare const getCellBySelect: (select: AllParams<RegionPosition>, currentArea: AreaInfo, rootArea: AreaInfo, constrFlag?: boolean) => CellInfo | null;
/**
 * Transforms messy, two-dimensional data (non-aligned table) into a canonical/tidy table (axis-aligned table) based on a given specification that adheres to the TableCanoniserTemplate interface.
 * @returns
 * - tidyData: The transformed canonical/tidy table
 * - rootArea: A tree data structure that contains the AreaInfo of all matched instances, starting from the root area
 * - template2Cols: A mapping from template index to its corresponding target columns
 * - executionMessages: A list of messages during the transformation process
 */
export declare function transformTable(table: Table2D, specs: TableCanoniserTemplate[]): {
    tidyData: {
        [key: string]: CellInfo[];
    };
    rootArea: AreaInfo;
    template2Cols: {
        [key: string]: Set<CellValueType>;
    };
    executionMessages: {
        type: string;
        message: string;
        data: any;
    }[];
};
