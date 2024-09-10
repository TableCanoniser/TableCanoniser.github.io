<template>
  <div id="panel">
    <div class="system-name">
      <span id="system_name">TableCanoniser</span>
      <span style="left: 20px; position: absolute;">
        <span style="font-size: 16px; font-weight: normal; margin-right: 5px">Cases:</span>
        <a-select :value="currentCase" :options="caseOption" size="small" @change="handleCaseChange"
          @mouseenter="selectEnter" @mouseleave="selectLeave" :open="isDropdownOpen" style="width: 137px;"></a-select>
      </span>
      <span style="right: 20px; position: absolute;">
        <a-button-group>
          <a-button size="small" @click="undo" :disabled="undoFlag">
            <v-icon name="io-arrow-undo-outline" scale="0.9"></v-icon>
            <span style="margin-left: 5px">Undo</span>
          </a-button>
          <a-button size="small" @click="redo" :disabled="redoFlag">
            <v-icon name="io-arrow-redo-outline" scale="0.9"></v-icon>
            <span style="margin-left: 5px">Redo</span>
          </a-button>
        </a-button-group>
      </span>
    </div>
    <!-- <ChatBot /> -->
    <div class="main-views">
      <div class="column" style="flex: 12">
        <div style="flex: 1; display: flex; min-height: 0px;">
          <InOutTable />
        </div>
        <div class="divider-h" @mousedown="getNeighborEls($event, 'height')" title="Drag to resize"></div>
        <div style="flex: 1; display: flex; min-height: 0px;">
          <PatternVis ref="patternVis" />
        </div>
      </div>
      <div class="divider-w" @mousedown="getNeighborEls($event, 'width')" title="Drag to resize"></div>
      <div class="column" style="flex: 5;">
        <div class="view">
          <div class="view-content">
            <a-tabs v-model:activeKey="codePanel" type="card">
              <template #rightExtra>
                <a-button size="small" style="margin-right: 10px; margin-bottom: 10px;" @click="transformTablebyCode">
                  <v-icon name="la-rocket-solid" scale="0.85"></v-icon>
                  <span>Run</span>
                </a-button>
              </template>

              <a-tab-pane key="1">
                <template #tab>
                  <span style="font-size: 15px"
                    title="The mapping specification that transforms the input table to the output table">
                    Specification
                  </span>
                </template>
                <CodeView codeType="mappingSpec" />
              </a-tab-pane>
              <a-tab-pane key="2">
                <template #tab>
                  <span style="font-size: 15px"
                    title="A tree data structure that contains the AreaInfo of all matched instances, starting from the root area">
                    Matched Instances [{{ tableStore.spec.matchedInstNum }}]
                  </span>
                </template>
                <CodeView codeType="rootArea" />
              </a-tab-pane>
            </a-tabs>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import InOutTable from "@/components/InOutTable.vue";
import CodeView from "@/components/CodeView.vue";
import PatternVis from "@/components/PatternVis.vue";
// import ChatBot from "@/components/ChatBot.vue";

import { typeMapColor, TypeColor } from '@/utils/style';
for (const key in typeMapColor) {
  document.documentElement.style.setProperty(`--color-${key}`, typeMapColor[key as TypeColor]);
}
document.documentElement.style.setProperty('--custom-cursor', 'default');

import { getNeighborEls, onDrag, endDrag } from '@/utils/dragLayout';

import { useTableStore } from "@/store/table";
const tableStore = useTableStore();

const caseOption = computed(() => {
  return tableStore.caseList.map((v) => {
    return { value: v, label: v };
  });
})

const currentCase = computed(() => tableStore.currentCase);

const codePanel = ref("1");
// const loading = ref<boolean>(false);

const undoFlag = computed(() => tableStore.spec.undoHistory.length === 0);
const redoFlag = computed(() => tableStore.spec.redoHistory.length === 0);

// 撤销操作
function undo() {
  tableStore.editor.mappingSpec.errorMark = null
  const lastSpec = tableStore.spec.undoHistory.pop();
  if (lastSpec !== undefined) {
    tableStore.spec.redoHistory.push(tableStore.editor.mappingSpec.code);
    tableStore.editor.mappingSpec.code = lastSpec;
  }
}

// 重做操作
function redo() {
  tableStore.editor.mappingSpec.errorMark = null
  const lastUndo = tableStore.spec.redoHistory.pop();
  if (lastUndo !== undefined) {
    tableStore.spec.undoHistory.push(tableStore.editor.mappingSpec.code);
    tableStore.editor.mappingSpec.code = lastUndo;
  }
}

// 获取组件 PatternVis 的实例引用
const patternVis = ref();
function transformTablebyCode() {
  // loading.value = true;
  // tableStore.transformTablebyCode();
  // triggerRef(ref(tableStore.editor.mappingSpec.code));
  // 即使新值和旧值相同，重新赋值依然会触发 watch：
  // PatternVis.methods!.handleCodeChange(tableStore.editor.mappingSpec.code);
  patternVis.value.handleCodeChange(true); // handleCodeChange();
  // loading.value = false;
  if (tableStore.editor.mappingSpec.highlightCode) {
    tableStore.highlightCode(...tableStore.editor.mappingSpec.highlightCode);
    tableStore.editor.mappingSpec.highlightCode = null;
    tableStore.editor.mappingSpec.triggerCodeChange = true;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    // 按下 ESC 键时清除所有高亮、选中等
    tableStore.editor.mappingSpec.decorations?.clear();
    tableStore.input_tbl.instance.deselectCell();
    tableStore.output_tbl.instance.deselectCell();
    tableStore.input_tbl.instance.updateSettings({ cell: [] });
    tableStore.output_tbl.instance.updateSettings({ cell: [] });
    tableStore.highlightMinimapCells([]);

    tableStore.clearStatus("tree");
    tableStore.clearStatus("matchArea");
    tableStore.clearStatus("miniHighlight");

  }
}

function handleCaseChange(value: string) {
  tableStore.currentCase = value;
  isDropdownOpen.value = false;
}

const isDropdownOpen = ref(false);
let timeHandler: any = null;
let dropdownListEle: any = null;

function selectEnter(e: any, v: any) {
  isDropdownOpen.value = true;
  if (dropdownListEle === null) {
    setTimeout(() => {
      dropdownListEle = document.querySelector(".rc-virtual-list-holder-inner");
      dropdownListEle?.addEventListener('mouseenter', () => {
        if (timeHandler !== null) {
          clearTimeout(timeHandler);
          timeHandler = null;
        }
        isDropdownOpen.value = true;
      })
      dropdownListEle?.addEventListener('mouseleave', () => {
        isDropdownOpen.value = false;
      })
    }, 100)
  }
}

function selectLeave(e: any, v: any) {
  timeHandler = setTimeout(() => {
    isDropdownOpen.value = false;
  }, 200);
}

onMounted(() => {
  tableStore.loadCaseData(tableStore.currentCase);
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", endDrag);
});

</script>

<style lang="less">
#panel {
  font-family: "Arial", sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #f0f0f0;
  /* Background color for the whole panel */
}

.system-name {
  font-size: 23px;
  font-weight: bold;
  width: calc(100vw - 40px);
  margin-top: 2px;
  //   margin: 20px 0;
  padding: 10px 15px;
  background-color: #3498db;
  /* System name background color */
  color: white;
  /* System name text color */
  //   border-radius: 8px;
  text-align: center;

  .el-switch__label {
    color: #fff;
    // font-size: 30px;
  }

  .el-switch__label.is-active {
    color: #7bed9f;
  }
}

.main-views {
  display: flex;
  justify-content: space-between;
  width: calc(100vw - 10px);
  padding: 1px;
  box-sizing: border-box;
  border: 1px solid #ccc;

  // 这是用来让图标和文字有一定间距
  svg.ov-icon+span {
    margin-left: 5px;
  }

  .column {
    height: calc(100vh - 56px);
  }

  .view {

    // // height: calc(100vh - 80px);
    .ant-tabs {
      height: 100%;

      .ant-tabs-content {
        height: 100%;
      }
    }
  }

}

.column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.view {
  //   margin: 8px 2px 2px 8px;
  padding: 10px 8px 5px 8px;
  // border: 1px solid #ccc;
  //   border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  /* View background color */
  display: flex;
  flex-direction: column;
  flex: 1;
}

.view-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #2c3e50;
  overflow: auto;
  /* View title text color */
}

.view-content {
  // overflow-y: auto;
  // overflow: hidden;
  // height: calc(100% - 40px);
  min-height: 0px;
  flex: auto;
}

.mapping-details {
  display: flex;
  flex-direction: column;
}


.ant-message-notice-content {
  white-space: pre-wrap;
  /* 使 \n 换行符生效 */
  text-align: left;
  /* 左对齐 */
  max-width: 700px;
}

.ant-btn-default {
  transition: 0s;
}

.ant-btn-default:hover {
  svg path {
    stroke: #4494fc;
  }
}

.ant-btn-default:disabled {
  background-color: #ffffff;
  border-color: #d9d9d9;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
  cursor: not-allowed;
  color: rgba(0, 0, 0, 0.25);

  svg path {
    stroke: rgba(0, 0, 0, 0.25);
  }
}

.divider-w {
  width: 2px;
  cursor: col-resize;
  background-color: #ccc;
}

.divider-h {
  height: 2px;
  cursor: row-resize;
  background-color: #ccc;
}
</style>
