import { Table2D, TableCanoniserTemplate, CellValueType, CellInfo, AllParams, AreaInfo, RegionPosition } from "./grammar";
export declare function serialize(obj: any): string;
export declare const getCellBySelect: (select: AllParams<RegionPosition>, currentArea: AreaInfo, rootArea: AreaInfo, constrFlag?: boolean) => CellInfo | null;
/**
 * Transforms messy, two-dimensional data (non-aligned table) into a canonical/tidy table (axis-aligned table) based on a given specification that adheres to the TableCanoniserTemplate interface.
 */
export declare function transformTable(table: Table2D, specs: TableCanoniserTemplate[]): {
    tidyData: {
        [key: string]: CellInfo[];
    };
    rootArea: AreaInfo;
    template2Cols: {
        [key: string]: Set<CellValueType>;
    };
};
