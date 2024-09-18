/* eslint-disable no-param-reassign */
import * as d3 from 'd3';
// import { useTableStore } from '@/store/table';  // 不能在还没有激活pinia store前就使用，可以传参进来

import {
  typeMapColor, TypeColor,
  typeNodeStyle,
  nodeTextStyle,
} from './style';
import {
  Point, RectDef, KV,
} from './types';
import letterAspectRatio from './letterAspectRatio';
import { VisTreeNode, TableStore, Selection } from "@/store/table";
import { CellConstraint, TableCanoniserKeyWords } from '@/table-canoniser/dist/grammar';


export type NodeData = {
  [key: string]: any,
  children: NodeData[],
  parent: NodeData | null,
  data: VisTreeNode
}

/** 创建一个新的Escape键盘事件，指定事件类型和相关参数 */
const escapeEvent = new KeyboardEvent('keydown', {
  key: 'Escape',
  code: 'Escape',
  keyCode: 27,
  charCode: 27,
  which: 27,
  bubbles: true,
  cancelable: true
});


const getLetterWidth = (
  letter: string,
  fontSize: number,
) => fontSize * (letterAspectRatio[letter as keyof typeof letterAspectRatio] || 1);

const getTextSize = (text: string, fontSize: number) => {
  let width = 0;
  // eslint-disable-next-line prefer-regex-literals
  const pattern = new RegExp('[\u4E00-\u9FFF]+');
  text.split('')
    .forEach((letter) => {
      if (pattern.test(letter)) {
        // 中文字符
        width += fontSize;
      } else {
        width += getLetterWidth(letter, fontSize);
      }
    });
  return [width, fontSize];
};

const fittingString = (input: string, maxWidth: any, fontSize: any) => {
  const ellipsis = '...';
  const ellipsisLength = getTextSize(ellipsis, fontSize)[0];
  let currentWidth = 0;
  let result = input;
  // eslint-disable-next-line prefer-regex-literals
  const pattern = new RegExp('[\u4E00-\u9FFF]+');
  input.split('')
    .forEach((letter: string, i) => {
      if (currentWidth > maxWidth - ellipsisLength) {
        return;
      }
      if (pattern.test(letter)) {
        // Chinese charactors
        currentWidth += fontSize;
      } else {
        // get the width of single letter according to the fontSize
        currentWidth += getLetterWidth(letter, fontSize);
      }
      if (currentWidth > maxWidth - ellipsisLength) {
        result = `${input.slice(0, i)}${ellipsis}`;
      }
    });
  return result;
};

function diagonal(source: Point, target: Point) {
  const { x, y } = source;
  const { x: ex, y: ey } = target;

  const xrvs = ex - x < 0 ? -1 : 1;
  const yrvs = ey - y < 0 ? -1 : 1;

  const rdef = 15;
  let r = Math.abs(ex - x) / 2 < rdef ? Math.abs(ex - x) / 2 : rdef;

  r = Math.abs(ey - y) / 2 < r ? Math.abs(ey - y) / 2 : r;

  const h = Math.abs(ey - y) / 2 - r;
  const w = Math.abs(ex - x) - r * 2;
  // w=0;
  const path = `
      M ${x} ${y}
      L ${x} ${y + h * yrvs}
      C  ${x} ${y + h * yrvs + r * yrvs} ${x} ${y + h * yrvs + r * yrvs} ${x + r * xrvs} ${y + h * yrvs + r * yrvs}
      L ${x + w * xrvs + r * xrvs} ${y + h * yrvs + r * yrvs}
      C  ${ex}  ${y + h * yrvs + r * yrvs} ${ex}  ${y + h * yrvs + r * yrvs} ${ex} ${ey - h * yrvs}
      L ${ex} ${ey}
`;
  return path;
}

function hdiagonal(source: Point, target: Point) {
  const { x, y } = source;
  const { x: ex, y: ey } = target;

  // Values in case of top reversed and left reversed diagonals
  const xrvs = ex - x < 0 ? -1 : 1;
  const yrvs = ey - y < 0 ? -1 : 1;

  // Define preferred curve radius
  const rdef = 15;

  // Reduce curve radius, if source-target x space is smaller
  let r = Math.abs(ex - x) / 2 < rdef ? Math.abs(ex - x) / 2 : rdef;

  // Further reduce curve radius, is y space is more small
  r = Math.abs(ey - y) / 2 < r ? Math.abs(ey - y) / 2 : r;

  // Defin width and height of link, excluding radius
  const h = Math.abs(ey - y) / 2 - r;
  const w = Math.abs(ex - x) / 2 - r;

  // Build and return custom arc command
  return `
      M ${x} ${y}
      L ${x + w * xrvs} ${y}
      C ${x + w * xrvs + r * xrvs} ${y}
        ${x + w * xrvs + r * xrvs} ${y}
        ${x + w * xrvs + r * xrvs} ${y + r * yrvs}
      L ${x + w * xrvs + r * xrvs} ${ey - r * yrvs}
      C ${x + w * xrvs + r * xrvs}  ${ey}
        ${x + w * xrvs + r * xrvs}  ${ey}
        ${ex - w * xrvs}  ${ey}
      L ${ex} ${ey}
  `;
}

function customRectCorner(rectInfo: RectDef) {
  const {
    startx, starty, rectWidth, rectHeight, rounded, radius,
  } = rectInfo;
  let path;

  switch (rounded) {
    case 'left':
      path = `
      M${startx + radius},${starty + radius}
      a${radius},${radius} 0 0 1 ${radius},-${radius}
      h${rectWidth - radius}
      v${rectHeight}
      h${-rectWidth + radius}
      a${radius},${radius} 0 0 1 -${radius},-${radius}
      z
      `;
      break;
    case 'right':
      path = `
      M${startx},${starty}
      h${rectWidth - radius}
      a${radius},${radius} 0 0 1 ${radius},${radius}
      v${rectHeight - 2 * radius}
      a${radius},${radius} 0 0 1 ${-radius},${radius}
      h ${radius - rectWidth}
      z
      `;
      break;
    case 'top':
      path = `
      M${startx},${starty + radius}
      a${radius},${radius} 0 0 1 ${radius},-${radius}
      h${rectWidth - 2 * radius}
      a${radius},${radius} 0 0 1 ${radius},${radius}
      v${rectHeight - radius}
      h${-rectWidth}
      z`;
      break;
    case 'bottom':
      path = `
      M${startx},${starty}
      h${rectWidth}
      v${rectHeight - radius}
      a${radius},${radius} 0 0 1 ${-radius},${radius}
      h${-rectWidth + 2 * radius}
      a${radius},${radius} 0 0 1 -${radius},-${radius}
      z`;
      break;
    case 'all': // 936
      path = `
      M${startx},${starty + radius}
      a${radius},${radius} 0 0 1 ${radius},-${radius}
      h${rectWidth - 2 * radius}
      a${radius},${radius} 0 0 1 ${radius},${radius}
      v${rectHeight - 2 * radius}
      a${radius},${radius} 0 0 1 ${-radius},${radius}
      h${-rectWidth + 2 * radius}
      a${radius},${radius} 0 0 1 -${radius},-${radius}
      z`;
      break;
    default: {
      path = `
      M${startx}${starty}
      h${rectWidth}
      v${rectHeight}
      h${-rectWidth}
      v${-rectHeight}
      z
      `;
      break;
    }
  }

  return path;
}

function declareContextMenu(tableStore: TableStore, node: NodeData, constrIndex: number, event: MouseEvent) {
  event.preventDefault();
  // event.stopPropagation();
  // console.log(tableStore, node, constrIndex, event);  // 第一个参数为 this，可以不写
  event.preventDefault();

  if (node.parent === null) {
    tableStore.tree.menuList = [tableStore.tree.menuAllList[0]];
  } else if (constrIndex === -1) {
    tableStore.tree.menuList = tableStore.tree.menuAllList.slice(0, -1);
  } else {
    tableStore.tree.menuList = tableStore.tree.menuAllList.slice(-1);
    tableStore.spec.selectConstrIndex = constrIndex;
  }
  // console.log("node", node);
  tableStore.spec.selectNode = node;
  tableStore.tree.contextMenuVisible = true;
}

export class TreeChart {
  svgWidth: number;
  svgHeight: number;
  margins: Array<number>;
  container: string;
  data: any;
  zoomLevel: number;
  resetZoom: any;
  depth: number;
  calculated: KV; // SVG画布相关的信息，如宽高、边距、对称中心
  treeLayout: any; // 用于存放layout配置
  realChart: any;
  previousTransform: any;
  centerG: any;
  centerX: number;
  root: any; // 树的根节点及其children
  allNodes: any; // 用于存放root数据输入layout配置中后生成的位置信息
  defaultFont: string;
  duration: number;
  store: TableStore;
  orient: 'h' | 'v';

  constructor(
    _margins: Array<number>,
    _container: string,
    _data: any,
    _store: any,
    _zoomLevel = 1.0,
    _orient: 'h' | 'v' = 'h' as const,
  ) {
    this.svgWidth = 500;
    this.svgHeight = 500;
    this.margins = _margins;
    this.container = _container;
    this.zoomLevel = _zoomLevel;
    this.orient = _orient;
    this.depth = 10;
    this.calculated = {};
    this.treeLayout = null;
    this.realChart = null;
    this.previousTransform = null;
    this.centerX = 0;
    this.root = null;
    this.allNodes = null;
    this.defaultFont = 'Helevtica';
    this.duration = 600;
    this.data = _data;
    this.store = _store;

    this.setZoomFactor.bind(this);
    this.batchEnterExitUpdate();
  }

  // 需要再展开收起节点后自适应当前容器
  public setZoomFactor() {
    const currentWidth = this.centerG.node()
      .getBoundingClientRect().width;
    let targetZoomLevel = this.svgWidth / currentWidth;
    targetZoomLevel = targetZoomLevel > 1 ? 1 : targetZoomLevel;
    this.zoomLevel = targetZoomLevel;

    if (this.orient === 'h') {
      this.centerG.attr('transform', `translate(${this.calculated.nodeMaxWidth / 2}, ${this.calculated.centerY}) scale(${targetZoomLevel})`);
    } else {
      this.centerG.attr('transform', `translate(${this.calculated.centerX}, ${this.calculated.nodeMaxHeight / 2}) scale(${targetZoomLevel})`);
    }
  }

  /*
  private handleCircleClick(_: any, d: any) {
    if (d.children) {
      d.hiddenChildren = d.children;
      d.children = null;
    } else {
      if (d.hiddenChildren) d.children = d.hiddenChildren;
      d.hiddenChildren = null;
    }

    this.update(d);
  }

  private handleRectClick(
    _: any,
    parent: any,
    childrenToToggle: Array<any>,
  ) {
    // childrenToToggle 全部出现在children中，说明当前点击是期望收起
    if (parent.children && AincludeB(parent.children, childrenToToggle)) {
      if (!parent.hiddenChildren) {
        parent.hiddenChildren = [];
      }
      parent.hiddenChildren = parent.hiddenChildren.concat(childrenToToggle);
      parent.children = parent.children.filter((cd) => !childrenToToggle.includes(cd));
      // 如果传入空数组，d3 tree.js会报错 read properties of undefined (reading 'z') at firstWalk
      // 没有children只能传null
      if (!parent.children.length) {
        parent.children = null;
      }
    } else if (parent.hiddenChildren && AincludeB(parent.hiddenChildren, childrenToToggle)) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children = parent.children.concat(childrenToToggle);
      parent.hiddenChildren = parent.hiddenChildren.filter((cd) => !childrenToToggle.includes(cd));
      if (!parent.hiddenChildren.length) parent.hiddenChildren = null;
    }

    this.update(parent);
  }
    */


  private batchEnterExitUpdate() {
    d3.selection.prototype.patternify = function (selectedTag:
      { tag: string, selector: string, targetData?: any }) {
      const { tag, selector } = selectedTag;
      const tmpData = selectedTag.targetData || [selector];
      const batchSelection = this.selectAll(`.${selector}`)
        .data(tmpData, (d: any, i: any) => {
          if (typeof d === 'object') {
            if (d.id) {
              return d.id;
            }
          }
          return i;
        });

      batchSelection.exit()
        .remove();
      const mergedSelection = batchSelection.enter()
        .append(tag)
        .merge(batchSelection);
      mergedSelection.attr('class', selector);
      return mergedSelection;
    };
  }

  public render() {
    // 获取当前svg所在容器，使svg长度高度匹配容器
    const drawingContainer = d3.select(this.container);
    // 清空当前容器下的所有子元素
    (drawingContainer.node() as HTMLElement).replaceChildren();

    const drawingContainerBoundry = (drawingContainer.node() as HTMLElement)
      .getBoundingClientRect();
    if (drawingContainerBoundry.width > 0) {
      this.svgWidth = drawingContainerBoundry.width;
      this.svgHeight = drawingContainerBoundry.height;
    }


    const nodeMaxWidth = typeNodeStyle.nodeWidth; // d3.max(this.data, (({ nodeWidth }) => nodeWidth));
    const nodeMaxHeight = typeNodeStyle.nodeHeight; // d3.max(this.data, (({ nodeHeight }) => nodeHeight));
    this.calculated = {
      id: `ID${Math.floor(Math.random() * 1000000)}`,
      chartVerticalMargin: this.margins[0],
      chartHorizontalMargin: this.margins[1],
      chartWidth: this.svgWidth - this.margins[0] * 2,
      chartHeight: this.svgHeight - this.margins[1] * 2,
      nodeMaxWidth,
      nodeMaxHeight,
      centerX: (this.svgWidth - this.margins[0] * 2) / 2,
      centerY: (this.svgHeight - this.margins[1] * 2) / 2,
    };

    this.depth = this.orient === 'h' ? nodeMaxWidth / 2 : nodeMaxHeight + 20;

    this.treeLayout = d3.tree()
      .size([this.calculated.chartWidth, this.calculated.chartHeight]);
    // console.log("layout:", this.treeLayout);
    // console.log(this.calculated);


    if (this.orient === 'h') {
      this.treeLayout.nodeSize([this.calculated.nodeMaxHeight + typeNodeStyle.nodeSpacing,
      this.calculated.nodeMaxWidth + this.depth]);
    } else {
      this.treeLayout.nodeSize([this.calculated.nodeMaxWidth + typeNodeStyle.nodeSpacing,
      this.calculated.nodeMaxHeight + this.depth]);
    }

    if (Array.isArray(this.data)) {
      this.root = d3.stratify()
        .id((d: any) => d.nodeId)
        .parentId((d: any) => d.parentNodeId)(this.data);
    } else {
      this.root = d3.hierarchy(this.data, (d: any) => d.children);
      // 初始化 id 计数器
      // let idCounter = 0;
      // 为每个节点分配唯一的 id
      this.root.each((node: NodeData) => {
        // node.id = idCounter++;
        // node.data.id = node.id;
        node.id = node.data.id;
      });
    }

    this.root.x0 = 0;
    this.root.y0 = 0;

    /*
    this.allNodes = this.treeLayout(this.root)
      .descendants()
      .forEach((d: any) => {
        Object.assign(d.data, {
          directSubordinates: d.children ? d.children.length : 0, // 计算直接下属的数量（即直接子节点的数量）
          totalSubordinates: d.descendants().length - 1,  // 计算总下属的数量（包括所有子孙节点，但不包括自身）
        });
      });
    */

    // pan & zoom handler
    // this.zoomfunc = (d3.zoom() as any).on('zoom', this.zoomed.bind(this))
    //   .bind(this);
    const zoomfunc = (d3.zoom() as any).on('zoom', (e: any) => {
      chart.attr('transform', e.transform);
    })


    // this.centerG.attr('transform', `translate(${offsetX}, ${offsetY})`);



    // svg画布
    // @ts-ignore
    const svg = drawingContainer.patternify({ tag: 'svg', selector: 'svg-chart-container' })
      .attr('width', this.svgWidth)
      .attr('height', this.svgHeight)
      .attr('font-family', this.defaultFont)
      // .attr('cursor', 'move')
      // .attr('viewBox', `${this.margins[0]} ${this.margins[1]} ${this.svgWidth} ${this.svgHeight}`)
      // .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"))
      .call(zoomfunc).on('dblclick.zoom', null)  // 禁用双击缩放


    this.resetZoom = () => {
      svg.transition().duration(750).call(zoomfunc.transform, d3.zoomIdentity);
    }

    // svg画布与容器边距 
    const chart = svg.patternify({ tag: 'g', selector: 'chart' })
      .attr('transform', `translate(${this.calculated.chartHorizontalMargin}, ${this.calculated.chartVerticalMargin})`);
    this.realChart = chart;

    // 真正放置node link
    const centerG = chart.patternify({ tag: 'g', selector: 'center-group' })
    // .attr('transform', this.orient === 'h' ? `translate(${this.calculated.chartHorizontalMargin}, ${this.calculated.centerY}) scale(${this.zoomLevel})` : `translate(${this.calculated.centerX}, ${this.calculated.nodeMaxHeight / 2}) scale(${this.zoomLevel})`);
    this.centerG = centerG;

    // 开始画图例

    // 开始画node link
    this.update(this.root);
    return this;
  }

  private update(data: any) {
    const tableStore = this.store;
    const treeData = this.treeLayout(this.root);
    const linksData = treeData.descendants()
      .slice(1);
    const nodesData = treeData.descendants();
    if (this.orient === 'h') {
      nodesData.forEach((d: any, index: number) => {
        const originalX = d.x;
        d.x = d.y;
        d.y = originalX;
        if (index === 0) {
          d.x = typeNodeStyle.nodeCircleRadius * 2;
        }
      });
    }
    // 如果是水平视图，要等nodesData转变过后再解构，否则得到的是转变之前的位置，造成transition bug
    const {
      x0, y0, x, y,
    } = data;

    // ************************************绘制link************************************
    const linksSelection = this.centerG.selectAll('path.link')
      .data(linksData, (d: any) => d.id);

    const linkGen = d3.linkHorizontal();

    const linksEnter = linksSelection.enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', () => {
        const o: d3.DefaultLinkObject = {
          source: [x0, y0],
          target: [x0, y0],
        };
        return linkGen(o);
      });

    const linkUpdate = linksEnter.merge(linksSelection);

    linkUpdate.attr('fill', 'none')
      .attr('stroke-width', typeNodeStyle.connectorLineWidth)
      .attr('stroke', typeNodeStyle.connectorLineColor)
    // .attr('stroke-width', ((d: any) => d.data.connectorLineWidth || 2))
    // .attr('stroke', (d: any) => (d.data.connectorLineColor ? d.data.connectorLineColor : 'black'));

    let realChartWidth = 0
    linkUpdate.transition()
      .duration(this.duration)
      .attr('d', (d: any) => {
        if (this.orient === 'h') {
          let xshiftStart = typeNodeStyle.nodeWidth / 2;
          const yshiftStart = 0;
          const xshiftEnd = -typeNodeStyle.nodeWidth / 2;
          const yshiftEnd = 0;

          if (d.parent.id == "0") {
            xshiftStart = typeNodeStyle.nodeCircleRadius
          }

          const chartWidth = d.x + xshiftStart;
          if (chartWidth > realChartWidth) {
            realChartWidth = chartWidth;
          }

          const o: d3.DefaultLinkObject = {
            source: [d.parent.x + xshiftStart, d.parent.y + yshiftStart],
            target: [d.x + xshiftEnd, d.y + yshiftEnd],
          };
          return linkGen(o);
        }

        const o: d3.DefaultLinkObject = {
          source: [d.parent.x, d.parent.y + typeNodeStyle.nodeHeight / 2],
          target: [d.x, d.y - typeNodeStyle.nodeHeight / 2],
        };
        return linkGen(o);
        return diagonal({ x: d.x, y: d.y }, { x: d.parent.x, y: d.parent.y });
      });



    // 用于节点收缩或展开是动效终点所处位置
    const linkExit = linksSelection.exit()
      .transition()
      .duration(this.duration)
      .attr('d', () => {
        const o: d3.DefaultLinkObject = {
          source: [x, y],
          target: [x, y],
        };
        return linkGen(o);
      })
      .remove();

    // ************************************绘制node************************************
    const nodesSelection = this.centerG.selectAll('g.node')
      .data(nodesData, (d: any) => d.id);



    const nodeEnter = nodesSelection.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', () => `translate(${x0}, ${y0})`)
      .attr('cursor', 'pointer');



    // ************************************节点、节点文本、节点上方边文本****************************
    const nodeGroups = nodeEnter.patternify({ tag: 'g', selector: 'node-group', targetData: (d: any) => [d] });
    // const nodeRectText = nodeEnter.patternify({ tag: 'text', selector: 'node-text', targetData: (d: any) => [d] });

    // const nodeRectText = nodeGroups.patternify({ tag: 'g', selector: 'node-text-g', targetData: (d: any) => [d] });
    // nodeRectText.patternify({ tag: 'text', selector: 'node-text' });
    // nodeRectText.patternify({ tag: 'svg:title', selector: 'node-tooltip' });

    // const edgeText = nodeEnter.patternify({ tag: 'text', selector: 'edge-text', targetData: (d: any) => [d] });

    const nodeUpdate = nodeEnter.merge(nodesSelection);

    nodeUpdate.transition()
      .attr('opaicty', 0)
      .duration(this.duration)
      .attr('transform', (d: any) => {
        // console.log(d);
        return `translate(${d.x}, ${d.y})`
      })
      .attr('opacity', 1);

    // console.log(data);

    // 绑定选中节点的交互
    // nodeGroups
    //   // .on('click', this.handleNodeMultipleSelect.bind(this))
    //   .on('contextmenu', this.declareContextMenu.bind(this));

    // nodeGroups.attr('transform', ({ data: info }: any) => `translate(${-info.nodeWidth / 2}, ${-info.nodeHeight / 2})`);
    nodeGroups.attr('transform', () => `translate(${-typeNodeStyle.nodeWidth / 2}, ${-typeNodeStyle.nodeHeight / 2})`);

    nodeGroups.each(function (this: any, node: NodeData) {
      const current = d3.select(this);
      /** 绘制节点（circle + rect） */
      if (node.parent === null) { // 提前处理圆形节点，array下的元素
        // @ts-ignore
        current.patternify({ tag: 'circle', selector: `node-circle-${node.id}` });
        nodeGroups.select(`.node-circle-${node.id}`)
          .attr('class', `node-circle-${node.id} type-node`)
          .attr('r', typeNodeStyle.nodeCircleRadius)
          .attr('fill', '#f5f5f5') // typeMapColor[node.data.type!]
          .attr('stroke', typeNodeStyle.connectorLineColor)
          .attr('stroke-width', typeNodeStyle.connectorLineWidth)
          .attr('transform', `translate(${typeNodeStyle.nodeWidth / 2}, ${typeNodeStyle.nodeHeight / 2})`)
          .attr('cursor', 'pointer')
          .append('svg:title').text(`Width: ${node.data.width}, Height: ${node.data.height}`)
        return;
      }

      if (node.data.id === 1) {
        tableStore.spec.selectNode = node  // 默认选中第一个节点
        tableStore.tree.clickNode = node  // 默认选中第一个节点
        if (document.body.style.cursor !== 'cell') {
          tableStore.goToInstance(0);
        }
      }

      const nodeRectData = {
        "rectHeight": typeNodeStyle.nodeHeight,
        "rectWidth": typeNodeStyle.nodeWidth,
        "starty": 0,
        "startx": 0,
        "radius": 5,
        "rounded": "all"
      }

      let tooltipText: any = node.data.matchs?.length;
      tooltipText = tooltipText === undefined ? "Don't match any instances" : `Match: ${tooltipText} instances`;
      // tooltipText += '\nPress Delete/Backspace to delete this pattern.';

      // @ts-ignore
      current.patternify({ tag: 'path', selector: `node-rect-${node.id}` });
      nodeGroups.select(`.node-rect-${node.id}`)
        .attr('class', `node-rect-${node.id} type-node`)
        .attr('d', customRectCorner(nodeRectData as RectDef))
        .attr('fill', typeMapColor[node.data.type!])
        // .attr('fill', nodeRectData.rectColor)
        // .attr('cursor', (d: any) => (!d.children && !d.hiddenChildren ? 'none' : 'pointer'))
        .attr('cursor', 'pointer')
        // .attr('pointer-events', (d: any) => (!d.children && !d.hiddenChildren ? 'none' : 'all'));
        .append('svg:title').text(`Width: ${node.data.width}, Height: ${node.data.height}\nPattern Path: ${JSON.stringify(node.data.path)}\n` + tooltipText)

      /** 绘制节点的constraints */
      node.data.match?.constraints?.forEach((_constraint, i) => {
        // console.log('hhh', constraint, i, dataBindToThis.id, dataBindToThis);
        const iconsz = typeNodeStyle.iconsize;
        const constrId = `${node.id}-${i}`;
        // @ts-ignore
        current.patternify({ tag: 'rect', selector: `node-constraint-rect-${constrId}` });
        const constrNodeRect = nodeGroups.select(`.node-constraint-rect-${constrId}`);

        const subTemplate = tableStore.getNodebyPath(tableStore.spec.rawSpecs, node.data.path!);
        const constraint: CellConstraint = subTemplate!.match.constraints![i];

        constrNodeRect.classed('node-constraint-rect', true)
          .attr('transform', `translate(${(iconsz + typeNodeStyle.iconPadding) * i}, ${-typeNodeStyle.nodeHeight / 2 - 3})`)
          .attr("visibility", "hidden")
          .attr('width', iconsz + 2)
          .attr('height', iconsz + 2)
          .attr("stroke", typeMapColor.selection)
          .attr("stroke-width", 1.5)
          .attr("fill", "none")

        let constrIndex = 0;

        // @ts-ignore
        current.patternify({ tag: 'image', selector: `node-constraint-icon-${constrId}` });
        nodeGroups.select(`.node-constraint-icon-${constrId}`)
          .attr('transform', `translate(${1 + (iconsz + typeNodeStyle.iconPadding) * i}, ${-typeNodeStyle.nodeHeight / 2 - 2})`)
          .attr('xlink:xlink:href', () => {
            // eslint-disable-next-line
            const valueCstr = constraint.valueCstr;
            let iconPath: any;
            if (typeof valueCstr === 'function') {
              iconPath = require('@/assets/function.png');
            } else {
              switch (valueCstr) {
                case TableCanoniserKeyWords.String:
                  iconPath = require('@/assets/string.png');
                  break;
                case TableCanoniserKeyWords.Number:
                  iconPath = require('@/assets/number.png');
                  break;
                case TableCanoniserKeyWords.None:
                  iconPath = require('@/assets/minus.png');
                  break;
                case TableCanoniserKeyWords.NotNone:
                  iconPath = require('@/assets/plus.png');
                  break;
                default:
                  iconPath = require('@/assets/equal3.png');  // letter-w (3)
              }
            }
            // const iconPath = require('@/assets/constraint.png');
            return iconPath;
          })
          .attr('width', iconsz)
          .attr('height', iconsz)
          .attr('tabindex', 0)  // 使 rect 可聚焦，但点击后会触发focus，默认会有 outline样式，需要设置 outline: none
          .on("keyup", (e: KeyboardEvent, d: NodeData) => {
            if (e.key === "Delete" || e.key === "Backspace") {
              tableStore.deleteChildByPath(tableStore.spec.rawSpecs, d.data.path!, i);
              tableStore.stringifySpec();
            }
          })
          .on('mouseover', (_e: any, d: NodeData) => {
            // console.log('mouseover', d);
            try {
              constrNodeRect.attr('visibility', 'visible');
              let cellInfo = d.data.constrsInfo![i].map((ele, index) => ({ ele, index })).filter(info => info.ele.instIndex === tableStore.tree.instanceIndex);
              if (cellInfo === undefined) return;
              tableStore.highlightTblTemplate(cellInfo.map((info) => {
                if (info.ele.isDefinedFromSpec) constrIndex = info.index;
                return {
                  x: info.ele.x,
                  y: info.ele.y,
                  width: 1,
                  height: 1,
                  isDefinedFromSpec: info.ele.isDefinedFromSpec
                }
              }));
            } catch (e) {
              console.log('Constraint mouseover error: \n', e)
            }
          })
          .on('mouseout', (_e: any, d: NodeData) => {
            if (tableStore.spec.constrNodeRectClickId !== constrId)
              constrNodeRect.attr('visibility', 'hidden');
            tableStore.highlightViewsAfterClickNode();
          })
          .on('contextmenu', declareContextMenu.bind(null, tableStore, node, i))  // bind 第一个参数为 this，这种情况下最后一个参数为 event
          .on('click', (_e: any, d: NodeData) => {
            try {
              // 先清空其他样式
              document.dispatchEvent(escapeEvent);

              tableStore.spec.constrNodeRectClickId = constrId;
              tableStore.tree.clickNode = d;
              tableStore.tree.clickConstrIndex = i;
              constrNodeRect.attr('visibility', 'visible');
              tableStore.highlightViewsAfterClickNode();

              tableStore.editor.mappingSpec.highlightCode = [...tableStore.getHighlightCodeStartEndLine(constraint, subTemplate), 'selectionShallow'];
              tableStore.editor.mappingSpec.triggerCodeChange = false;
              const newCode = tableStore.editor.mappingSpec.codePref + tableStore.stringifySpec(null, "even", false);
              if (tableStore.editor.mappingSpec.code === newCode) {
                tableStore.highlightCode(...tableStore.editor.mappingSpec.highlightCode);
                tableStore.editor.mappingSpec.highlightCode = null;
                tableStore.editor.mappingSpec.triggerCodeChange = true;
              } else {
                tableStore.editor.mappingSpec.code = newCode;
              }
            } catch (e) {
              console.log('Constraint click error: \n', e)
            }
          })
          .append('svg:title').text(() => {
            const valueCstr = constraint.valueCstr;
            // const msg = '\nPress Delete/Backspace to delete this constraint.';
            if (typeof valueCstr === 'function') {
              return "The cell is constrained by a custom function:\nClick to see details in the Code Panel."
            } else {
              switch (valueCstr) {
                case TableCanoniserKeyWords.String:
                  return "The cell's data type should be a string."
                case TableCanoniserKeyWords.Number:
                  return "The cell's data type should be a number."
                case TableCanoniserKeyWords.None:
                  return "The cell should be an empty string, null, or undefined."
                case TableCanoniserKeyWords.NotNone:
                  return "The cell should not be an empty string, null, or undefined."
                default:
                  return "The cell should be " + valueCstr + "."
              }
            }
          })
      });
    });

    // const nodeRectText = nodeUpdate.patternify({ tag: 'g', selector: 'node-text-g', targetData: (d: any) => [d] });
    nodeUpdate.patternify({ tag: 'text', selector: 'node-text' });


    nodeUpdate.select('.node-text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('fill', nodeTextStyle.color)
      .attr('font-size', nodeTextStyle.fontSize)
      // .attr('y', ({ data: info }: any) => nodeTextStyle.yAxisAdjust + info.shiftFromEndCenter)
      .attr('y', () => nodeTextStyle.yAxisAdjust)
      .attr('cursor', 'pinter')
      .attr('pointer-events', 'none')  // .style('pointer-events', 'auto');
      .text((d: NodeData) => {
        if (d.id === 0) {
          // console.log(d.data.size);
          return "";
        } else {
          let width: any = d.data.width;
          let height: any = d.data.height;
          let specWidth = d.data.match?.size?.width;
          let specHeight = d.data.match?.size?.height;
          if (specWidth === undefined) {
            specWidth = 1
          }
          if (specHeight === undefined) {
            specHeight = 1
          }
          if (width === undefined) width = specWidth;
          else if (specWidth === null) width = null;
          if (height === undefined) height = specHeight;
          else if (specHeight === null) height = null;
          return `(${width}, ${height})`;
        }
      })
    // .on('click', (event: any, d: any) => {
    //   // 阻止点击事件的默认行为和传播
    //   // event.stopPropagation();
    //   // event.preventDefault();
    //   console.log("click", d);
    // })
    // .append("svg:title").text("(d: any) => d.data.id");



    // 为所有circle和rect绑定展开收起交互事件
    // d3.selectAll('.type-node, .node-text-g')
    d3.selectAll<SVGElement, NodeData>('.type-node')
      .attr('tabindex', 0)  // 使 rect 可聚焦，但点击后会触发focus，默认会有 outline样式，需要设置 outline: none
      .on("keyup", (e: KeyboardEvent, d: NodeData) => {
        if (e.key === "Delete" || e.key === "Backspace" && d.data.id !== 0) {
          tableStore.deleteChildByPath(tableStore.spec.rawSpecs, d.data.path!);
          tableStore.stringifySpec();
        }
      })
      .on('contextmenu', (e, d) => {
        declareContextMenu(tableStore, d, -1, e);
      })
      .on('mouseover', function (event, node) {  // 只有 function 才有 this，箭头函数的 this 是定义时的上下文
        // console.log('mouseover', node);  // event: any, node: any
        // console.log('mouseover', tableStore.tree.clickConstrIndex);
        if (node.id) tableStore.highlightTblTemplate(node.data.currentMatchs!);
      })
      .on('mouseout', function () {
        tableStore.highlightViewsAfterClickNode();
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        // d3.selectAll('.type-node').classed('selection', false);
        tableStore.clearStatus("tree");
        if (d.id) {
          // tableStore.editor.mappingSpec.instance?.setValue(tableStore.editor.mappingSpec.codePref + tableStore.stringifySpec(null, "even", false));
          // tableStore.stringifySpec();
          // if (tableStore.spec.selectNode === null || tableStore.spec.selectNode.data.id !== node.data.id) {}
          tableStore.spec.selectNode = d;
          tableStore.tree.clickNode = d;
          tableStore.tree.clickConstrIndex === -1;
          tableStore.highlightViewsAfterClickNode();
          d3.select(this).classed('selection', true);
          const visData = d.data;
          // tableStore.goToInstance(0);  // 默认选择第一个节点


          /************** 与 monaco editor 交互 ***************/
          const subTemplate = tableStore.getNodebyPath(tableStore.spec.rawSpecs, visData.path!);
          // const [startLine, endLine] = tableStore.getHighlightCodeStartEndLine(subTemplate);
          // tableStore.highlightCode(startLine, endLine, `${visData.type}Shallow`);
          tableStore.editor.mappingSpec.highlightCode = [...tableStore.getHighlightCodeStartEndLine(subTemplate), `${visData.type}Shallow`];
          tableStore.editor.mappingSpec.triggerCodeChange = false;
          const newCode = tableStore.editor.mappingSpec.codePref + tableStore.stringifySpec(null, "even", false);
          if (tableStore.editor.mappingSpec.code === newCode) {
            tableStore.editor.mappingSpec.instance?.setValue(newCode);
            tableStore.highlightCode(...tableStore.editor.mappingSpec.highlightCode);
            tableStore.editor.mappingSpec.highlightCode = null;
            tableStore.editor.mappingSpec.triggerCodeChange = true;
          } else {
            tableStore.editor.mappingSpec.code = newCode;
          }
        } else {
          document.dispatchEvent(escapeEvent);
        }
        return;
        // this.handleCircleClick(event, d);  // 收缩节点
      });


    /*
    nodeUpdate.select('.edge-text')
      .attr('fill', edgeTextStyle.color)
      .attr('font-size', edgeTextStyle.fontSize)
      .text(({ data: info }: any) => typeFeatureMapIcon(info.dataTypeFeature))
      .attr('x', ({ data: info }: any) => {
        if (this.orient === 'h') {
          return (info.dataTypeText ? -info.nodeWidth / 2 : -info.nodeCircleRadius) - 15;
        }
        return edgeTextStyle.distFromEdge;
      })
      .attr('y', ({ data: info }: any) => (this.orient === 'h' ? -edgeTextStyle.distFromEdge + info.shiftFromEndCenter : -info.nodeHeight / 2 - 2));
    */
    // ************************************exit 节点************************************
    const nodeExitTransition = nodesSelection.exit()
      .attr('opacity', 1)
      .transition()
      .duration(this.duration)
      .attr('transform', `translate(${x},${y})`)
      .on('end', function (this: any) {
        d3.select(this)
          .remove();
      })
      .attr('opacity', 0);

    // Store the old positions for transition.
    nodesData.forEach((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    const offsetX = Math.max((this.svgWidth - realChartWidth) / 2, 0) - typeNodeStyle.nodeCircleRadius;
    const offsetY = Math.max((this.svgHeight - this.realChart.node()!.getBBox().height) / 2, 0) + typeNodeStyle.nodeCircleRadius;
    this.centerG.attr('transform', `translate(${offsetX}, ${offsetY})`); // Center the matrix
  }
}
