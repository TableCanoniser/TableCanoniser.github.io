<template>
    <div class="icons-container">
        <div style="width: 50px; display: inline-block;"></div>
        <div class="icon-scroll">
            <div :style="{ width: sortedColInfos.reduce((sum, colInfo) => sum + colInfo.width, 0) + 'px' }">
                <div v-for="colInfo in sortedColInfos" :key="colInfo.index" :style="{ width: colInfo.width + 'px' }"
                    class="icon-column">
                    <img v-for="icon in colInfo.sortedIcons" :key="icon.type" :src="icons[icon.type]"
                        :alt="`${icon.type} icon`" class="icon"
                        :title="`${icon.count} ${langConfig[lang].others.colType} ${langConfig[lang].others[icon.type]}`"
                        @click="handleIconClick(colInfo.index, colInfo[icon.type])" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import stringIcon from '@/assets/string.png';
import numberIcon from '@/assets/number.png';
import nullIcon from '@/assets/minus.png';

import { useTableStore } from "@/store/table";
import { lang, langConfig } from "@/utils/lang";
// const { colInfos } = defineProps<{ colInfos: ColInfo[] }>();
const { tblType } = defineProps<{ tblType: "input_tbl" | "output_tbl" }>();  // | "transformScript"

const tableStore = useTableStore();

// Example data
// const colInfos = [
//     { index: 0, string: [0, 1], number: [2], null: [], width: 250 },
//     { index: 1, string: [], number: [0, 1, 2], null: [1], width: 150 },
//     { index: 2, string: [0], number: [], null: [1, 2], width: 200 },
//     { index: 3, string: [0], number: [1], null: [2], width: 300 },
// ];

// Define icons map
const icons = {
    string: stringIcon,
    number: numberIcon,
    none: nullIcon
};

type IconType = keyof typeof icons;

// Compute sorted column info  tableStore[tblType].colInfo
const sortedColInfos = computed(() => {
    return tableStore[tblType].colInfo.map(colInfo => {
        const iconCounts = [
            { type: 'string' as IconType, count: colInfo.string.length },
            { type: 'number' as IconType, count: colInfo.number.length },
            { type: 'none' as IconType, count: colInfo.none.length }
        ]
            .filter(icon => icon.count > 0) // Remove types with zero count
            .sort((a, b) => b.count - a.count); // Sort by count in descending order

        return {
            ...colInfo,
            sortedIcons: iconCounts
        };
    });
});

function handleIconClick(col: number, rows: number[]) {
    const className = 'selection';
    const cells = rows.map(row => ({ row, col, className }));
    tableStore.highlightTblCells(tblType, cells, null, true, false);
    const correspondingTblCells = tableStore.in_out_mapping({ "0": cells.map(cell => [cell.row, cell.col]) }, tblType, className);

    if (tblType === "input_tbl") {
        tableStore.highlightMinimapCells(cells);
        tableStore.highlightTblCells("output_tbl", correspondingTblCells);
    } else {
        tableStore.highlightMinimapCells(correspondingTblCells);
        tableStore.highlightTblCells("input_tbl", correspondingTblCells);
    }
}
</script>

<style scoped>
.icons-container {
    width: 100%;
    height: 18px;
    /* 确保 .parent 不会超出 .grandparent 的宽度 */
    /* overflow: auto; */
    /* 启用水平滚动 */
    /* white-space: nowrap; */
    /* 防止子元素换行 */
    /* flex-shrink: 0; */
    /* 防止 .parent 由于子元素过宽而扩展宽度 */
}

.icon-column {
    display: inline-block;
    text-align: center;
    /* align-items: center; The display: inline-block property prevents align-items from having an effect. */
    /* Center icons vertically within the column */
}

.icon-scroll {
    display: inline-block;
    width: calc(100% - 50px);
    overflow: auto;

    -ms-overflow-style: none;
    /* IE 10+ */
    scrollbar-width: none;
    /* Firefox */
}

.icon-scroll::-webkit-scrollbar {
    display: none;
}

.icon {
    width: 13px;
    /* Set appropriate icon size */
    height: 13px;
    margin: 0 1px;
    cursor: pointer;
    /* Horizontal spacing between icons */
}

.icon:hover {
    width: 14px;
    height: 14px;
}
</style>