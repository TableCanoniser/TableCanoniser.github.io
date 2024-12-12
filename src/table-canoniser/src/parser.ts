import { Table2D, TableCanoniserTemplate, CellValueType, CellConstraint, CellPosi, TableCanoniserKeyWords, CellInfo, AllParams, AreaInfo, MatchedIndex, RegionPosition, offsetFn, completeRegionPosition, completeSpecification, CustomError } from "./grammar";


export function serialize(obj: any): string {
    const seen = new WeakSet();

    return JSON.stringify(obj, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                // 如果之前见过这个对象，则返回一个标记字符串
                return `[Reference to: ${key}]`;
            }
            seen.add(value);
        }
        return value;
    }, 2);
}

// store the target columns for each template
var template2Cols: { [key: string]: Set<CellValueType> } = {};

var executionMessages: { type: string, message: string, data: any }[] = [];
var rawSpecs: TableCanoniserTemplate[] = [];


export const getNodebyPath = (nodes: any, path: number[]) => {
    try {
        let temp = nodes[path[0]];
        path.slice(1).forEach((ref) => {
            temp = temp.children![ref];
        })
        return temp
    } catch (error) {
        return null
    }
}

// Helper function to evaluate constraints
const evaluateConstraint = (cellValue: CellValueType, constraint: CellConstraint): boolean => {
    if (typeof constraint.valueCstr === 'function') {
        return constraint.valueCstr(cellValue);
    }
    if (constraint.valueCstr === TableCanoniserKeyWords.String) {
        return typeof cellValue === 'string' && cellValue !== '' && isNaN(Number(cellValue));
    }
    if (constraint.valueCstr === TableCanoniserKeyWords.Number) {
        // return typeof cellValue === 'number' || (typeof cellValue === 'string' && cellValue.trim() !== cellValue && cellValue !== '' && !isNaN(Number(cellValue)));
        return typeof cellValue === 'number' || (typeof cellValue === 'string' && cellValue.trim() !== '' && !isNaN(Number(cellValue)));
    }
    if (constraint.valueCstr === TableCanoniserKeyWords.None) {
        return cellValue === null || cellValue === '' || cellValue === undefined;
    }
    if (constraint.valueCstr === TableCanoniserKeyWords.NotNone) {
        return cellValue !== null && cellValue !== '' && cellValue !== undefined;
    }
    return cellValue === constraint.valueCstr;
};

const calculateOffset = (offset: number | offsetFn, currentArea: AreaInfo, rootArea: AreaInfo): number => {
    return typeof offset === 'number' ? offset : offset(currentArea, rootArea);
};

export const getCellBySelect = (select: AllParams<RegionPosition>, currentArea: AreaInfo, rootArea: AreaInfo, constrFlag: boolean = false): CellInfo | null => {
    let area: AreaInfo = currentArea;
    if (select.offsetLayer === 'current') {
        area = currentArea;
    } else if (select.offsetLayer === 'root') {
        area = rootArea;
    } else if (select.offsetLayer === 'parent') {
        area = currentArea.parent!;
    } else {
        const layer = currentArea.areaLayer - select.offsetLayer(currentArea);
        for (let li = 0; li < layer; li++) {
            area = area.parent!;
        }
    }

    let cellPosi: CellPosi = {
        x: area.x + calculateOffset(select.offsetX, currentArea, rootArea),
        y: area.y + calculateOffset(select.offsetY, currentArea, rootArea)
    };  // topLeft

    if (select.offsetFrom === 'bottomLeft') {
        cellPosi.y += area.height - 1
    }
    else if (select.offsetFrom === 'topRight') {
        cellPosi.x += area.width - 1
    }
    else if (select.offsetFrom === 'bottomRight') {
        cellPosi.x += area.width - 1
        cellPosi.y += area.height - 1
    }

    // 判断是否越界
    if (cellPosi.x < 0 || cellPosi.y < 0 || cellPosi.x >= rootArea.width || cellPosi.y >= rootArea.height) {
        const errorMessage = `Invalid cell selection:\n Table size is (width: ${rootArea.width}, height: ${rootArea.height}), Position (${cellPosi.x}, ${cellPosi.y}) is out of bounds.`
        if (constrFlag) {
            // console.error(errorMessage); 
            return null;
        }
        else { throw new CustomError(errorMessage, 'OutOfBoundsError'); }
    }
    return {
        ...cellPosi,
        value: rootArea.areaTbl[cellPosi.y][cellPosi.x],
    };

};

const calculateSize = (size: number | 'toParentX' | 'toParentY' | null, startX: number, startY: number, currentArea: AreaInfo): number => {
    if (typeof size === 'number') {
        return size;
    }
    if (size === 'toParentX') {
        return currentArea.width - startX;
    }
    if (size === 'toParentY') {
        return currentArea.height - startY;
    }
    // 如果为 null，返回 1
    return 1;
};

const getSubArea = (table: Table2D, x: number, y: number, width: number, height: number): Table2D => {
    const subArea: Table2D = [];
    for (let i = y; i < y + height; i++) {
        const row = table[i].slice(x, x + width);
        subArea.push(row);
    }
    return subArea;
}

// 如果tidyData中的列长短不一样，则使用 template.fill 填充所有短的列，使每一列都有相同的长度
const fillColumns = (cols: Set<CellValueType>, tidyData: { [key: string]: CellInfo[] }, fill: CellValueType | null) => {
    if (fill === null) return;
    // 获取所有列的最大长度
    const maxLength = Math.max(...Object.values(tidyData).map(column => column.length));
    // 对每一列进行填充处理
    for (const key in tidyData) {
        if (!cols.has(key)) continue;
        const column = tidyData[key];
        const fillValue = fill === TableCanoniserKeyWords.Forward ? column[column.length - 1] : {
            x: -1,
            y: -1,
            value: fill
        } as CellInfo;

        // 如果列长度小于最大长度，则进行填充
        while (column.length < maxLength) {
            column.push(fillValue);
        }
    }
}

const traverseArea = (template: AllParams<TableCanoniserTemplate>, startX: number, startY: number, endX: number, endY: number, width: number, height: number, index: MatchedIndex, currentArea: AreaInfo, rootArea: AreaInfo, tidyData: { [key: string]: CellInfo[] }, startCell: CellInfo) => {

    let currentStartX = startX;
    let currentEndX = startX + width - 1;
    let currentStartY = startY;
    let currentEndY = startY + height - 1;
    let tmpArea: AreaInfo | null = null;

    while (currentEndY <= endY) {
        const areaHeight = currentEndY - currentStartY + 1;
        while (currentEndX <= endX) {
            const areaWidth = currentEndX - currentStartX + 1;
            tmpArea = matchArea(template, currentStartX, currentStartY, areaWidth, areaHeight, index, currentArea, rootArea, tidyData, startCell);
            // if (currentArea.templateRef.length === 0)
            // console.log("after match", [currentStartX, currentStartY, currentEndX, currentEndY], areaWidth, areaHeight, tmpArea != null);
            if (tmpArea === null) {
                // 如果没有找到，则移动到下一列
                if (template.match.size.width != null) {
                    // 宽度固定
                    currentStartX += 1;
                    currentEndX += 1
                } else if (currentEndX === endX) {
                    // 宽度可变且已经到了最后一列
                    currentStartX += 1
                    currentEndX = currentStartX
                } else {
                    // 宽度可变没有到最后一列
                    currentEndX += 1
                }
            } else {
                index.instanceIndex += 1;
                // if (!traverseFlag) return;
                if (template.match.traverse.xDirection === null) break;
                index.xIndex += 1;
                currentStartX += areaWidth
                currentEndX = currentStartX + width - 1;
            }
        }
        index.xIndex = 0;
        // 换行，列从 0 开始
        if (tmpArea === null) {
            // 如果没有找到，则移动到下一行
            if (template.match.size.height != null) {
                currentStartY += 1
                currentEndY += 1
            } else if (currentEndY === endY) {
                // 高度可变且已经到了最后一行
                currentStartY += 1
                currentEndY = currentStartY
            } else {
                currentEndY += 1
            }
        } else {
            // if (!traverseFlag) return;
            if (template.match.traverse.yDirection === null) break;
            index.yIndex += 1;
            currentStartY += areaHeight
            currentEndY = currentStartY + height - 1;
        }
        currentStartX = startX;
        currentEndX = startX + width - 1;
    }
    // console.log("match over");
}


const matchArea = (template: AllParams<TableCanoniserTemplate>, offsetX: number, offsetY: number, width: number, height: number, index: MatchedIndex, currentArea: AreaInfo, rootArea: AreaInfo, tidyData: { [key: string]: CellInfo[] }, startCell: CellInfo): AreaInfo | null => {

    let x = currentArea.x + offsetX, y = currentArea.y + offsetY;

    if (template.match.startCell.offsetLayer !== "current") {
        const cellInfo = getCellBySelect(template.match.startCell, currentArea, rootArea);
        if (cellInfo === null) {
            return null;
        };
        x = cellInfo.x;
        y = cellInfo.y;
    }

    const tmpArea: AreaInfo = {
        parent: currentArea,
        areaLayer: currentArea.areaLayer + 1,
        templateRef: index.templateRef.slice(),  // copy
        instanceIndex: index.instanceIndex,
        xIndex: index.xIndex,
        yIndex: index.yIndex,
        offsetX,
        offsetY,
        x,
        y,
        width,
        height,
        isDefinedFromSpec: x === startCell.x && y === startCell.y,
        areaTbl: getSubArea(rootArea.areaTbl, x, y, width, height),
        children: []
    }
    for (let cstr of template.match.constraints) {
        try {  // constraint 里的数组超界不会报错，而是根据 ignoreOutOfBounds 来判断
            const cellInfo = getCellBySelect(cstr, tmpArea, rootArea);
            if (cellInfo === null) {
                return null;
            }
            if (!evaluateConstraint(cellInfo.value, cstr)) return null;
        } catch (e) {
            if (cstr.ignoreOutOfBounds) continue;
            return null;
        }
    }
    currentArea.children.push(tmpArea);

    transformArea(template, tmpArea, rootArea, tidyData);
    return tmpArea;
};


const transformArea = (template: AllParams<TableCanoniserTemplate>, currentArea: AreaInfo, rootArea: AreaInfo, tidyData: { [key: string]: CellInfo[] }) => {

    const cellArray = currentArea.areaTbl.flat();
    if (template.extract) {
        let transformedCols: (CellValueType | null)[];
        if (template.extract.byPositionToTargetCols !== undefined) {
            transformedCols = template.extract.byPositionToTargetCols
        } else if (template.extract.byContext !== undefined) {
            const context = template.extract.byContext; // as AllParams<ContextTransform>;
            const ctxCols: (CellValueType | null)[] = []
            const ctxCellsInfo: CellInfo[][] = [];

            const ctxSelections: RegionPosition[][] = [];
            if (context.position === 'above') {
                currentArea.areaTbl.forEach((row, ri) => {
                    row.forEach((cell, ci) => {
                        ctxSelections.push([completeRegionPosition({
                            offsetX: ci,
                            offsetY: ri - 1,
                        })]);
                    })
                })
            } else if (context.position === 'below') {
                currentArea.areaTbl.forEach((row, ri) => {
                    row.forEach((cell, ci) => {
                        ctxSelections.push([completeRegionPosition({
                            offsetX: ci,
                            offsetY: ri + 1,
                        })]);
                    })
                })
            } else if (context.position === 'left') {
                currentArea.areaTbl.forEach((row, ri) => {
                    row.forEach((cell, ci) => {
                        ctxSelections.push([completeRegionPosition({
                            offsetX: ci - 1,
                            offsetY: ri,
                        })]);
                    })
                })
            } else if (context.position === 'right') {
                currentArea.areaTbl.forEach((row, ri) => {
                    row.forEach((cell, ci) => {
                        ctxSelections.push([completeRegionPosition({
                            offsetX: ci + 1,
                            offsetY: ri,
                        })]);
                    })
                })
            } else {
                const ctxPosiFn = context.position!;
                currentArea.areaTbl.forEach((row, ri) => {
                    row.forEach((cell, ci) => {
                        const customSelections = ctxPosiFn({
                            offsetX: ci,
                            offsetY: ri,
                            value: cell
                        }, currentArea, rootArea);
                        const customSelectionsWithDefaults = customSelections.map(selection => completeRegionPosition(selection));
                        ctxSelections.push(customSelectionsWithDefaults);
                    })
                })
            }

            if (ctxSelections.length > 0 && ctxSelections[0].length > 0) {
                ctxSelections.forEach((cellCtxs) => {
                    const cellCtxsInfo: CellInfo[] = [];
                    cellCtxs.forEach((selection) => {
                        const cell = getCellBySelect(selection as AllParams<RegionPosition>, currentArea, rootArea);
                        if (cell === null) {
                            return null;
                        }
                        cellCtxsInfo.push(cell);
                    })
                    ctxCellsInfo.push(cellCtxsInfo);
                });
            } else {
                console.log('No context cells found');
            }

            const customMapColbyCxt = context.toTargetCol!
            ctxCellsInfo.forEach(ctxCells => {
                ctxCols.push(customMapColbyCxt(ctxCells));
            })

            transformedCols = ctxCols
        } else if (template.extract.byValue !== undefined) {
            transformedCols = template.extract.byValue(currentArea.areaTbl);
        } else {
            throw new CustomError(`Please specify 'byPositionToTargetCols', 'byContext', or 'byValue' for extraction`, 'NoExtractionSpecified');
        }
        const templateRefStr = currentArea.templateRef.toString();
        if (!template2Cols.hasOwnProperty(templateRefStr)) {
            template2Cols[templateRefStr] = new Set();
        }
        const validCols: Set<CellValueType> = template2Cols[templateRefStr];

        if (transformedCols.length !== cellArray.length) {
            if (!executionMessages.some(msg => msg.type === 'MismatchNumberOfCells')) {
                // 相同类型的错误只会添加一次
                const code = (getNodebyPath(rawSpecs, currentArea.templateRef) as TableCanoniserTemplate).extract;
                let message: string;
                if (transformedCols.length > cellArray.length) {
                    message = `The number of extracted columns (${transformedCols.length}) is larger than the number of matched cells (${cellArray.length}).`;
                } else {
                    if (code?.byPositionToTargetCols !== undefined) {
                        code.byPositionToTargetCols = [...code.byPositionToTargetCols, ...Array(cellArray.length - transformedCols.length).fill(null)];
                    }
                    message = `The number of extracted columns (${transformedCols.length}) is less than the number of matched cells (${cellArray.length}).\nWe have automatically filled the missing columns with null.`;
                }
                executionMessages.push({ type: 'MismatchNumberOfCells', message, data: { code, path: currentArea.templateRef } });
            }
        }

        transformedCols.forEach((targetCol, index) => {
            if (targetCol !== null && targetCol !== undefined && targetCol !== '') {
                const cellInfo: CellInfo = {
                    x: index >= cellArray.length ? -1 : currentArea.x + index % currentArea.width,
                    y: index >= cellArray.length ? -1 : currentArea.y + Math.floor(index / currentArea.width),
                    value: cellArray[index],
                };
                if (tidyData.hasOwnProperty(targetCol)) {
                    tidyData[targetCol].push(cellInfo);
                } else {
                    tidyData[targetCol] = [cellInfo];
                }
                validCols.add(targetCol);
            }
        })

        for (let i = 1; i < currentArea.templateRef.length; i++) {
            const parentRefStr = currentArea.templateRef.slice(0, i).toString();
            if (!template2Cols.hasOwnProperty(parentRefStr)) {
                template2Cols[parentRefStr] = new Set();
            }
            template2Cols[parentRefStr] = new Set([...template2Cols[parentRefStr], ...validCols]);
        }
    }
    /*
    console.log(JSON.stringify(tidyData, (key, value) => {
        if (key === 'x' || key === 'y') {
            return undefined;
        }
        return value
    }, 2));
    console.log("-----------------");*/
}


// Recursive function to process a template
const processTemplate = (template: AllParams<TableCanoniserTemplate>, currentArea: AreaInfo, rootArea: AreaInfo, tidyData: { [key: string]: CellInfo[] }, templateIndex: number = 0) => {

    const index: MatchedIndex = {
        templateRef: [...currentArea.templateRef, templateIndex],
        instanceIndex: 0,
        xIndex: 0,
        yIndex: 0
    };

    const xDirection = template.match.traverse.xDirection;
    const yDirection = template.match.traverse.yDirection;


    const startCell = getCellBySelect(template.match.startCell, currentArea, rootArea);
    if (startCell === null) {
        return null;
    };

    const offsetX = startCell.x - currentArea.x;
    const offsetY = startCell.y - currentArea.y;

    // Calculate size
    const width = calculateSize(template.match.size.width, offsetX, offsetY, currentArea);
    const height = calculateSize(template.match.size.height, offsetX, offsetY, currentArea);

    let startX, startY, endX, endY;

    if (xDirection === null) {
        startX = offsetX;
        if (template.match.size.width === null) endX = currentArea.width - 1;
        else endX = startX + width - 1;
    } else if (xDirection === 'before') {
        startX = 0;
        endX = offsetX;
    } else if (xDirection === 'after') {
        startX = offsetX;
        endX = currentArea.width - 1;
    } else {  //  if (xDirection === 'beforeAndAfter')
        startX = 0;
        endX = currentArea.width - 1;
    }

    if (yDirection === null) {
        startY = offsetY;
        if (template.match.size.height === null) endY = currentArea.height - 1;
        else endY = startY + height - 1;
    } else if (yDirection === 'before') {
        startY = 0;
        endY = offsetY;
    } else if (yDirection === 'after') {
        startY = offsetY;
        endY = currentArea.height - 1;
    } else {  // if (yDirection === 'beforeAndAfter')
        startY = 0;
        endY = currentArea.height - 1;
    }

    // console.log(startX, startY, endX, endY, width, height);

    traverseArea(template, startX, startY, endX, endY, width, height, index, currentArea, rootArea, tidyData, startCell);

    const matchTemplateArea = currentArea.children.filter((area) => area.templateRef.toString() === index.templateRef.toString());

    if (template.children.length > 0 && matchTemplateArea.length > 0) {
        matchTemplateArea.forEach((areaChild) => {
            template.children.forEach((templateChild, ti) => {
                processTemplate(templateChild, areaChild, rootArea, tidyData, ti);
            });
            const templateCols = template2Cols[areaChild.templateRef.toString()];
            if (template.fill === TableCanoniserKeyWords.Auto) {
                if (areaChild.templateRef.length > 1) {
                    fillColumns(templateCols, tidyData, null);
                } else {
                    fillColumns(templateCols, tidyData, "");
                }
            } else {
                fillColumns(templateCols, tidyData, template.fill);
            }
        })
    }

    if (template.extract) {
        const extractKeys: string[] = [];
        for (const key in template.extract) {
            if (template.extract[key as keyof typeof template.extract] !== undefined) {
                extractKeys.push(key);
            }
        }
        if (extractKeys.length > 1) {
            if (!executionMessages.some(msg => msg.type === 'MultipleKeysInExtract')) {
                // 相同类型的错误只会添加一次
                const code = (getNodebyPath(rawSpecs, index.templateRef) as TableCanoniserTemplate).extract;
                executionMessages.push({ type: 'MultipleKeysInExtract', message: `Multiple keys (${extractKeys}) are detected in 'extract'. We'll prioritize and parse in this order: byPositionToTargetCols, byContext, byValue. Any others will be ignored.\nPlease provide only one key for accurate processing.`, data: { code, path: index.templateRef } });
            }
        }
    }

}

/**
 * Transforms messy, two-dimensional data (non-aligned table) into a canonical/tidy table (axis-aligned table) based on a given specification that adheres to the TableCanoniserTemplate interface.
 * @returns
 * - tidyData: The transformed canonical/tidy table
 * - rootArea: A tree data structure that contains the AreaInfo of all matched instances, starting from the root area
 * - template2Cols: A mapping from template index to its corresponding target columns
 * - executionMessages: A list of messages during the transformation process
 */
export function transformTable(table: Table2D, specs: TableCanoniserTemplate[]) {
    const rootArea: AreaInfo = {
        parent: null,
        areaLayer: 0,
        templateRef: [],
        instanceIndex: 0,
        xIndex: 0,
        yIndex: 0,
        offsetX: 0,
        offsetY: 0,
        x: 0,
        y: 0,
        width: table.length > 0 ? table[0].length : 0,
        height: table.length,
        isDefinedFromSpec: false,
        areaTbl: table,
        children: []
    };

    const tidyData: { [key: string]: CellInfo[] } = {}

    template2Cols = {};
    executionMessages = [];
    rawSpecs = specs;

    specs.forEach((template, ti) => {
        const specWithDefaults = completeSpecification(template);
        processTemplate(specWithDefaults, rootArea, rootArea, tidyData, ti);
    });

    return { tidyData, rootArea, template2Cols, executionMessages };
}