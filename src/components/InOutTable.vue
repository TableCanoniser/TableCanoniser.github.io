<template>
  <div class="view">
    <div class="view-title">
      <span class="head-text">{{ langConfig[lang].table.input }}</span>
      <span style="float: right; margin-right: 10px">
        <a-upload v-model:file-list="fileList" :max-count="1" accept=".csv, .txt, .xls, .xlsx"
          :customRequest="handleUpload" @remove="handleRemove" @preview="handlePreview" :showUploadList="{
            showRemoveIcon: true,
          }">
          <a-button size="small">
            <v-icon name="bi-upload" scale="0.85" />
            <span>{{ langConfig[lang].table.upload }}</span>
          </a-button>
        </a-upload>
        <a-button style="margin-left: 5px;" size="small" @click="resetData">
          <v-icon name="bi-arrow-clockwise" scale="0.9"></v-icon>
          <span>{{ langConfig[lang].table.reset }}</span>
        </a-button>
      </span>
    </div>
    <div class="view-content">
      <ColType tblType="input_tbl" />
      <div id="output-tbl" style="height: calc(100% - 28px); overflow: hidden;">
        <hot-table ref="inputTbl" :data="input_tbl" :rowHeaders="true" :colHeaders="true" :manualColumnResize="true"
          :autoWrapRow="true" :autoWrapCol="true" :contextMenu="true" :renderer="renderTblCell"
          licenseKey="non-commercial-and-evaluation"></hot-table>
      </div>
    </div>
  </div>
  <div class="divider-w" @mousedown="getNeighborEls($event, 'width')" title="Drag to resize"></div>
  <div class="view">
    <div class="view-title">
      <span>{{ langConfig[lang].table.output }}</span>
      <span style="float: right; margin-right: 10px">
        <a-button size="small" @click="handleDownload">
          <v-icon name="bi-download" scale="0.85"></v-icon>
          <span>{{ langConfig[lang].table.download }}</span>
        </a-button>
      </span>
    </div>
    <div class="view-content">
      <ColType tblType="output_tbl" />
      <div id="output-tbl" style="height: calc(100% - 28px); overflow: hidden;">
        <hot-table ref="outputTbl" :data="output_tbl" :rowHeaders="true" :colHeaders="output_col"
          :manualColumnResize="true" :renderer="renderTblCell" :contextMenu="true" :autoWrapRow="true"
          :autoWrapCol="true" licenseKey="non-commercial-and-evaluation"></hot-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getCurrentInstance,
  ComponentPublicInstance,
  ref,
  onMounted,
  watch,
} from "vue";
import ColType from "@/components/ColType.vue";
import { HotTable } from "@handsontable/vue3";
import "handsontable/dist/handsontable.full.css";
import { registerAllModules } from "handsontable/registry";
import Handsontable from "handsontable";
import { useTableStore, Selection } from "@/store/table";
// import Papa from 'papaparse';  // parse csv data
import * as XLSX from 'xlsx';  // parse excel data
import { Table2D, TableCanoniserTemplate } from "@/table-canoniser/dist/grammar"
import { message } from "ant-design-vue";
import { getNeighborEls } from '@/utils/dragLayout';

import { lang, langConfig } from "@/utils/lang";

// import { ArrowUpTrayIcon } from '@heroicons/vue/24/solid'

// register Handsontable's modules
registerAllModules();

const tableStore = useTableStore();
// const tblCases: { [key: string]: TblVisData } = tableStore.cases;

const output_col = ref(tableStore.output_tbl.cols);
const output_tbl = ref(tableStore.output_tbl.tbl);
const input_tbl = ref(tableStore.input_tbl.tbl);

let inHotInst: Handsontable;
let outHotInst: Handsontable;

function renderTblCell(instance: Handsontable,
  td: HTMLElement,
  row: number,
  col: number,
  prop: any,
  value: any,
  cellProperties: any) {
  // @ts-ignore
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  td.innerHTML = `<div class="truncated">${value}</div>`
}

function updateColInfoFn(tbl: "input_tbl" | "output_tbl") {
  if (tbl === "input_tbl") {
    const tblData = tableStore.input_tbl.tbl;
    drawMinimap(tblData.length, tblData[0].length, document.querySelector('svg.tbl-container') as SVGSVGElement, tableStore);
    tableStore.optimizeMiniTempDistance();
    // tableStore.clearStatus("miniHighlight");
    tableStore.initTblInfo(false);
    // tableStore.computeColInfo("output_tbl");
    tableStore.output_tbl.colInfo = [];
    tableStore.spec.matchedInstNum = 0;
  }
  tableStore.computeColInfo(tbl);
}

function resetData() {
  tableStore.input_tbl.tbl = JSON.parse(JSON.stringify(tableStore.currentInitData));
  tableStore.input_tbl.instance.updateData(tableStore.input_tbl.tbl);
  tableStore.input_tbl.instance.render();
  updateColInfoFn("input_tbl");
}

// const handleUploadChange = (info: any) => {
//   if (info.file.status === 'done') {
//     message.success(`${info.file.name} file uploaded successfully`);
//   } else if (info.file.status === 'error') {
//     message.error(`${info.file.name} file upload failed.`);
//   }
// };

const fileList = ref([]);
// const fileList = ref<UploadProps['fileList']>([{
//     uid: '1',
//     name: 'xxx.png',
//     status: 'done',
//     response: 'Server Error 500', // custom error message to show
//     url: 'http://www.baidu.com/xxx.png',
//   },]);
let fileTblData: Table2D = [];

const handleUpload = (request: any) => {
  // console.log(request.file);
  // setTimeout(() => {
  //   request.onSuccess("ok");
  // }, 0);
  try {
    const reader = new FileReader();
    // if (request.file.type === 'text/csv' || request.file.type === 'text/plain') {
    //   reader.onload = (e) => {
    //     console.log(e);
    //     const data = e.target?.result;
    //     parseCsvData(data as string);
    //   }
    //   reader.readAsText(request.file);
    // } else if (request.file.type.endsWith('sheet') || request.file.type.endsWith('excel')) {

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: Table2D = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      // Determine the maximum number of columns
      const maxColumns = Math.max(...rawData.map(row => row.length));

      // Ensure all rows have the same number of columns
      fileTblData = rawData.map(row => {
        while (row.length < maxColumns) {
          row.push(undefined); // Fill missing cells with an empty string or a placeholder
        }
        return row;
      });
      handlePreview()
      request.onSuccess("ok");
      // message.success(`${request.file.name} file uploaded successfully`);
    };
    reader.readAsArrayBuffer(request.file);
  } catch (error) {
    message.error(`${request.file.name} file uploaded failed.\n${error}`);
  }
};

let saveLastCase = ""

const handleRemove = () => {
  tableStore.initTblInfo()
  tableStore.transformTblUpdateRootArea();
  tableStore.currentCase = saveLastCase ? saveLastCase : tableStore.caseList[0];
  saveLastCase = ""
  tableStore.caseList.pop();
};

const handlePreview = () => {
  // executed when file link or preview icon is clicked.
  tableStore.initTblInfo()
  tableStore.input_tbl.tbl = fileTblData;
  tableStore.input_tbl.instance.updateData(fileTblData);
  tableStore.input_tbl.instance.render();
  tableStore.currentInitData = JSON.parse(JSON.stringify(fileTblData));
  tableStore.transformTblUpdateRootArea();
  if (!tableStore.currentCase.startsWith("Custom")) {
    saveLastCase = tableStore.currentCase
  }
  if (!tableStore.caseList.includes("Custom File")) {
    tableStore.caseList.push("Custom File");
  }
  tableStore.currentCase = "Custom File";
  // 清空映射规范
  tableStore.editor.mappingSpec.code = tableStore.editor.mappingSpec.codePref + "[\n  // Please write the specification here\n];"
};

watch(() => tableStore.currentCase, (newVal) => {
  if (newVal.startsWith("Custom")) handlePreview();
  else tableStore.loadCaseData(newVal);
});


// 函数用于将二维数组转换为 CSV 格式
function arrayToCSV(array: Table2D) {
  return array.map(row => row.map(cell => `${cell === undefined ? '' : cell}`).join(',')).join('\n');
}

const handleDownload = () => {
  if (tableStore.output_tbl.cols.length === 0) {
    message.warning('The output table is empty.');
    return;
  }
  const csv = arrayToCSV([tableStore.output_tbl.cols, ...tableStore.output_tbl.tbl]);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tidy table.csv'; // 下载文件的名称
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // 释放内存

  message.success('The output table has been downloaded successfully.');
};

function normalizeSelection(selections: Selection[]): Selection[] {
  return selections.map(([row1, col1, row2, col2]) => {
    // 修正负数坐标为0
    if (row1 < 0) row1 = 0;
    if (col1 < 0) col1 = 0;
    if (row2 < 0) row2 = 0;
    if (col2 < 0) col2 = 0;

    // 确保startRow <= endRow 和 startCol <= endCol
    const startRow = Math.min(row1, row2);
    const endRow = Math.max(row1, row2);
    const startCol = Math.min(col1, col2);
    const endCol = Math.max(col1, col2);

    return [startRow, startCol, endRow, endCol];
  });
}

import { drawMinimap } from '@/utils/minimap';

function initEventsForTbl(tbl: "input_tbl" | "output_tbl") {
  let tblInst1: Handsontable, tblInst2: Handsontable;
  const tbl2 = tbl === "input_tbl" ? "output_tbl" : "input_tbl";
  if (tbl === "input_tbl") {
    tblInst1 = inHotInst;
    tblInst2 = outHotInst;
  } else {
    tblInst1 = outHotInst;
    tblInst2 = inHotInst;
  }
  tblInst1.updateSettings({
    outsideClickDeselects: (targetEle) => {
      const targetClassName = targetEle?.className;
      // if ((targetEle.parentNode?.parentNode as HTMLElement).classList.contains("goToInstance") || (targetEle.parentNode as HTMLElement).classList.contains("goToInstance"))
      if (targetEle.closest(".goToInstance") !== null) {
        if (document.body.style.cursor === 'cell') {
          tableStore.clearStatus("matchArea");
        }
        return true;
      };
      if (targetClassName === "wtHolder") {
        return true;
      }
      if (typeof targetClassName !== "string") {
        tblInst2.updateSettings({ cell: [] });
        return true;
      }
      if (tblInst1 === outHotInst && ["relative", "rowHeader", "current", "truncated"].some((c) => targetClassName.split(" ").includes(c))) {
        // 如果在 input 表格内点击：
        if (document.body.style.cursor !== 'cell') {
          tblInst2.updateSettings({ cell: [] });
        }
      } else {
        tableStore.clearStatus("matchArea");
        tblInst2.updateSettings({ cell: [] });
      }
      tableStore.highlightMinimapCells([]);
      tableStore.clearStatus("tree");

      if (tbl === "input_tbl") {
        if (!(targetClassName.startsWith("mtk") || targetClassName === "view-line"))
          tableStore.editor.mappingSpec.decorations?.clear();
      }

      return true;
    },
  });

  tblInst1.addHook("afterColumnResize", (currentColumn, newSize, isDoubleClick) => {
    // 修改单元格宽度后的回调
    tableStore.computeColInfo(tbl);
  });
  // 因为添加了对tbl的修改监听，所以这些钩子函数可以不用定义
  tblInst1.addHook("afterChange", (changes, source) => {
    // 修改单元格内容后的回调
    if (changes && changes.some(ci => ci[2] !== ci[3])) {
      if (tbl === "input_tbl") {
        // tableStore.clearStatus("miniHighlight");
        tableStore.initTblInfo(false);
        tableStore.computeColInfo("output_tbl");
        tableStore.spec.matchedInstNum = 0;
      }
      tableStore.computeColInfo(tbl);
    }
  });
  tblInst1.addHook("afterCreateRow", () => updateColInfoFn(tbl));
  tblInst1.addHook("afterCreateCol", () => updateColInfoFn(tbl));
  tblInst1.addHook("afterRemoveRow", () => updateColInfoFn(tbl));
  tblInst1.addHook("afterRemoveCol", () => updateColInfoFn(tbl));

  tblInst1.addHook("afterOnCellMouseDown", (e) => {
    tblInst2.updateSettings({ cell: [] });
  });
  tblInst1.addHook("afterOnCellMouseUp", (event, coords, TD) => {
    const selected = normalizeSelection(tblInst1.getSelected() || []);
    // key 表示所选区域，value 表示所选区域所有单元格的坐标
    const { selectedCoords, hightedCells } = tableStore.getHightlightedCells(selected);

    // 打印所有坐标
    // console.log(selectedCoords);

    const cells = tableStore.in_out_mapping(selectedCoords, tbl);
    tableStore.highlightTblCells(tbl2, cells);
    // tableStore.highlightMinimapCells([{ ...coords, className: "posi-mapping" }]);

    if (tbl === "input_tbl") {
      tableStore.highlightMinimapCells(hightedCells);
      // console.log(document.body.style.cursor, tableStore.spec.selectAreaFromNode, tableStore.spec.selectAreaFromLegend.length);
      if (document.body.style.cursor === 'cell') {
        if (tableStore.spec.selectAreaFromNode) {
          // 说明需要重新为某个节点选择区域
          tableStore.tree.instanceIndex = 0;
          tableStore.updateVisTreeAreaBox();
          const selectType = tableStore.spec.selectAreaFromNode;
          const visNode = tableStore.spec.selectNode!.data;
          const nx = visNode.x, ny = visNode.y, nw = visNode.width, nh = visNode.height;
          const [startRow, startCol, endRow, endCol] = selected[0];
          const offsetX = startCol - nx, offsetY = startRow - ny;
          if (selectType.startsWith("3")) {
            // Add Sub-Template Logic
            const width = endCol - startCol + 1;
            const height = endRow - startRow + 1;
            const traverse = (visNode.children && visNode.children.length > 0) ? {} : {
              xDirection: nw >= 2 * width ? 'after' as const : undefined,
              yDirection: nh >= 2 * height ? 'after' as const : undefined
            }
            let extract: any = null, extractColor: string = '';
            const maxCNum = tableStore.findMaxCNumber() + 1;

            switch (selectType) {
              case "3-0":
                // Target Cols - Position Based Logic
                extract = {
                  byPositionToTargetCols: Array.from({ length: width * height }, (_, i) => `C${maxCNum + i}`)
                }
                extractColor = 'positionShallow';
                break;
              case "3-1":
                // Target Cols - Context Based Logic
                extract = {
                  byContext: {
                    position: 'above'
                  }
                }
                extractColor = 'contextShallow';
                break;
              case "3-2":
                // Target Cols - Value Based Logic
                const createExtract = () => {
                  return eval(`currentAreaTbl => {
                  // Please replace the default code with the necessary implementation to complete the function.
                  return currentAreaTbl.flat().map((cell, i) => 'C' + (${maxCNum} + i))
                  }`)
                }
                extract = {
                  byValue: createExtract()
                }
                extractColor = 'valueShallow';
                break;
              case "3-3":
                // Target Cols - No Extract Logic
                extract = undefined
                extractColor = 'nullShallow';
                break;
            }

            const childPattern: TableCanoniserTemplate = {
              match: {
                startCell: {
                  // offsetLayer: "current",
                  // offsetFrom: "topLeft",
                  offsetX: offsetX,
                  offsetY: offsetY
                },
                size: { width, height },
                traverse
              },
              extract
            }

            tableStore.insertNodeOrPropertyIntoSpecs(childPattern, "children");
            tableStore.editor.mappingSpec.highlightCode = [...tableStore.getHighlightCodeStartEndLine(childPattern), extractColor];

          } else if (selectType === "1") {
            // Add Constraints Logic
            const cellValue = inHotInst.getDataAtCell(startRow, startCol);
            const constraint = {
              offsetFrom: "topLeft",
              offsetX,
              offsetY,
              valueCstr: tableStore.getCellDataType(cellValue) // TableCanoniserKeyWords.String,
            }
            tableStore.insertNodeOrPropertyIntoSpecs(constraint, "constraints");
            tableStore.editor.mappingSpec.highlightCode = [...tableStore.getHighlightCodeStartEndLine(constraint, tableStore.getNodebyPath(tableStore.spec.rawSpecs, visNode.path!)), 'selectionShallow']; // `${visNode.type}Shallow`
          }

          tableStore.spec.selectAreaFromNode = "";
          tableStore.clearStatus("matchArea");

        } else if (tableStore.spec.selectAreaFromLegend.length) {
          // 说明从legend处选择区域
          inHotInst.updateSettings({ cell: [] });
          const selectFromLegend = tableStore.spec.selectAreaFromLegend;
          tableStore.spec.selectionsAreaFromLegend.push(selected[0]);
          tableStore.spec.selectionsPath.push([]);
          if (selectFromLegend.length < tableStore.spec.selectionsAreaFromLegend.length) {
            selectFromLegend.push(selectFromLegend[selectFromLegend.length - 1])
          }
          const cells = tableStore.generateHighlightCells(tableStore.spec.selectionsAreaFromLegend, selectFromLegend);
          tableStore.highlightTblCells(tbl, cells);
          // document.body.style.cursor = 'default';
          // document.documentElement.style.setProperty('--custom-cursor', 'default');

          const { specs, newSpec } = tableStore.buildTree(tableStore.spec.selectionsAreaFromLegend, selectFromLegend, tableStore.spec.selectionsPath);

          tableStore.stringifySpec(specs);
          tableStore.editor.mappingSpec.highlightCode = [...tableStore.getHighlightCodeStartEndLine(newSpec, null, specs), `${selectFromLegend[selectFromLegend.length - 1]}Shallow`];
        }
      }
      tableStore.highlightNodes(selected);
    } else {
      tableStore.highlightMinimapCells(cells);
      const newSelections = cells.map(cell => [cell.row, cell.col, cell.row, cell.col] as Selection)
      tableStore.highlightNodes(newSelections);
    }
  });
}

onMounted(() => {

  const proxy = getCurrentInstance()?.proxy as ComponentPublicInstance;
  inHotInst = (proxy.$refs.inputTbl as any).hotInstance as Handsontable;
  outHotInst = (proxy.$refs.outputTbl as any).hotInstance as Handsontable;

  tableStore.input_tbl.instance = inHotInst;
  tableStore.output_tbl.instance = outHotInst;

  initEventsForTbl("input_tbl");
  initEventsForTbl("output_tbl");

  // keepIconsSynchronizedWithTable() { },
  const iconScrolls = document.querySelectorAll('.icons-container .icon-scroll');
  const tblScrolls = document.querySelectorAll('.ht_master .wtHolder');

  iconScrolls.forEach((iconScroll, index) => {
    iconScroll.addEventListener('scroll', () => {
      tblScrolls[index].scrollLeft = iconScroll.scrollLeft;
    });

    tblScrolls[index].addEventListener('scroll', () => {
      iconScroll.scrollLeft = tblScrolls[index].scrollLeft;
    });
  })
});

// function showDropdown() {
//   //   isOpen = true;
// }
// function hideDropdown() {
//   //   isOpen = false;
// }
</script>

<style lang="less">
.ant-upload-wrapper {
  position: relative;

  .ant-upload {
    display: inline-block;
    // margin-right: 60px;
  }

  .ant-upload-list {
    position: absolute;
    top: -11px;
    right: 81px;
    cursor: pointer;
  }

  .ant-upload-list-item-name {
    color: #1677ff;
    padding: 0 0 0 2px !important;
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.handsontable {
  .truncated {
    max-width: 140px; // 会再次基础上加上10px, 应该是有padding
    min-width: 50px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  div.relative,
  td {
    cursor: var(--custom-cursor) !important;
  }

  td.htRight {
    background-color: #3498db;
  }

  td.position {
    color: #fff !important;
    background-color: var(--color-position);
  }

  td.positionShallow {
    color: #fff !important;
    background-color: var(--color-positionShallow);
  }

  td.context {
    color: #fff !important;
    background-color: var(--color-context);
  }

  td.contextShallow {
    color: #fff !important;
    background-color: var(--color-contextShallow);
  }

  td.value {
    color: #fff !important;
    background-color: var(--color-value);
  }

  td.valueShallow {
    color: #fff !important;
    background-color: var(--color-valueShallow);
  }

  td.null {
    color: #fff !important;
    background-color: var(--color-null);
  }

  td.nullShallow {
    color: #fff !important;
    background-color: var(--color-nullShallow);
  }

  td.selection {
    color: #fff !important;
    background-color: var(--color-selection);
  }

  td.selectionShallow {
    color: #fff !important;
    background-color: var(--color-selectionShallow);
  }
}
</style>
