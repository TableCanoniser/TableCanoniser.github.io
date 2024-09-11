import { defineStore } from 'pinia'
import Handsontable from "handsontable";
import * as d3 from 'd3';
import { shallowRef } from 'vue';

import { Table2D, TableCanoniserTemplate, TableCanoniserKeyWords, CellInfo, CellValueType, AreaInfo, completeCellConstraint, CustomError } from "@/table-canoniser/dist/grammar"
import { transformTable, serialize, getCellBySelect, getNodebyPath } from "@/table-canoniser/dist/parser"
import { TreeChart, NodeData } from '@/utils/drawTree';

import { message } from 'ant-design-vue';

import * as monaco from "monaco-editor";
import * as ts from "typescript";
import { typeMapColor, TypeColor } from '@/utils/style';

function replaceEvenSpaces(str: string) {
  // 使用正则表达式匹配连续的空格
  return str.replace(/ {2,}/g, (match) => {
    // 获取连续空格的数量
    const length = match.length;

    // 计算一半的空格数量
    const halfLength = length / 2;

    // 返回一半数量的空格
    return ' '.repeat(halfLength);
  });
}

// 去除所有空格
function removeWhitespace(str: string) {
  return str.replace(/ /g, '') // .replace(/\s+/g, '');  这个会把换行符也去掉
}

function csvToMatrix(csvText: string) {
  // 首先将文本按行分割
  const rows = csvText.trim().split('\n');

  // 然后将每行按逗号分割成数组
  const matrix: Table2D = rows.map(row => row.split(','));

  return matrix;
}

const removeSpaceType = {
  even: replaceEvenSpaces,
  all: removeWhitespace,
}

export interface TblCell {
  row: number;
  col: number;
  className?: string;
}

export interface TblPatternGrid {
  row: number;
  col: number;
  text?: any; // string
  textColor?: string;
  bgColor?: string;
}

/** startRow, startCol, endRow, endCol */
export type Selection = [number, number, number, number];

interface TreeNode {
  [key: string]: any,
  children?: TreeNode[];
}

export interface AreaBox {
  width: number,
  height: number,
  x: number,
  y: number,
  instIndex?: number,
  isDefinedFromSpec?: boolean
}

// type CoordinateMap = Map<number, Map<number, any>>;  // 根据坐标获取某值

export interface VisTreeNode extends TableCanoniserTemplate, AreaBox {
  id?: number,
  type?: "position" | "value" | "context" | "null",
  path?: number[],
  matchs?: AreaBox[],
  currentMatchs?: AreaBox[],
  // currentAreas?: AreaInfo[],
  constrsInfo?: { x: number, y: number, isDefinedFromSpec: boolean, instIndex: number }[][],
  children?: VisTreeNode[]
}

export interface AreaForm {
  offsetLayer: any,
  offsetFrom: any,
  position: {
    x: any,
    y: any
  },
  traverse: {
    xDirection: any,
    yDirection: any
  },
  size: {
    width: any,
    height: any
  }
}

export type ColInfo = {
  width: number,  // column width
  index: number, // column index
  string: number[],
  number: number[],
  none: number[]
}

// define and expose a store
export const useTableStore = defineStore('table', {
  // data
  state() {
    return {
      caseList: shallowRef<string[]>(["1a. university", "1b. university_v", "2. model", "3. phone", "4. bank", "5. payroll", "6. York"]),
      currentCase: "1a. university", // caseList[0],
      currentInitData: shallowRef<Table2D>([]),
      spec: {
        undoHistory: [] as string[],  // 这里不能是 shallowRef，要不然 computed 计算不会被更新
        redoHistory: [] as string[],
        rawSpecs: shallowRef<TableCanoniserTemplate[]>([]),
        visTree: shallowRef<VisTreeNode>({ id: 0, width: 0, height: 0, x: 0, y: 0, type: "null", path: [], children: [] }),
        visTreeMatchPath: shallowRef<{ [key: string]: VisTreeNode }>({}),
        selectNode: shallowRef<NodeData | null>(null),
        selectConstrIndex: -1,
        constrNodeRectClickId: "",
        selectAreaFromNode: "" as "" | "0" | "1" | "2-0" | "2-1" | "2-2" | "2-3" | "3-0" | "3-1" | "3-2" | "3-3" | "4",
        selectAreaFromLegend: shallowRef<TypeColor[]>([]),
        selectionsAreaFromLegend: shallowRef<Selection[]>([]),
        selectionsPath: shallowRef<number[][]>([]),  // 每一个selection在rawSpecs中对应的path
        dragConfigOpen: false,
        // disableGoToInstFlag: true,
        matchedInstNum: 0,
        areaConfig: shallowRef<TableCanoniserTemplate>({
          match: {
            startCell: {},
            size: {},
            traverse: {},
            constraints: [],
          },
          extract: null,
          fill: '',
          children: [],
        }),
        areaFormData: shallowRef<AreaForm>({
          offsetLayer: null,
          offsetFrom: null,
          position: {
            x: null,
            y: null
          },
          traverse: {
            xDirection: null,
            yDirection: null
          },
          size: {
            width: null,
            height: null
          }
        }),
      },
      editor: {
        mappingSpec: {
          code: '',
          codePref: 'const option: TableCanoniserTemplate[] = ',
          codeSuff: '\nreturn option;',
          errorMark: null as monaco.editor.IMarker | null,
          decorations: shallowRef<monaco.editor.IEditorDecorationsCollection | null>(null),
          highlightCode: null as [number, number, string] | null,  // [startLine, endLine, color]
          // language: 'typescript',
          instance: shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null),
          triggerCodeChange: true,
          codeUpdateFromEditor: false,
          autoRun: true
        },
        rootArea: {
          code: '',
          codePref: 'const matchedResult: AreaInfo = ',
          object: shallowRef<AreaInfo | null>(null),
          // language: 'json',
          instance: shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
        },
      },
      input_tbl: {
        instance: {} as Handsontable,
        // cells: [] as [number, number][],  // highlighted cells
        tbl: shallowRef<Table2D>([]),  // 使用 shallowRef 会导致 watch时只对引用本身的变化做出响应，而不会追踪引用对象内部的深层变化。这意味着，当你改变 tbl 的某个单元格的值时，watch 并不会被触发，因为 tbl 引用本身并没有发生变化。但是，ref 性能开销很大
        in2out: shallowRef<{ [key: string]: string[] }>({}),
        in2nodes: shallowRef<{ [key: string]: Set<number> }>({}),  // 'x-y-width-height' -> {node.id} 的映射
        colInfo: shallowRef<ColInfo[]>([]),
      },
      output_tbl: {
        instance: {} as Handsontable,
        // cells: [] as [number, number][], // highlighted cells
        tbl: shallowRef<Table2D>([]),
        cols: shallowRef<string[]>([]),
        out2in: shallowRef<{ [key: string]: string[] }>({}),
        colInfo: shallowRef<ColInfo[]>([]),
      },
      tree: {
        contextMenuVisible: false,
        instanceIndex: -1,
        offset: {
          left: { x: 0, y: 0 },
          right: { x: 0, y: 0 }
        },
        visInst: shallowRef<TreeChart | null>(null),
        tblVisHighlight: null as d3.Selection<SVGGElement, unknown, null, undefined> | null,
        tblVisInfo: shallowRef<AreaBox | null>(null),  // tblTemplate中起始单元格在input tbl中的坐标位置(x, y)，以及单元格的宽高(width, height)
        minimapInstHighlight: null as d3.Selection<SVGGElement, unknown, null, undefined> | null,
        minimapVisInfo: {
          width: 0,
          height: 0
        },
        menuAllList: [
          //   {
          //   key: "0",
          //   label: "Reset Area",
          //   title: "Reset Area",
          //   // icon: () => h(MailOutlined),
          // }, 
          {
            key: "3",
            label: "Add Sub-Pattern",
            title: "Add Sub-Pattern",
            children: [{
              key: "3-0",
              label: "Position",
              title: "Match and Extract by Position",
              // class: "legend-position",
              style: { color: typeMapColor['position'] },  // 使用 style 设置样式
            }, {
              key: "3-1",
              label: "Context",
              title: "Match and Extract by Context",
              style: { color: typeMapColor['context'] },
            }, {
              key: "3-2",
              label: "Value",
              title: "Match and Extract by Value",
              style: { color: typeMapColor['value'] },
            }, {
              key: "3-3",
              label: "Region",
              title: "Match Without Extraction",
              style: { color: typeMapColor['null'] },
            }],
          }, {
            key: "1",
            label: "Add Constraint",
            title: "Add Constraint",
            // icon: () => h(MailOutlined),
            // disabled: true
          }, {
            key: "2",
            label: "Reset Target Cols",
            title: "Reset Target Cols",
            children: [{
              key: "2-0",
              label: "Position",
              title: "Match and Extract by Position",
              // class: "legend-position",
              style: { color: typeMapColor['position'] },  // 使用 style 设置样式
            }, {
              key: "2-1",
              label: "Context",
              title: "Match and Extract by Context",
              style: { color: typeMapColor['context'] },
            }, {
              key: "2-2",
              label: "Value",
              title: "Match and Extract by Value",
              style: { color: typeMapColor['value'] },
            }, {
              key: "2-3",
              label: "Region",
              title: "Match Without Extraction",
              style: { color: typeMapColor['null'] },
            }],
          }, {
            key: "4",
            label: "Delete This Pattern",
            title: "Delete This Pattern.\nShortcut: Delete/Backspace",
            // disabled: true
            // icon: () => h(MailOutlined),
          }, {
            key: "5",
            label: "Delete Constraint",
            title: "Delete Constraint.\nShortcut: Delete/Backspace",
          }],
        menuList: [] as Array<{ [key: string]: any }>,
      }
    }
  },
  // methods
  actions: {
    async loadCaseData(caseN: string) {
      let prompt: string[] = [];
      let case_path = `./${caseN}/`;
      // const begin = Date.now();
      try {
        // Parallel processing of all fetch requests ==> faster: 0.678s vs 0.275s
        const [data_res, spec_res] = await Promise.all([   // , script_res
          fetch(case_path + 'data.csv'),  // 'data.json'
          fetch(case_path + 'spec.js'),
          // fetch(case_path + 'script.py')
        ]);

        // Parallel processing of all text extraction
        const [dataText, specText] = await Promise.all([    // , scriptText
          data_res.ok ? data_res.text() : Promise.resolve(null),
          spec_res.ok ? spec_res.text() : Promise.resolve(null),
          // script_res.ok ? script_res.text() : Promise.resolve(null)
        ]);

        this.initTblInfo();
        this.clearStatus("matchArea");
        this.editor.mappingSpec.errorMark = null;
        this.tree.instanceIndex = -1; // 0;
        this.spec.selectNode = null;
        this.editor.mappingSpec.highlightCode = null;

        if (dataText !== null) {
          this.input_tbl.tbl = csvToMatrix(dataText) // JSON.parse(dataText).input_tbl;
          this.input_tbl.instance.updateData(this.input_tbl.tbl);
          this.currentInitData = csvToMatrix(dataText);
          // 每次都是页面刷新后，所有单元格/列的宽度为50，只有点击一下界面之后，才会突然自动列大小，变成有的列width大一点，有的列width小一点，这是为什么呢
          // 通常是由于Handsontable在初始化时还没有正确计算出表格容器的尺寸，或者在Vue组件生命周期的某个阶段，Handsontable的重新渲染没有正确触发。这个问题可能与表格渲染的时机有关。
          this.input_tbl.instance.render();
          // document.getElementById('system_name')?.click();
        } else {
          prompt.push(`Failed to load data from ${caseN}`);
        }

        if (specText !== null) {
          this.spec.undoHistory = [];
          this.spec.redoHistory = [];
          this.editor.mappingSpec.code = specText;
          // this.transformTblUpdateRootArea();
        } else {
          prompt.push(`Failed to load spec from ${caseN}`);
        }

        // if (scriptText !== null) {
        //   this.editor.transformScript.code = scriptText;
        // } else {
        //   prompt.push(`Failed to load script from ${caseN}`);
        // }
      } catch (error) {
        prompt.push(`Error loading data: ${error}`);
      }
      // const end = Date.now();
      // console.log(`Loaded case ${caseN} in seconds: ${(end - begin) / 1000}`);
      this.currentCase = caseN;
      prompt.forEach((msg) => {
        message.error(msg);
      })
    },

    /**
     * Update visTree's matchs
     */
    traverseTree4UpdateMatchs(nodes: AreaInfo[], instIndex: number = -1) {
      let visNode: VisTreeNode | null = null;
      nodes.forEach((node, index) => {
        const path = node.templateRef.toString()
        const firstLayerFlag = node.templateRef.length === 1;
        const isDefinedFromSpec = firstLayerFlag || node.isDefinedFromSpec
        if (firstLayerFlag) instIndex = index;
        if (!this.spec.visTreeMatchPath.hasOwnProperty(path)) {
          visNode = this.getNodebyPath(this.spec.visTree.children!, node.templateRef) as VisTreeNode;
          if (visNode === null) return;
          this.spec.visTreeMatchPath[path] = visNode;
          visNode.matchs = [{
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            instIndex,
            isDefinedFromSpec
          }];
          // visNode.currentAreas = [node];
          visNode.constrsInfo = [];
          visNode.match?.constraints?.forEach((constraint) => {
            const cellInfoSelections = [];
            const allConstr = completeCellConstraint(constraint);
            const cellInfo = getCellBySelect(allConstr, node, this.editor.rootArea.object!, true);
            if (cellInfo) {
              cellInfoSelections.push({ x: cellInfo.x, y: cellInfo.y, isDefinedFromSpec, instIndex });
            }
            visNode!.constrsInfo!.push(cellInfoSelections);
          })
        } else {
          this.spec.visTreeMatchPath[path].matchs!.push({
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            instIndex,
            isDefinedFromSpec
          });
          // this.spec.visTreeMatchPath[path].currentAreas!.push(node);
          visNode = this.spec.visTreeMatchPath[path];
          visNode.match?.constraints?.forEach((constraint, ci) => {
            const cellInfoSelections = visNode!.constrsInfo![ci];
            const allConstr = completeCellConstraint(constraint);
            const cellInfo = getCellBySelect(allConstr, node, this.editor.rootArea.object!, true);
            if (cellInfo) {
              cellInfoSelections.push({ x: cellInfo.x, y: cellInfo.y, isDefinedFromSpec, instIndex });
            }
          })
        }
        this.traverseTree4UpdateMatchs(node.children, instIndex);
      })
    },

    /**
     * Update visTree's AreaBox properties
     */
    updateVisTreeAreaBox(node: VisTreeNode | null = null) {
      if (node === null) {
        if (this.spec.visTree.children!.length === 0) return;
        node = this.spec.visTree.children![0];
      }
      if (node.matchs === undefined) return;
      const matchedInsts = node.matchs.filter((match) => match.instIndex === this.tree.instanceIndex);
      node.currentMatchs = [];
      let isDefinedFromSpecInst: any = null;
      matchedInsts.forEach((match) => {
        if (node!.currentMatchs!.some((cm) => cm.x === match.x && cm.y === match.y)) return;
        const newMatch: AreaBox = { ...match };
        if (match.isDefinedFromSpec) {
          if (isDefinedFromSpecInst === null) {
            isDefinedFromSpecInst = newMatch;
          } else {
            newMatch.isDefinedFromSpec = false;
          }
        }
        node!.currentMatchs!.push(newMatch);
      })

      if (isDefinedFromSpecInst !== null) {
        node.x = isDefinedFromSpecInst.x;
        node.y = isDefinedFromSpecInst.y;
        node.width = isDefinedFromSpecInst.width;
        node.height = isDefinedFromSpecInst.height;
      } else if (node.currentMatchs.length > 0) {
        const areaBox = node.currentMatchs[0];
        node.x = areaBox.x;
        node.y = areaBox.y;
        node.width = areaBox.width;
        node.height = areaBox.height;
      }

      if (node.children) {
        node.children.forEach((child) => {
          this.updateVisTreeAreaBox(child);
        })
      }
    },

    goToInstance(instance: number) {
      if (this.spec.matchedInstNum === 0) {
        // message.error("No matched instance!");
        return;
      }
      if (isNaN(instance)) {
        message.error("The input number is invalid!");
        return;
      }
      instance = Math.round(instance);
      const maxInst = this.spec.visTree.children![0].matchs!.length;
      if (instance < 0 || instance >= maxInst) {
        message.error(`The input number is out of range: [1, ${maxInst}]`);
        return;
      }
      this.tree.instanceIndex = instance;
      this.updateVisTreeAreaBox();
      this.hightlightViewsAfterClickNode(this.spec.selectNode!.data);

      if (this.tree.minimapInstHighlight && this.tree.minimapInstHighlight.selectAll('rect').size() === 0) {
        this.highlightMinimapInsts();
      };

      const hightlight = this.tree.minimapInstHighlight!;
      hightlight.selectAll('rect').attr('stroke', 'none');
      hightlight.select(`rect:nth-child(${this.tree.instanceIndex + 1})`).attr('stroke', typeMapColor.selection);

      this.updateCurve();

    },
    highlightMinimapInsts() {
      const hightlight = this.tree.minimapInstHighlight!;
      const visInfo = this.tree.minimapVisInfo!;
      const tableStore = this;

      hightlight.selectAll('rect').remove();
      if (this.spec.visTree.children!.length === 0 || this.spec.visTree.children![0].matchs === undefined) return;
      hightlight.raise().selectAll('rect').data(this.spec.visTree.children![0].matchs!.map((d, i) => ({ x: d.x, y: d.y, width: d.width, height: d.height, index: i })))
        .enter().append('rect') // .classed('grid-inst', true)
        .attr('x', d => d.x * visInfo.width)
        .attr('y', d => d.y * visInfo.height)
        .attr('width', d => d.width * visInfo.width)
        .attr('height', d => d.height * visInfo.height)
        .attr('fill', 'rgba(0, 0, 0, 0)')  // 设置透明，如果为 none，则不会有交互事件
        .attr('stroke', (d, i) => {
          if (i === this.tree.instanceIndex) {
            return typeMapColor.selection;
          } else {
            return 'none';
          }
        })
        .attr('stroke-width', 1.5)
        .on('mouseover', function (event: any, d) {
          d3.select(this).attr('stroke', typeMapColor.selection);
        })
        .on('mouseout', function (event, d) {
          if (d.index !== tableStore.tree.instanceIndex)
            d3.select(this).attr('stroke', 'none');
        })
        .on('click', function (event: any, d) {
          // tableStore.goToInstance(d.index - tableStore.tree.instanceIndex);
          tableStore.goToInstance(d.index);
        })
        .append('svg:title').text((d, i) => `The ${tableStore.numberToOrdinal(i + 1)} instance.\nArea Box:\n · x: ${d.x}\n · y: ${d.y}\n · width: ${d.width}\n · height: ${d.height}`);
    },

    optimizeMiniTempDistance(maxDistance: number = 120) {
      try {
        const miniG = d3.select('g.left g.matrix')
        const miniWidth = (miniG.node() as SVGGraphicsElement).getBBox().width
        const distanceGap = this.tree.offset.right.x - this.tree.offset.left.x - miniWidth - maxDistance;

        if (distanceGap > 0) {
          this.tree.offset.left.x += distanceGap;
          miniG.attr('transform', `translate(${this.tree.offset.left.x}, ${this.tree.offset.left.y})`);
        }
      } catch (e) {
        console.error(e);
      }
    },

    updateCurve() {
      try {
        const currentInstRect = this.tree.minimapInstHighlight!.select(`rect:nth-child(${this.tree.instanceIndex + 1})`);
        const instRightX = +currentInstRect.attr('x') + +currentInstRect.attr('width');

        const instTopY = +currentInstRect.attr('y');
        const instBottomY = +currentInstRect.attr('y') + +currentInstRect.attr('height');


        const tempRect = d3.select('rect.tbl-template-cell')
        const tempLeftX = +tempRect.attr('x');
        const tempTopY = +tempRect.attr('y');
        const tempBottomY = +tempRect.attr('y') + +tempRect.attr('height') * this.spec.visTree.children![0].height;

        const miniG = d3.select('g.left g.matrix')
        const tempG = d3.select('g.right g.tbl-template')

        // 获取当前变换
        const instTransform = (miniG.node() as SVGGraphicsElement).getCTM()!;
        const tempTransform = (tempG.node() as SVGGraphicsElement).getCTM()!;

        const applyTransform = (x: number, y: number, transform: DOMMatrix) => {
          return {
            x: transform.a * x + transform.e,
            y: transform.d * y + transform.f
          }
        }

        // 计算变换后的点
        const rectTopRight = applyTransform(instRightX, instTopY, instTransform);
        const rectBottomRight = applyTransform(instRightX, instBottomY, instTransform);
        const rectRightTopLeft = applyTransform(tempLeftX, tempTopY, tempTransform);
        const rectRightBottomLeft = applyTransform(tempLeftX, tempBottomY, tempTransform);

        const lineGenerator = d3.line().curve(d3.curveCatmullRom);
        // 绘制曲线
        const pathData1 = lineGenerator([
          [rectTopRight.x, rectTopRight.y],
          [rectRightTopLeft.x, rectRightTopLeft.y]
        ]);

        const pathData2 = lineGenerator([
          [rectBottomRight.x, rectBottomRight.y],
          [rectRightBottomLeft.x, rectRightBottomLeft.y]
        ]);

        d3.select('path.top-line').attr("d", pathData1);
        d3.select('path.bottom-line').attr("d", pathData2);
      }
      catch (e) {
        d3.select('path.top-line').attr("d", "");
        d3.select('path.bottom-line').attr("d", "");
      }
    },

    /**
     * Update in2nodes and selectionsAreaFromLegend and selectAreaFromLegend of each node
     */
    traverseTree4UpdateIn2Nodes(nodes: VisTreeNode[], parentPath: number[] = [], idCounter: [number] = [1]) {
      const in2nodes = this.input_tbl.in2nodes;
      nodes.forEach((node, index) => {
        node.id = idCounter[0]++;
        // 构建当前节点的 path
        const currentPath = [...parentPath, index];
        node.path = currentPath;

        const areaKey = `${node.x}-${node.y}-${node.width}-${node.height}`;

        // 给每个node赋予type，并计算selectionsAreaFromLegend和selectAreaFromLegend
        node.type = "null";
        if (node.extract !== undefined && node.extract != null) {
          if (node.extract.byValue !== undefined) {
            node.type = "value";
          } else if (node.extract.byContext !== undefined) {
            node.type = "context";
          } else if (node.extract.byPositionToTargetCols !== undefined) {
            node.type = "position";
          }
        }
        this.spec.selectionsAreaFromLegend.push([node.y, node.x, node.y + node.height - 1, node.x + node.width - 1]);
        this.spec.selectAreaFromLegend.push(node.type)
        this.spec.selectionsPath.push(node.path);

        if (in2nodes.hasOwnProperty(areaKey)) {
          in2nodes[areaKey].add(node.id!);
        } else {
          in2nodes[areaKey] = new Set([node.id!]);
        }
        node.matchs?.forEach((match) => {
          const { x, y, width, height } = match;
          const areaKey = `${x}-${y}-${width}-${height}`;
          if (in2nodes.hasOwnProperty(areaKey)) {
            in2nodes[areaKey].add(node.id!);
          } else {
            in2nodes[areaKey] = new Set([node.id!]);
          }
        })
        if (node.children) this.traverseTree4UpdateIn2Nodes(node.children, currentPath, idCounter);
      })
    },

    transformTblUpdateRootArea(specs: TableCanoniserTemplate[] = []) {
      const { rootArea, tidyData, executionMessages } = transformTable(this.input_tbl.tbl, specs);
      // this.editor.rootArea.codePref + JSON.stringify(rootArea)
      this.editor.rootArea.object = rootArea;
      const strSpec = serialize(rootArea);
      // 正则表达式匹配 JSON 对象中的键（包括可能的空白字符和引号）
      const removeQuotesFromKeysRegex = /"(\w+)":/g;
      this.editor.rootArea.code = this.editor.rootArea.codePref + strSpec.replace(removeQuotesFromKeysRegex, '$1:');
      // this.editor.rootArea.instance!.setValue(this.editor.rootArea.code);
      this.traverseTree4UpdateMatchs(rootArea.children);
      this.tree.instanceIndex = 0;
      this.updateVisTreeAreaBox();
      this.input_tbl.in2nodes = {};
      this.spec.selectAreaFromLegend = []
      this.spec.selectionsAreaFromLegend = []
      this.spec.selectionsPath = []
      // this.editor.mappingSpec.highlightCode = null;
      this.traverseTree4UpdateIn2Nodes(this.spec.visTree.children!);

      if (executionMessages.length > 0) {
        executionMessages.forEach((msg) => {
          // console.log(msg);
          const currentNode: TableCanoniserTemplate = this.getNodebyPath(this.spec.rawSpecs, msg.data.path)
          if (msg.type === "MismatchNumberOfCells") {
            currentNode.extract = msg.data.code
          }
          const highlightCode: [number, number, string] = [...this.getHighlightCodeStartEndLine(msg.data.code, currentNode), 'selectionShallow'];

          if (this.editor.mappingSpec.highlightCode === null) {
            this.editor.mappingSpec.highlightCode = highlightCode;
          }

          const startLine = highlightCode[0];
          const endLine = highlightCode[1];

          message.warning(`${msg.type} warning on lines: ${startLine}-${endLine}\n` + msg.message);

        })
        this.editor.mappingSpec.triggerCodeChange = false; // 下面的代码修改不会触发 handleCodeChange 函数
        this.stringifySpec();
      }

      return tidyData;
    },

    generateHighlightCells(selected: Selection[], classNames: string[] = []): TblCell[] {
      const cells: TblCell[] = [];
      if (classNames.length === 0) {
        classNames = Array(selected.length).fill("null");
      }
      selected.forEach((range, ri) => {
        for (let row = range[0]; row <= range[2]; row++) {
          for (let col = range[1]; col <= range[3]; col++) {
            cells.push({ row, col, className: classNames[ri] });
          }
        }
      });
      return cells;
    },

    highlightTblCells(tbl: "input_tbl" | "output_tbl", cells: TblCell[], coords: [number, number][] | null = null, rowFlag = true, colFlag = true) {
      this[tbl].instance.updateSettings({ cell: cells });
      if (coords === null) {
        coords = cells!.map((c) => [c.row, c.col] as [number, number]);
      }
      if (coords.length) {
        let { topLeft, rowSize, colSize } = this.startPoint(coords);
        // 滚动到中间位置
        const visibleRows = this[tbl].instance.countVisibleRows();
        const visibleCols = this[tbl].instance.countVisibleCols();
        this[tbl].instance.scrollViewportTo({
          row: rowFlag ? (rowSize === 1 ? Math.max(0, topLeft[0] - Math.floor(visibleRows / 2)) : Math.max(0, topLeft[0] - 2)) : undefined,
          col: colFlag ? (colSize === 1 ? Math.max(0, topLeft[1] - Math.floor(visibleCols / 2)) : Math.max(0, topLeft[1] - 1)) : undefined,
          verticalSnap: "top",
          horizontalSnap: "start",
        });
      }
    },

    highlightMinimapCells(cells: TblCell[], clear = true) {
      if (clear) d3.selectAll('g.matrix rect.grid-cell').attr('class', 'grid-cell');
      cells.forEach((cell) => {
        if (cell.className) {
          d3.select(`g.matrix #grid-${cell.row}-${cell.col}`).raise()
            .classed(cell.className, true)
        }
      });
    },



    hightlightViewsAfterClickNode(visData: VisTreeNode) {
      const matchArea: Array<[number, number, number, number]> = [];
      visData.matchs?.forEach((match) => {
        const { x, y, width, height } = match;
        matchArea.push([y, x, y + height - 1, x + width - 1]);
      })
      let allHightedInCells: TblCell[] = [];
      let allHightedOutCells: TblCell[] = [];
      if (matchArea.length > 0) {
        const { selectedCoords, hightedCells } = this.getHightlightedCells(matchArea, `${visData.type}Shallow`);
        allHightedInCells = allHightedInCells.concat(hightedCells);
        const cells = this.in_out_mapping(selectedCoords, "input_tbl", `${visData.type}Shallow`);
        allHightedOutCells = allHightedOutCells.concat(cells);
        this.highlightMinimapCells(hightedCells);
      }

      const selected: Array<[number, number, number, number]> = [[visData.y, visData.x, visData.y + visData.height - 1, visData.x + visData.width - 1]];
      const { selectedCoords, hightedCells } = this.getHightlightedCells(selected, visData.type!);
      allHightedInCells = allHightedInCells.concat(hightedCells);
      this.highlightTblCells("input_tbl", allHightedInCells, Object.values(selectedCoords)[0]);
      const cells = this.in_out_mapping(selectedCoords, "input_tbl", visData.type);
      allHightedOutCells = allHightedOutCells.concat(cells);
      const coordsOut = cells.map((c) => [c.row, c.col] as [number, number]);
      this.highlightTblCells("output_tbl", allHightedOutCells, coordsOut);
      this.highlightMinimapCells(hightedCells, matchArea.length === 0);
      // 在 D3.js 中，使用 .classed() 方法为元素添加类时，如果一个元素同时拥有多个类，CSS 样式的优先级依赖于 CSS 样式表中的定义顺序，而不是你通过 D3.js 添加类的顺序。

      this.input_tbl.instance.deselectCell();
      this.output_tbl.instance.deselectCell();
    },

    in_out_mapping(selectedCoords: { [key: string]: [number, number][] }, type: "input_tbl" | "output_tbl", className: string = "selection") {
      const posi_mapping = type === "input_tbl" ? this.input_tbl.in2out : this.output_tbl.out2in;
      if (Object.keys(posi_mapping).length === 0) {
        return [];
      }
      let cells: TblCell[] = [];
      let posi: string[] = [];
      for (let range in selectedCoords) {
        selectedCoords[range].forEach((pi) => {
          posi = posi.concat(posi_mapping[`[${pi[0]},${pi[1]}]`]);
        });
      }
      // console.log(posi, posi_mapping);
      const recordPis: string[] = []
      if (posi) {
        posi.forEach((pi) => {
          if (pi && pi.startsWith("[") && pi.endsWith("]") && !recordPis.includes(pi)) {
            recordPis.push(pi);
            let pi_n = JSON.parse(pi) as [number, number];
            cells.push({ row: pi_n[0], col: pi_n[1], className });
          }
        });
      }
      return cells;
    },

    doRectanglesIntersect(rect1: AreaBox, rect2: AreaBox): boolean {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    },

    // 判断区域 A 是否包含区域 B
    isRectanglesContained(parent: Selection, child: Selection): boolean {
      const [pStartRow, pStartCol, pEndRow, pEndCol] = parent;
      const [cStartRow, cStartCol, cEndRow, cEndCol] = child;

      return (
        pStartRow <= cStartRow &&
        pStartCol <= cStartCol &&
        pEndRow >= cEndRow &&
        pEndCol >= cEndCol
      );
    },

    findMaxCNumber(arr: any[] | null = null) {
      if (arr === null) arr = this.output_tbl.cols;

      let maxNumber = 0;

      arr.forEach(ele => {
        // 使用正则表达式匹配以 "C" 开头并以数字结尾的字符串
        if (typeof ele !== 'string') return;
        const match = ele.match(/^C(\d+)$/);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      });

      // 如果未找到匹配的字符串，返回 null 或 -1 等
      return maxNumber;
    },

    buildTree(selections: Selection[], types: string[], paths: number[][]) {
      const rootNodes: TreeNode[] = [];

      const insertNode = (parent: TreeNode, child: TreeNode): boolean => {
        if (!parent.children) {
          parent.children = [];
        }
        // 检查子节点是否已经包含了当前节点
        for (const existingChild of parent.children) {
          if (this.isRectanglesContained(existingChild.selection, child.selection)) {
            return insertNode(existingChild, child);
          }
        }
        // 如果没有包含的子节点，将其添加为直接子节点
        parent.children.push(child);
        return true;
      }

      for (let i = 0; i < selections.length; i++) {
        const selection = selections[i];
        const newNode: TreeNode = { type: types[i], selection, path: paths[i] };

        let added = false;
        for (const rootNode of rootNodes) {
          if (this.isRectanglesContained(rootNode.selection, selection)) {
            added = insertNode(rootNode, newNode);
            break;
          }
        }

        if (!added) {
          rootNodes.push(newNode);
        }
      }
      const specs: TableCanoniserTemplate[] = [];
      const addedSpec: [any] = [null];
      this.traverseTree4buildSpecs(rootNodes, specs, [0, 0, this.input_tbl.tbl.length - 1, this.input_tbl.tbl[0].length - 1], addedSpec);
      return { rootNodes, specs, newSpec: addedSpec[0] };
    },

    traverseTree4buildSpecs(nodes: TreeNode[], specs: TableCanoniserTemplate[], pSelection: Selection, addedSpec: [any]) {
      const px = pSelection[1], py = pSelection[0];
      const pw = pSelection[3] - px + 1, ph = pSelection[2] - py + 1;
      nodes.forEach((node) => {

        const newSpec: TableCanoniserTemplate = {};
        const { selection, type } = node;

        if (node.path.length > 0) {
          const targetNode = this.getNodebyPath(this.spec.rawSpecs, node.path);
          this.copyAttributes(targetNode!, newSpec, ['match', 'extract', 'fill']);
        } else {

          const [startRow, startCol, endRow, endCol] = selection;
          const width = endCol - startCol + 1;
          const height = endRow - startRow + 1;
          const traverse = nodes.length > 1 ? {} : {
            xDirection: pw >= 2 * width ? 'after' as const : undefined,
            yDirection: ph >= 2 * height ? 'after' as const : undefined
          }

          newSpec.match = {
            startCell: { offsetX: startCol - px, offsetY: startRow - py },
            size: { width, height },
            traverse
          }

          const maxCNum = this.findMaxCNumber() + 1;

          switch (type) {
            case "position":
              newSpec.extract = {
                // byPositionToTargetCols: Array.from({ length: width * height }, (_, _i) => `C${++colCount}`)
                byPositionToTargetCols: Array.from({ length: width * height }, (_, i) => `C${maxCNum + i}`)
              }
              break;
            case "context":
              newSpec.extract = {
                byContext: {
                  position: 'above'
                }
              }
              break;
            case "value":
              const createExtract = () => {
                return eval(`currentAreaTbl => {
                  // Please replace the default code with the necessary implementation to complete the function.
                  return currentAreaTbl.flat().map((cell, i) => 'C' + (${maxCNum} + i))
                  }`)
              }
              newSpec.extract = {
                byValue: createExtract()
              }
              break;
            // case "null": 
            // default:
            //   break;
          }
          addedSpec[0] = newSpec;
        }

        if (node.children) {
          newSpec.children = [];
          this.traverseTree4buildSpecs(node.children, newSpec.children, selection, addedSpec);
        }
        specs.push(newSpec);
      })
    },



    highlightNodes(selected: Selection[]) {
      const highlightNodesId: Set<number> = new Set();
      selected.forEach(range => {
        const y = range[0];
        const x = range[1];
        const height = range[2] - range[0] + 1;
        const width = range[3] - range[1] + 1;

        const rect1: AreaBox = { x, y, width, height };

        for (let keyArea in this.input_tbl.in2nodes) {
          const [x, y, width, height] = keyArea.split('-').map((n) => Number(n));
          // console.log(rect1, keyArea, this.doRectanglesIntersect(rect1, { x, y, width, height }));
          if (this.doRectanglesIntersect(rect1, { x, y, width, height })) {
            this.input_tbl.in2nodes[keyArea].forEach((id) => {
              highlightNodesId.add(id);
            })
          }
        }
      });
      d3.selectAll('.type-node').classed('selection', false);
      for (let id of highlightNodesId) {
        // console.log(`.type-node.node-rect-${id}`);
        d3.select(`.type-node.node-rect-${id}`).classed("selection", true);
      }
      return highlightNodesId;
    },

    highlightTblTemplate(areas: AreaBox[]) {
      try {
        const highlight = this.tree.tblVisHighlight!;  // .tbl-container .tbl-template-highlight
        const tblVisInfo = this.tree.tblVisInfo!;

        areas.forEach((area) => {
          if (area.x === undefined || area.y === undefined || area.width === undefined || area.height === undefined) {
            return
          }
          highlight.raise().append('rect')
            .attr('x', (area.x - tblVisInfo.x) * tblVisInfo.width)
            .attr('y', (area.y - tblVisInfo.y) * tblVisInfo.height)
            .attr('width', area.width * tblVisInfo.width)
            .attr('height', area.height * tblVisInfo.height)
            .attr('fill', 'none')
            .attr('stroke', typeMapColor.selection)
            .attr('stroke-width', 3)
            .attr("stroke-dasharray", area.isDefinedFromSpec ? "0" : "6,6");
        });
      } catch (e) {
        console.log(e);
      }
    },

    /*
    highlightNodes(selected: Selection[]) {
      const highlightNodesId: Set<number> = new Set();
      selected.forEach(range => {
        let startRow = range[0] < 0 ? 0 : range[0];
        let startCol = range[1] < 0 ? 0 : range[1];
        let endRow = range[2];
        let endCol = range[3];
    
        // 遍历行
        for (let row = startRow; row <= endRow; row++) {
          // 遍历列
          for (let col = startCol; col <= endCol; col++) {
            // 遍历 visTree
            const nodes = JSON.parse(JSON.stringify(this.spec.visTree.children!));
            while (nodes.length) {
              const node = nodes.shift()
              if (!node) continue;
              console.log(row, col, node.y, node.height, node.x, node.width);
              if (row >= node.y && row < node.y + node.height && col >= node.x && col < node.x + node.width) {
                highlightNodesId.add(node.id);
              }
              if (node.children) nodes.push(...node.children);
            }
          }
        }
      })
      d3.selectAll('.type-node').classed('selection', false);
      for (let id of highlightNodesId) {
        console.log(`.type-node.node-rect-${id}`);
        d3.select(`.type-node.node-rect-${id}`).classed("selection", true);
      }
    },
    */

    getHightlightedCells(selected: Selection[], className: string = "selection") {
      let selectedCoords: { [key: string]: [number, number][] } = {};
      let hightedCells: { row: number, col: number, className: string }[] = [];
      // 遍历选定区域
      selected.forEach(range => {
        const startRow = range[0];
        const startCol = range[1];
        const endRow = range[2];
        const endCol = range[3];

        selectedCoords[range.toString()] = [];
        // 遍历行
        for (let row = startRow; row <= endRow; row++) {
          // 遍历列
          for (let col = startCol; col <= endCol; col++) {
            // 将坐标添加到数组中
            selectedCoords[range.toString()].push([row, col]);
            hightedCells.push({ row, col, className });
          }
        }
      });
      return { selectedCoords, hightedCells };
    },

    grid_cell_click(cell: TblCell, className: string = "selection") {
      const cells: TblCell[] = [{ ...cell, className }];
      this.highlightTblCells("input_tbl", cells);
      const outTblCells = this.in_out_mapping({ "0": [[cell.row, cell.col]] }, "input_tbl", className);
      this.highlightTblCells("output_tbl", outTblCells);
    },

    startPoint(points: [number, number][]) {
      let topLeft = points[0];
      const rows = new Set([topLeft[0]]);
      const cols = new Set([topLeft[1]]);

      for (let i = 1; i < points.length; i++) {
        let current = points[i];
        rows.add(current[0]);
        cols.add(current[1]);
        if (
          current[0] < topLeft[0] ||
          (current[0] === topLeft[0] && current[1] < topLeft[1])
        ) {
          topLeft = current;
        }
      }

      return {
        topLeft,
        rowSize: rows.size,
        colSize: cols.size,
      };
    },

    prepareDataAfterCodeChange() {
      const codeFormat = "Example format:\n" + this.editor.mappingSpec.codePref + "[\n // Please write the specification here\n];"
      try {
        // Step 1: update specs, including rawSpecs and visTree
        // let code = this.editor.mappingSpec.instance!.getValue();
        let code = this.editor.mappingSpec.code;
        if (code.trim() === "") {
          message.error("Empty code!\nPlease provide your code input. " + codeFormat);
          return false;
        };
        code += this.editor.mappingSpec.codeSuff;
        const result = ts.transpileModule(code, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2015,
            module: ts.ModuleKind.CommonJS
          }
        })
        // console.log(result.outputText);
        // const specification: TableCanoniserTemplate = eval(code);
        const evalFunction = new Function('TableCanoniserKeyWords', result.outputText);
        const specs: TableCanoniserTemplate[] = evalFunction(TableCanoniserKeyWords);
        if (Array.isArray(specs) === false) {
          message.error("Invalid code!\nPlease provide your code input. " + codeFormat);
          return false;
        }
        this.spec.rawSpecs = specs;
        this.spec.visTree.children = JSON.parse(JSON.stringify(specs, (key, value) => typeof value === 'function' ? 'function' : value)); // cloneDeep(specs);
        // this.spec.visTree.children!.forEach((spec) => {
        //   if (!spec.hasOwnProperty('children')) {
        //     spec.children = [];
        //   }
        // })


        // Step 2: highlightCode
        // if (this.editor.mappingSpec.highlightCode) {
        //   console.log('prepareDataAfterCodeChange-highlightCode', this.editor.mappingSpec.highlightCode);
        //   this.highlightCode(...this.editor.mappingSpec.highlightCode);
        //   this.editor.mappingSpec.highlightCode = null;
        // }

        // Step 3: update visTree's AreaBox properties
        // const { rootArea } = transformTable(this.input_tbl.tbl, this.spec.rawSpecs, false);
        // console.log(rootArea);
        // console.log(rootArea, this.spec.visTree, this.spec.rawSpecs, this.input_tbl.tbl[0]);
        // this.copyTreeAttributes(rootArea, this.spec.visTree);
        // console.log(rootArea, this.spec.visTree);

        // Step 4: update in2nodes
        /*
        this.input_tbl.in2nodes = {};
        this.spec.selectAreaFromLegend = []
        this.spec.selectionsAreaFromLegend = []
        this.spec.selectionsPath = []
        this.traverseTree4UpdateIn2Nodes(this.spec.visTree.children!);*/
        return true
      }
      catch (e: any) {
        if (e.message.includes("option")) {
          message.error(e + "\n" + codeFormat);
        }
        else message.error(`Failed to parse the specification:\n ${e}`);
        return false;
      }
    },

    numberToOrdinal(num: number) {
      let suffix = "th";

      if (num % 100 >= 11 && num % 100 <= 13) {
        suffix = "th";
      } else {
        switch (num % 10) {
          case 1:
            suffix = "st";
            break;
          case 2:
            suffix = "nd";
            break;
          case 3:
            suffix = "rd";
            break;
        }
      }

      return num + suffix;
    },

    checkGrammarError() {
      const markers = monaco.editor.getModelMarkers({});
      if (markers.length > 0) {
        markers.forEach((marker) => {
          if (marker.code != "6133") {
            // "‘<name>’ is declared but its value is never read" 错误不会被提示
            this.editor.mappingSpec.errorMark = marker;
            return
          }
        })
      } else {
        this.editor.mappingSpec.errorMark = null
      }
    },

    transformTablebyCode() {
      if (this.editor.mappingSpec.errorMark !== null) {
        const marker = this.editor.mappingSpec.errorMark;
        message.error(`Invalid syntax at Line ${marker.startLineNumber}, Column ${marker.startColumn}:\n ${marker.message}`);
        return false;
      }
      let messageContent = ''
      try {
        const specs = this.spec.rawSpecs;
        // this.stringifySpec(); // 更新(格式化) editor.mappingSpec.code
        this.spec.visTreeMatchPath = {};
        const tidyData = this.transformTblUpdateRootArea(specs);
        this.initTblInfo(false);
        // this.tree.visInst?.render();

        this.spec.matchedInstNum = 0;
        this.spec.visTree.children?.forEach((spec, index) => {
          if (index) messageContent += '\n';
          else if (spec.matchs) {
            this.spec.matchedInstNum = spec.matchs.length;
          }
          if (spec.matchs) {
            if (spec.matchs.length > 1) {
              messageContent += `For the ${this.numberToOrdinal(index + 1)} template, ${spec.matchs.length} instances are matched.`
            } else if (spec.matchs.length === 1) {
              messageContent += `For the ${this.numberToOrdinal(index + 1)} template, only one instance is matched.`
            } else {
              messageContent += `For the ${this.numberToOrdinal(index + 1)} template, no instance is matched.`
            }
          } else {
            messageContent += `For the ${this.numberToOrdinal(index + 1)} template, no instance is matched.`
          }
        })

        if (Object.keys(tidyData).length === 0) {
          if (messageContent) messageContent += '\n';
          messageContent += 'The output table is empty based on the specification.';
          // this.tree.instanceIndex = -1;
          // return;
        }
        message.info(messageContent)

        // 将tidyData转换为output_tbl.tbl，注意数据格式
        this.derivePosiMapping(tidyData);
        // console.log(this.output_tbl.tbl, this.output_tbl.cols);
        this.output_tbl.instance.updateData(this.output_tbl.tbl);
        this.output_tbl.instance.updateSettings({ colHeaders: this.output_tbl.cols });
        // this.output_tbl.instance.render();

        // this.tree.minimapInstHighlight!.select('rect:nth-child(1)').attr('stroke', typeMapColor.selection);
        this.highlightMinimapInsts();
        return true
      } catch (e) {
        if (e instanceof CustomError) {
          messageContent = `Failed to transform the table based on the specification:\n ${e}`
        } else {
          messageContent = `Failed to parse the specification:\n ${e}`
        }
        message.error(messageContent);
        console.error(e);
        return false
      }
    },

    derivePosiMapping(outTbl: { [key: string]: CellInfo[] }) {
      const cols = Object.keys(outTbl);
      this.output_tbl.cols = cols;
      // const numRows = outTbl[cols[0]].length;
      const numRows = Math.max(...cols.map(col => outTbl[col].length));

      // Create the in_out mapping
      for (let i = 0; i < numRows; i++) {
        const row: CellValueType[] = [];
        // this.output_tbl.out2in.rows.push([]);
        for (let j = 0; j < cols.length; j++) {
          const col = cols[j];
          let cell: CellInfo;
          if (outTbl[col].length <= i) {
            cell = { x: -1, y: -1, value: undefined };
          } else {
            cell = outTbl[col][i];
          }
          row.push(cell.value);
          let inPosi = `[${cell.y},${cell.x}]`;
          const outPosi = `[${i},${j}]`;
          // console.log(inPosi, outPosi);
          if (cell.x < 0 || cell.y < 0) {
            inPosi = '';
          } else {
            if (this.input_tbl.in2out.hasOwnProperty(inPosi)) {
              this.input_tbl.in2out[inPosi].push(outPosi);
            } else {
              this.input_tbl.in2out[inPosi] = [outPosi];
            }
          }

          if (this.output_tbl.out2in.hasOwnProperty(outPosi)) {
            this.output_tbl.out2in[outPosi].push(inPosi);
          } else {
            this.output_tbl.out2in[outPosi] = [inPosi];
          }
        }
        this.output_tbl.tbl.push(row);
      }
    },

    generateGrid(rows: number, cols: number): TblPatternGrid[] {
      const grid: TblPatternGrid[] = [];
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          grid.push({ row: i, col: j });
        }
      }
      return grid;
    },

    computeTblPatternGrid() {
      // const firstNode: VisTreeNode = JSON.parse(JSON.stringify(this.spec.visTree.children![0], function (key, value) {
      //   if (key === 'currentAreas') return undefined;
      //   return value;
      // }));
      // const firstNode: VisTreeNode = JSON.parse(JSON.stringify(this.spec.visTree.children![0]));
      const firstNode = this.spec.visTree.children![0];

      const grids = this.generateGrid(firstNode.height, firstNode.width);
      const nodes = [firstNode];
      // const box: AreaBox = { width: firstNode.width, height: firstNode.height, x: firstNode.x, y: firstNode.y };
      // const box: AreaBox = (({ width, height, x, y }) => ({ width, height, x, y }))(firstNode); // { ...firstNode };
      const box: Selection = [firstNode.x, firstNode.y, firstNode.x + firstNode.width, firstNode.y + firstNode.height];

      while (nodes.length) {
        const node = nodes.shift() as VisTreeNode;

        // const xDirection = node.match?.traverse?.xDirection;
        // const yDirection = node.match?.traverse?.yDirection;
        // if ((xDirection === undefined || xDirection === null) && (yDirection === undefined || yDirection === null)) {};


        // if (!(node.x >= box[0] && node.y >= box[1] && node.x + node.width <= box[2] && node.y + node.height <= box[3])) continue;

        // 当前属于模版里面的节点
        // node.matchs!.forEach(match => {});
        if (node.matchs === undefined) continue;
        for (const match of node.matchs) {
          const { x, y, width, height } = match;
          const offsetX = x - box[0];
          const offsetY = y - box[1];

          if (!(offsetX >= 0 && offsetY >= 0 && x + width <= box[2] && y + height <= box[3])) continue;

          let bgColor: TypeColor = node.type!;
          let textColor: TypeColor = "cellFill";
          if (bgColor !== 'position') {
            textColor = "ambiguousText"
          }
          // if (!(x === node.x && y === node.y && width === node.width && height === node.height)) {
          if (node.path!.length > 1 && match.isDefinedFromSpec === false) {
            bgColor += "Shallow";
          }
          for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
              const cell = grids[(offsetY + i) * firstNode.width + (offsetX + j)]
              cell.bgColor = bgColor; // typeMapColor[bgColor as TypeColor];
              cell.text = new Set();
              cell.textColor = textColor; // typeMapColor[textColor];
              if (this.input_tbl.in2out.hasOwnProperty(`[${y + i},${x + j}]`)) {
                const outPosi = this.input_tbl.in2out[`[${y + i},${x + j}]`];
                outPosi.forEach(posi => {
                  const [outY, outX] = JSON.parse(posi);
                  cell.text.add(this.output_tbl.cols[outX]);
                })
              }
              cell.text = Array.from(cell.text);
            }
          }
        }
        if (node.children && node.children.length) nodes.push(...node.children);
      }

      return grids; // { grids, box: (({ width, height, x, y }) => ({ width, height, x, y }))(firstNode) };
    },

    initTblInfo(inputFlag = true) {
      if (inputFlag) {
        this.input_tbl.tbl = []
        this.input_tbl.instance.updateData(this.input_tbl.tbl);
      }

      this.input_tbl.in2out = {};

      this.output_tbl.tbl = [];
      this.output_tbl.cols = [];
      this.output_tbl.out2in = {};
      this.output_tbl.instance.updateData(this.output_tbl.tbl);
      this.output_tbl.instance.updateSettings({ colHeaders: this.output_tbl.cols });
    },

    deleteChildByPath(nodes: TreeNode[], path: number[], constrIndex: number = -1) {
      if (path.length === 0) {
        // 如果路径为空，不做任何处理
        return;
      }

      if (constrIndex !== -1) {
        // 说明删除的是约束
        const currentNode = this.getNodebyPath(nodes, path) as TableCanoniserTemplate;
        if (currentNode) {
          currentNode.match!.constraints!.splice(constrIndex, 1);
          if (currentNode.match!.constraints!.length === 0) {
            delete currentNode.match!.constraints;
          }
        }
        return
      }

      // 获取目标节点的父节点
      const parentPath = path.slice(0, -1);
      const lastIndex = path[path.length - 1];

      if (parentPath.length === 0) {
        // 如果父路径为空，说明父节点是根节点
        nodes.splice(lastIndex, 1);
        return;
      }

      const parentNode = this.getNodebyPath(nodes, parentPath);

      // 删除目标节点
      if (parentNode && parentNode.children) {
        parentNode.children.splice(lastIndex, 1);
        // 如果父节点的子节点删除后为空数组，则删除children属性
        if (parentNode.children.length === 0) {
          delete parentNode.children;
        }
      }
    },

    getNodebyPath(nodes: TreeNode[], path: number[]) {
      return getNodebyPath(nodes, path);
      if (path.length === 0) return null; // 如果路径为空，返回null

      let currentNodes = nodes
      for (let i = 0; i < path.length; i++) {
        const index = path[i];
        // 确保路径下的节点存在
        if (!currentNodes[index]) {
          return null; // 或者抛出错误
        }
        // 如果是最后一个路径元素，返回目标节点
        if (i === path.length - 1) {
          return currentNodes[index];
        }
        // 更新当前节点为子节点
        currentNodes = currentNodes[index].children || [];
      }
      // 如果路径遍历完仍然没有找到目标节点，返回 null
      return null;
    },

    /**
     * 默认根据rawSpecs更新editor.mappingSpec.code
     */
    stringifySpec(specs: any = null, replaceSpace: "even" | "all" = "even", replaceCode = true) {
      let fnList: string[] = [];
      if (specs === null) specs = this.spec.rawSpecs;
      let strSpec = JSON.stringify(specs, replacer, 2);
      fnList.forEach((fn) => {
        strSpec = strSpec.replace(`"$TableCanoniser$"`, fn);
      })

      // 正则表达式匹配 JSON 对象中的键（包括可能的空白字符和引号）
      const removeQuotesFromKeysRegex = /"(\w+)":/g;
      strSpec = strSpec.replace(removeQuotesFromKeysRegex, '$1:');

      const replaceTableCanoniserKeyWordsRegex = /"TableCanoniserKeyWords\.(\w+)"/g;
      strSpec = strSpec.replace(replaceTableCanoniserKeyWordsRegex, 'TableCanoniserKeyWords.$1');

      if (replaceSpace === "all") {
        strSpec = removeSpaceType.all(strSpec);
      }

      if (replaceCode) {
        if (this.editor.mappingSpec.triggerCodeChange) {
          this.spec.undoHistory.push(this.editor.mappingSpec.code);
          // 当执行新的操作时，重做历史应当清空
          this.spec.redoHistory = [];
        }
        this.editor.mappingSpec.code = this.editor.mappingSpec.codePref + strSpec;
        // this.editor.mappingSpec.instance?.setValue(this.editor.mappingSpec.code);
        // this.editor.mappingSpecinstance?.getAction('editor.action.formatDocument')?.run();
        // this.editor.mappingSpec.instance?.trigger('editor', 'editor.action.formatDocument', null);
      }

      function replacer(key: string, value: any) {
        if (typeof value === 'function') {
          fnList.push(removeSpaceType[replaceSpace](value.toString()));
          return "$TableCanoniser$" // value.toString(); // 将函数转化为字符串
        }
        return value;
      }

      return strSpec;
    },

    selectArea() {
      const visNode = this.spec.selectNode!.data;
      const formData = this.spec.areaFormData
      const newSpec: TableCanoniserTemplate = {
        match: {
          startCell: {
            offsetLayer: formData.offsetLayer,
            offsetFrom: formData.offsetFrom,
            offsetX: formData.position.x,
            offsetY: formData.position.y,
          },
          size: {
            width: formData.size.width,
            height: formData.size.height,
          },
          traverse: {
            xDirection: formData.traverse.xDirection,
            yDirection: formData.traverse.yDirection,
          }
        }
      }
      if (visNode.path!.length === 0) {
        // 当前节点为根节点
        this.spec.rawSpecs.push(newSpec);
      } else {
        const currentSpec = this.getNodebyPath(this.spec.rawSpecs, visNode.path!);
        if (currentSpec === null) {
          message.error("The node path is invalid");
          return;
        }
        if (currentSpec.hasOwnProperty('children') && currentSpec.children != undefined) {
          currentSpec.children.push(newSpec)
        } else {
          currentSpec.children = [newSpec];
        }
      }
      this.stringifySpec();
    },

    insertNodeOrPropertyIntoSpecs(nodeOrProperty: any, property: "children" | "match" | "constraints" | "extract", visNode: VisTreeNode | null = null) {
      if (visNode === null) {
        visNode = this.spec.selectNode!.data;
      }
      if (visNode.path!.length === 0) {
        // 当前节点为根节点
        this.spec.rawSpecs.push(nodeOrProperty);
      } else {
        const currentSpec = this.getNodebyPath(this.spec.rawSpecs, visNode.path!);
        if (currentSpec === null) {
          message.error("The node path is invalid");
          return;
        }
        switch (property) {
          case "children":
            if (currentSpec.hasOwnProperty('children') && currentSpec.children != undefined) {
              currentSpec.children.push(nodeOrProperty);
            } else {
              currentSpec.children = [nodeOrProperty];
            }
            break;
          case "match":
            if (currentSpec.hasOwnProperty('match') && currentSpec.match != undefined) {
              Object.assign(currentSpec.match, nodeOrProperty);
            } else {
              currentSpec.match = nodeOrProperty;
            }
            break;
          case "constraints":
            if (currentSpec.hasOwnProperty('match') && currentSpec.match != undefined) {
              if (currentSpec.match.hasOwnProperty('constraints') && currentSpec.match.constraints != undefined) {
                currentSpec.match.constraints.push(nodeOrProperty);
              } else {
                currentSpec.match.constraints = [nodeOrProperty];
              }
            } else {
              currentSpec.match = {
                constraints: [nodeOrProperty]
              };
            }
            break;
          case "extract":
            currentSpec.extract = nodeOrProperty;
            break;
        }
      }
      this.stringifySpec();
    },


    // 复制属性的函数
    copyAttributes(source: TreeNode, target: TreeNode, attributes: string[]) {
      for (const attr of attributes) {
        if (source.hasOwnProperty(attr)) {
          target[attr] = source[attr];
        }
      }
    },

    // 递归遍历树并复制属性
    copyTreeAttributes(tree1: TreeNode, tree2: TreeNode, attributes = ['width', 'height', 'x', 'y']) {
      this.copyAttributes(tree1, tree2, attributes);

      if (tree1.children && tree2.children) {
        // if (tree1.children.length > tree2.children.length) {
        //   console.log(tree1.children);
        //   console.log(tree2.children);
        // }
        for (let i = 0; i < tree1.children.length; i++) {
          // console.log(tree1.children[i], tree2.children[i]);
          this.copyTreeAttributes(tree1.children[i], tree2.children[i], attributes);
        }
      }
    },

    getHighlightCodeStartEndLine(sonData: any, sonParentData: any = null, rootData: any = null): [number, number] {
      if (rootData === null) {
        rootData = this.spec.rawSpecs
      }
      const rootStr = this.stringifySpec(rootData, "all", false)
      const sonStr = this.stringifySpec(sonData, "all", false)

      if (sonParentData === null) {
        const startIndex = rootStr.indexOf(sonStr);
        const strBefore = rootStr.slice(0, startIndex);
        const startLine = (strBefore.match(/\n/g) || []).length + 1;
        const endLine = startLine + (sonStr.match(/\n/g) || []).length;
        return [startLine, endLine]
      } else {
        const [startParentLine, _] = this.getHighlightCodeStartEndLine(sonParentData);
        const [startConstLine, endConstLine] = this.getHighlightCodeStartEndLine(sonData, null, sonParentData);
        const startLine = startParentLine + startConstLine - 1;
        const endLine = startParentLine + endConstLine - 1;
        return [startLine, endLine]
      }
    },

    highlightCode(startLine: number, endLine: number = startLine, className: string = "nullShallow") {
      const editor = this.editor.mappingSpec.instance
      const decorationsCollection = this.editor.mappingSpec.decorations
      if (editor && decorationsCollection) {
        const range = new monaco.Range(startLine, 1, endLine, 1);
        const newDecorations: monaco.editor.IModelDeltaDecoration[] = [
          {
            range,
            options: {
              isWholeLine: true,
              className: className  // 'myLineDecoration',
            },
          },
        ];
        // 更新装饰集合
        decorationsCollection.set(newDecorations);
        // editor.revealLineInCenter(startLine);
        // editor.revealLineNearTop(startLine);
        // editor.revealRangeNearTopIfOutsideViewport(range);
        // editor.setSelection(range);  // 选择范围
        editor.revealRangeAtTop(range);
      }
    },
    computeColInfo(tblType: 'input_tbl' | 'output_tbl' = 'input_tbl') {
      const table = this[tblType].tbl;
      this[tblType].colInfo = [];
      if (table.length === 0) {
        if (tblType === 'input_tbl') {
          this.spec.visTree.width = 0;
          this.spec.visTree.height = 0;
        }
        return;
      }
      const hot = this[tblType].instance;
      const colCount = table[0].length;

      if (tblType === 'input_tbl') {
        this.spec.visTree.width = colCount;
        this.spec.visTree.height = table.length;
      }

      for (let col = 0; col < colCount; col++) {
        const colInfo: ColInfo = {
          index: col,
          width: hot.getColWidth(col),
          string: [],
          number: [],
          none: []
        };

        if (colInfo.width === null) colInfo.width = 60; // truncated 中 min-width 为 60

        for (let row = 0; row < table.length; row++) {
          const cell = table[row][col];
          const type = this.getCellDataType(cell);
          switch (type) {
            case TableCanoniserKeyWords.String:
              colInfo.string.push(row);
              break;
            case TableCanoniserKeyWords.Number:
              colInfo.number.push(row);
              break;
            case TableCanoniserKeyWords.None:
              colInfo.none.push(row);
              break;
          }
        }
        this[tblType].colInfo.push(colInfo);
      }
    },

    getCellDataType(value: CellValueType) {
      if (value === '' || value === null || value === undefined) {
        return TableCanoniserKeyWords.None;
      }
      if (!isNaN(Number(value))) {
        return TableCanoniserKeyWords.Number;
      }
      if (typeof value === 'string') {
        return TableCanoniserKeyWords.String;
      }
      return TableCanoniserKeyWords.NotNone;
    },
    clearStatus(type: string) {
      switch (type) {
        case "matchArea":
          document.body.style.cursor = 'default';
          document.documentElement.style.setProperty('--custom-cursor', 'default');
          d3.selectAll('.legend').classed('legend-selection', false);
          // this.spec.selectAreaFromLegend = []
          // this.spec.selectionsAreaFromLegend = []
          break;
        case "tree":
          /*
          const typeNodes = document.querySelectorAll('.type-node');
          typeNodes.forEach((node) => {
            (node as HTMLElement).classList.remove('selection');
          });
          const constraintRects = document.querySelectorAll('.node-constraint-rect');
          constraintRects.forEach((rect) => {
            // (rect as HTMLElement).style.visibility = 'hidden';
            (rect as HTMLElement).setAttribute('visibility', 'hidden');
          });
          */
          this.spec.constrNodeRectClickId = '';
          d3.selectAll('.type-node').classed('selection', false);
          d3.selectAll('.node-constraint-rect').attr('visibility', 'hidden');
          break;
        case "miniHighlight":
          this.tree.minimapInstHighlight!.selectAll('rect').remove();
          d3.select('path.top-line').attr("d", "");
          d3.select('path.bottom-line').attr("d", "");
          break
      }
    },
    debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
      let timeout: any = null;
      return function (...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          func(...args);
        }, wait);
      };
    }
  },
  // computed
  getters: {}
})


export type TableStore = ReturnType<typeof useTableStore>;