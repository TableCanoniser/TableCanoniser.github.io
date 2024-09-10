<template>
    <div class="view"> <!-- style="flex: 4.5" -->
        <div class="view-title">
            <a-flex justify="space-between" align="center">
                <span style="font-size: 18px; font-weight: bold;">Mapping Patterns</span>
                <span>
                    <span>Current instance:</span>
                    <a-input-number class="goToInstance" :value="tableStore.tree.instanceIndex" :defaultValue="-1"
                        :disabled="tableStore.spec.matchedInstNum === 0"
                        @pressEnter="tableStore.goToInstance(+$event.target.value - 1)" size="small" :precision="0"
                        :formatter="handleFormatter" @step="handleStep"
                        @blur="tableStore.goToInstance(+$event.target.value - 1)"></a-input-number>
                    <span style="font-weight: normal" :title="instanceContent">/ [{{ tableStore.spec.matchedInstNum
                        }}]</span>
                </span>
                <span style="font-size: 15px; height: 25px">
                    <span>Match:</span>
                    <a-button-group style="margin: 0 15px 0 6px">
                        <a-button class="legend legend-null" size="small" @click="selectMatchExtractArea('null')"
                            title="Click to select a starting area in the input table. Press 'Esc' to cancel the selection mode.">Region</a-button>
                    </a-button-group>
                    <span>Extract by:</span>
                    <a-button-group style="margin-left: 6px">
                        <a-button class="legend legend-position" size="small"
                            @click="selectMatchExtractArea('position')"
                            title="Click to select a starting area in the input table for matching and extracting by position. Press 'Esc' to cancel the selection mode.">Position</a-button>
                        <a-button class="legend legend-context" size="small" @click="selectMatchExtractArea('context')"
                            title="Click to select a starting area in the input table for matching and extracting by context. Press 'Esc' to cancel the selection mode.">Context</a-button>
                        <a-button class="legend legend-value" size="small" @click="selectMatchExtractArea('value')"
                            title="Click to select a starting area in the input table for matching and extracting by value. Press 'Esc' to cancel the selection mode.">Value</a-button>
                    </a-button-group>
                </span>
                <span style="margin-right: 10px">
                    <a-button id="draw_tree" size="small" @click="resetZoom">
                        <v-icon name="bi-arrow-clockwise" scale="0.9"></v-icon>
                        <span>Reset View</span>
                    </a-button>
                </span>
            </a-flex>
        </div>
        <div class="view-content" style="display: flex;">
            <div style="flex: 1.3;">
                <svg ref="tblContainer" class="tbl-container">
                    <path class="mini-temp-line top-line"></path>
                    <path class="mini-temp-line bottom-line"></path>
                </svg>
            </div>
            <div style="flex: 1; margin-left: 5px">
                <a-dropdown :trigger="['contextmenu']" :open="contextMenuVisible"
                    @openChange="contextMenuVisibleChange">
                    <template #overlay>
                        <a-menu @click="closeContextMenu" :items="menuList">
                        </a-menu>
                    </template>
                    <div ref="treeContainer" class="tree-container"></div>
                </a-dropdown>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
// import * as d3 from 'd3';
// import { flextree, FlextreeNode } from 'd3-flextree';
import { TreeChart } from '@/utils/drawTree';
import { message } from 'ant-design-vue';
import { useTableStore } from "@/store/table";
import * as d3 from 'd3';
import { TypeColor } from '@/utils/style';
const tableStore = useTableStore();

/*
interface TreeNode {
    [key: string]: any;
    children?: TreeNode[];
}

const data: TreeNode = {
    name: 'Root',
    children: [
        { name: 'Child 1' },
        {
            name: 'Child 2',
            children: [
                { name: 'Grandchild 1' },
                { name: 'Grandchild 2' },
                { name: 'Grandchild 3' },
            ]
        }
    ]
};
*/

// const currentInstFlag = ref(false);
// const disableNextFlag = ref(false);
// const disableGoToInstFlag = ref(false);
const instanceContent = ref("");
const menuList = computed(() => tableStore.tree.menuList);
// const contextMenuVisible = tableStore.tree.contextMenuVisible;
const contextMenuVisible = computed(() => tableStore.tree.contextMenuVisible && tableStore.tree.menuList.length > 0);
const contextMenuVisibleChange = (value: boolean) => {
    // if (store.state.selectedNode.length === 0 && value === true) return;
    // store.commit('setContextMenuVisibility', value);
    tableStore.tree.contextMenuVisible = value;
    tableStore.tree.menuList = [];
    // setTimeout(() => {
    //     tableStore.tree.menuList = [];
    // }, 0)
};

const closeContextMenu = (e: any) => {
    // console.log("closeContextMenu", e, e.key);
    const visNode = tableStore.spec.selectNode!.data;
    let extract: any = null, extractColor: string = '';
    let triggerCellCursorFlag = false;
    let messageInfo = "\n Press ESC to cancel the selection mode.";
    const maxCNum = tableStore.findMaxCNumber() + 1;
    switch (e.key) {
        case "0":
            // Reset Area Logic
            messageInfo = "Please reselect the template's area in the input table." + messageInfo;
            triggerCellCursorFlag = true;
            break;
        case "1":
            // Add Constraints Logic
            messageInfo = "Please select the constrained cell in the input table." + messageInfo;
            triggerCellCursorFlag = true;
            break;
        case "2-0":
            // Target Cols - Position Based Logic
            extract = {
                byPositionToTargetCols: Array.from({ length: visNode.width * visNode.height }, (_, i) => `C${maxCNum + i}`)
            }
            extractColor = 'positionShallow';
            break;
        case "2-1":
            // Target Cols - Context Based Logic
            extract = {
                byContext: {
                    position: 'above'
                }
            }
            extractColor = 'contextShallow';
            break;
        case "2-2":
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
        case "2-3":
            // Target Cols - No Extract Logic
            tableStore.insertNodeOrPropertyIntoSpecs(undefined, "extract")
            break;
        case "3-0":
        case "3-1":
        case "3-2":
        case "3-3":
            // Add Sub-Template Logic
            messageInfo = "Please select an area in the input table." + messageInfo;
            triggerCellCursorFlag = true;
            break;
        case "4":
            tableStore.deleteChildByPath(tableStore.spec.rawSpecs, visNode.path!);
            tableStore.stringifySpec();
            break;
        case "5":
            tableStore.deleteChildByPath(tableStore.spec.rawSpecs, visNode.path!, tableStore.spec.selectConstrIndex);
            tableStore.stringifySpec();
    }

    if (extract !== null) {
        tableStore.insertNodeOrPropertyIntoSpecs(extract, "extract")
        tableStore.editor.mappingSpec.highlightCode = [...tableStore.getHighlightCodeStartEndLine(extract, tableStore.getNodebyPath(tableStore.spec.rawSpecs, visNode.path!)), extractColor];
    }
    if (triggerCellCursorFlag) {
        message.info(messageInfo);
        tableStore.spec.selectAreaFromNode = e.key;
        document.body.style.cursor = 'cell';
        document.documentElement.style.setProperty('--custom-cursor', 'cell');
        const cells = tableStore.generateHighlightCells(tableStore.spec.selectionsAreaFromLegend, tableStore.spec.selectAreaFromLegend);
        tableStore.highlightTblCells("input_tbl", cells);
    }
    tableStore.tree.contextMenuVisible = false;
}

const treeContainer = ref<HTMLDivElement | null>(null);

function resetZoom() {
    // drawTree(tableStore.spec.visTree);
    // c.transition().duration(750)// .call(tableStore.tree.visInst!.zoomfunc as any, d3.zoomIdentity);
    tableStore.tree.visInst!.resetZoom();
    // 不能对g.matrix元素进行transform操作，因为zoom事件监听器是添加在svg元素上的，所以需要对svg元素进行transform操作
    d3.select('svg.tbl-container g.left').transition().duration(750)
        .call(miniZoom!.transform as any, d3.zoomIdentity); // 重置缩放和平移状态
    d3.select('svg.tbl-container g.right').transition().duration(750)
        .call(tempZoom!.transform as any, d3.zoomIdentity); // 重置缩放和平移状态

}

const drawTree = (data: any) => {
    const treeInstance = new TreeChart([2, 1], '.tree-container', data, tableStore, 1.0, 'h');
    treeInstance.render();
    tableStore.tree.visInst = treeInstance;
};

const typeMap = {
    "null": "Region",
    "position": "Position Based",
    "context": "Context Based",
    "value": "Value Based",
}
const selectMatchExtractArea = (type: TypeColor) => {
    d3.selectAll('.legend').classed('legend-selection', false);
    d3.select(`.legend.legend-${type}`).classed('legend-selection', true);
    const selectionsFromLegend = tableStore.spec.selectionsAreaFromLegend;
    const selectFromLegend = tableStore.spec.selectAreaFromLegend;
    const cells = tableStore.generateHighlightCells(selectionsFromLegend, selectFromLegend);
    tableStore.highlightTblCells("input_tbl", cells);

    if (selectFromLegend.length > selectionsFromLegend.length) {
        selectFromLegend[selectFromLegend.length - 1] = type;
    } else {
        selectFromLegend.push(type);
    }
    // const cursorStyle = `url(${require('@/assets/cell.png')}), auto`;
    document.body.style.cursor = 'cell';
    document.documentElement.style.setProperty('--custom-cursor', 'cell');
    message.info("Now is in " + typeMap[type as keyof typeof typeMap] + " mode. Please select the starting area in the input table.\n Press ESC to cancel the selection mode.");
    // tableStore.input_tbl.instance.rootElement.style.cursor = "cell";
    // (document.querySelector('.truncated') as HTMLElement).style.cursor = "cell"
}



const tblContainer = ref<SVGSVGElement | null>(null);

/*
import { debounce } from 'lodash';

// import { TableCanoniserTemplate } from '@/table-canoniser/dist/grammar';

const debouncedResize = debounce(() => {
    drawTree(tableStore.spec.visTree);
}, 100); // 调整延迟时间，单位为毫秒

const resizeObserver = new ResizeObserver(() => {
    debouncedResize();
});
*/

const handleFormatter = (v: any) => {
    // console.log(v, tableStore.output_tbl.tbl.length);
    // return tableStore.output_tbl.tbl.length === 0 ? '' : isNaN(v) ? 0 : parseInt(v) + 1
    return tableStore.spec.matchedInstNum === 0 ? '' : isNaN(v) ? 0 : parseInt(v) + 1
}

const handleStep = (v: number, info: { offset: number, type: 'up' | 'down' }) => {
    // :max=" tableStore.output_tbl.tbl.length> 0 ? tableStore.spec.visTree.children![0].matchs!.length - 1 : 0"
    // :min="0"
    if (info.type === 'up') {
        if (v <= 1) return;
        tableStore.goToInstance(v - 2);
    } else {
        if (v >= tableStore.spec.visTree.children![0].matchs!.length - 2) return;
        tableStore.goToInstance(v + 2);
    }
}

function handleCodeChange(clickFlag = false) {
    // console.log("handleCodeChange: start", tableStore.editor.mappingSpec.codeUpdateFromEditor);
    if (tableStore.editor.mappingSpec.codeUpdateFromEditor) {
        setTimeout(() => {
            tableStore.editor.mappingSpec.codeUpdateFromEditor = false;
        }, 600)
        if (clickFlag) return;
    }
    if (tableStore.editor.mappingSpec.code !== tableStore.editor.mappingSpec.instance!.getValue()) {
        tableStore.editor.mappingSpec.instance?.setValue(tableStore.editor.mappingSpec.code);
    }
    const setFlag = tableStore.prepareDataAfterCodeChange();
    if (!setFlag) return;
    if (document.body.style.cursor === 'default') {
        drawMinimap(tableStore.input_tbl.tbl.length, tableStore.input_tbl.tbl[0].length, tblContainer.value, tableStore);
    }
    tableStore.transformTablebyCode();  // auto run
    if (tableStore.editor.mappingSpec.triggerCodeChange && tableStore.editor.mappingSpec.highlightCode) {
        // console.log('handleCodeChange-highlightCode', tableStore.editor.mappingSpec.highlightCode);
        tableStore.highlightCode(...tableStore.editor.mappingSpec.highlightCode);
        tableStore.editor.mappingSpec.highlightCode = null;
    }
    setTimeout(() => {
        tableStore.editor.mappingSpec.triggerCodeChange = true;
    }, 600)

    if (tableStore.spec.matchedInstNum === 0) {
        instanceContent.value = 'No matched instance';
        tableStore.tree.instanceIndex = -1;
    } else {
        instanceContent.value = 'Total ' + tableStore.spec.matchedInstNum + ' instance(s)';
    }
    tableStore.computeColInfo("output_tbl");
    drawTree(tableStore.spec.visTree); // 会默认选择第一个节点
    drawTblTemplate(tblContainer.value, tableStore);
    // console.log(tableStore.input_tbl.instance.get);
    // console.log('watch code changed: end');
    tableStore.optimizeMiniTempDistance();
    tableStore.updateCurve();
    // currentInstFlag.value = tableStore.spec.visTree.children!.length > 0 && tableStore.spec.visTree.children![0].matchs !== undefined && tableStore.spec.visTree.children![0].matchs!.length > 0;
    // disableNextFlag.value = tableStore.spec.selectNode === null || tableStore.spec.visTree.children!.length === 0 || tableStore.spec.visTree.children![0].matchs === undefined || tableStore.tree.instanceIndex === tableStore.spec.visTree.children![0].matchs!.length - 1;
}

// const debouncedHandleCodeChange = tableStore.debounce(handleCodeChange, 200); // 200ms 的延迟


// 在Vue 3的<script setup>模式下，不能像在Vue 2中那样直接通过 组件.methods 访问组件的方法。<script setup>模式的代码是模块化的，组件的methods不会自动暴露为一个对象供外部访问。使用 defineExpose 暴露方法
defineExpose({ handleCodeChange });

watch(() => tableStore.editor.mappingSpec.code, (newVal) => {
    // console.log('watch code changed start');
    if (tableStore.editor.mappingSpec.triggerCodeChange) {
        handleCodeChange()
    } else if (tableStore.editor.mappingSpec.highlightCode) {
        tableStore.editor.mappingSpec.instance?.setValue(newVal);
        tableStore.highlightCode(...tableStore.editor.mappingSpec.highlightCode);
        tableStore.editor.mappingSpec.highlightCode = null;
        tableStore.editor.mappingSpec.triggerCodeChange = true;
    }
});

watch(() => tableStore.tree.instanceIndex, () => {
    drawTblTemplate(tblContainer.value, tableStore);
    // disableNextFlag.value = tableStore.spec.selectNode === null || tableStore.spec.visTree.children!.length === 0 || tableStore.spec.visTree.children![0].matchs === undefined || tableStore.tree.instanceIndex === tableStore.spec.visTree.children![0].matchs!.length - 1;
    tableStore.updateCurve();
});

import { drawMinimap, miniZoom } from '@/utils/minimap';
import { drawTblTemplate, tempZoom } from '@/utils/template';
watch(() => tableStore.input_tbl.tbl, (newVal) => {
    // console.log('watch: input_tbl changed: start');
    drawMinimap(newVal.length, newVal[0].length, tblContainer.value, tableStore);
    tableStore.computeColInfo("input_tbl");
});  // , { deep: true }

// watch(() => tableStore.output_tbl.tbl, () => {
//     // console.log('watch: output_tbl changed: start');
//     tableStore.computeColInfo("output_tbl");
// }, { deep: true });

// watch(() => tableStore.spec.visTree.size.height, (newVal) => {
//     console.log('watch tbl size changed: start');
//     const setFlag = tableStore.prepareDataAfterCodeChange();
//     if (!setFlag) return;
//     drawTree(tableStore.spec.visTree);
//     console.log('watch tbl size changed: end');
// });


onMounted(() => {
    document.querySelector('span.ant-input-number-handler-up')!.setAttribute("title", "Previous instance")
    document.querySelector('span.ant-input-number-handler-down')!.setAttribute("title", "Next instance")
});



</script>

<style lang="less">
.goToInstance {
    // margin-right: calc(40vw - 430px);
    width: 58px;
    margin: 0 6px;
}

.tree-container {
    width: 100%;
    height: 100%;

    .type-node:hover {
        stroke: var(--color-selection);
        stroke-width: 3px;
    }

    .type-node.selection {
        stroke: var(--color-selection);
        stroke-width: 3px;
    }
}

.tbl-container {
    width: 100%;
    height: 100%;

    .mini-temp-line {
        fill: none;
        stroke: #0000004D; // var(--color-selectionShallow);
        stroke-width: 2px;
    }

    rect.positionShallow {
        fill: var(--color-positionShallow);
        stroke: var(--color-positionShallow);
    }

    rect.position {
        fill: var(--color-position);
        stroke: var(--color-position);
    }

    rect.contextShallow {
        fill: var(--color-contextShallow);
        stroke: var(--color-contextShallow);
    }

    rect.context {
        fill: var(--color-context);
        stroke: var(--color-context);
    }

    rect.valueShallow {
        fill: var(--color-valueShallow);
        stroke: var(--color-valueShallow);
    }

    rect.value {
        fill: var(--color-value);
        stroke: var(--color-value);
    }

    rect.nullShallow {
        fill: var(--color-nullShallow);
        stroke: var(--color-nullShallow);
    }

    rect.null {
        fill: var(--color-null);
        stroke: var(--color-null);
    }

    rect.selectionShallow {
        fill: var(--color-selectionShallow);
        stroke: var(--color-selectionShallow);
    }

    rect.selection {
        fill: var(--color-selection);
        stroke: var(--color-selection);
    }

    .grid-cell {
        // 不写 rect.grid-cell 是让此选择器的优先级低于 rect.selection 等选择器
        fill: var(--color-cellFill);
        stroke: var(--color-cellStroke);
        stroke-width: 1px;
    }

    .grid-cell:hover {
        stroke-width: 2px;
    }

    .tbl-template-cell:hover {
        stroke: var(--color-selection);
        stroke-width: 2px;
    }
}

.legend-selection {
    border-color: #0a58d9 !important; // var(--color-selection);
}

.legend-null {
    background: var(--color-null);
    border-color: var(--color-null);
    // opacity: 0.5; /* 设置元素的透明度为 0.5 */
}

.legend-position {
    background: var(--color-position);
    border-color: var(--color-position);
}

// .legend-position:hover {
//     background: var(--color-position) !important;
// }

.legend-context {
    background: var(--color-context);
    border-color: var(--color-context);
}

.legend-value {
    background: var(--color-value);
    border-color: var(--color-value);
}

.legend {
    color: white !important;
    border-width: 2.5px;

    // 设置 span 标签内的文本水平和垂直居中
    display: flex;
    align-items: center;
    justify-content: center;

    span {
        text-align: center;
        width: 100%;
        /* 确保文本内容水平居中 */
    }
}

.legend:hover {
    color: white !important;
    border-color: #0a58d9 !important;
}
</style>