<template>
    <div ref="editorWrapper" class="editor-container"></div>
</template>

<script setup lang="ts">
import * as monaco from "monaco-editor";
import { onMounted, onUnmounted, ref } from "vue";
import { useTableStore } from "@/store/table";


const { codeType } = defineProps<{ codeType: "mappingSpec" | "rootArea" }>();  // | "transformScript"

const tableStore = useTableStore();

const editorDefaultOptions = {
    value: '',
    language: 'typescript', // tableStore.editor[codeType].language,
    theme: 'vs',
    fontSize: 14,
    glyphMargin: false,
    automaticLayout: false, // Automatic layout may cause "ResizeObserver loop completed with undelivered notifications." warning. To avoid this, set automaticLayout to false
    autoIndent: 'advanced',
    readOnly: codeType === "rootArea" ? true : false,
    minimap: {
        enabled: codeType === "rootArea" ? true : false,
    },
    lineNumbersMinChars: 1,
    scrollBeyondLastLine: false, // Prevent scrolling beyond the last line
    wordWrap: 'on', // 设置自动换行，这样就不会有左右滚动条了
    // wordWrapColumn: 80, // 当一行代码超过 80 个字符时，编辑器将会在接近第 80 列的地方自动进行换行，而不是等到超出编辑器宽度才进行换行。
    padding: {
        bottom: 50, // Adjust the bottom padding to 50px
    },
};

const editorWrapper = ref<HTMLElement | null>(null);

let editor: monaco.editor.IStandaloneCodeEditor | null = null;

// let mappingSpec: string = ""

const regex = /\s+/g;
const areStringEqual = (str1: string, str2: string) => (str1.replace(regex, '') === str2.replace(regex, ''));

const updateCode = (newCode: string) => {
    if (areStringEqual(tableStore.editor.mappingSpec.code, newCode)) return; // 忽略换行还有空格之后比较字符串是否相等
    tableStore.spec.undoHistory.push(tableStore.editor.mappingSpec.code);
    // 当执行新的操作时，重做历史应当清空
    tableStore.spec.redoHistory = [];
    tableStore.editor.mappingSpec.codeUpdateFromEditor = true;
    tableStore.editor.mappingSpec.code = newCode;
}

defineExpose({ updateCode });

const initEditor = () => {
    if (editor) { // if editor is already initialized, dispose it first
        editor.dispose();
    }
    const editorOptions = {
        ...editorDefaultOptions,
        value: tableStore.editor[codeType].code,
    };
    editor = monaco.editor.create(editorWrapper.value!, editorOptions as monaco.editor.IEditorConstructionOptions);  // ! means that editorWrapper.value is not null

    const debounceUpdateCode = tableStore.debounce(() => {
        tableStore.checkGrammarError();
        if (tableStore.editor.mappingSpec.errorMark !== null) return

        if (tableStore.editor.mappingSpec.autoRun) {
            updateCode(editor!.getValue());
        }
    }, 1000);

    // editor.onDidBlurEditorText(updateCode);
    // 失焦事件优先于别的按钮的点击事件
    editor.onDidChangeModelContent(() => {
        tableStore.editor.mappingSpec.decorations?.clear();
        debounceUpdateCode();
    });
};

/*
watch(() => tableStore.editor[codeType].code, (newVal) => {
    // console.log("watch editor code", codeType);
    editor?.setValue(newVal);  // update editor content; ? means if editor is not null then call setValue, else do nothing
});
*/

// import { debounce } from 'lodash';
const handleResize = tableStore.debounce(() => {
    if (editor) {
        editor.layout();
    }
}, 300); // Adjust the delay time, in milliseconds

// 监听整个窗口的大小变化，通常会引发更多不必要的回调执行，可能会影响性能。
// window.addEventListener('resize', handleResize);

// const resizeObserver = new ResizeObserver(() => {
//     // console.log("Resize observed", entries);
//     try { handleResize(); }
//     catch (e) { console.log(e) }
// });
const resizeObserver = new ResizeObserver(handleResize);

if (codeType === "mappingSpec") {

    // https://microsoft.github.io/monaco-editor/playground.html?source=v0.50.0#example-extending-language-services-configure-javascript-defaults

    const libUri = "ts:grammar.ts";
    // Check if model already exists
    const existingModel = monaco.editor.getModels().find(model => model.uri.toString() === libUri);

    if (!existingModel) {
        fetch('./grammar.ts').then((response) => {
            response.text().then((tsContent) => {

                // validation settings
                monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: false,
                });

                // compiler options
                monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ES2015,
                    allowNonTsExtensions: true,
                });
                monaco.languages.typescript.javascriptDefaults.addExtraLib(tsContent, libUri);

                // When resolving definitions and references, the editor will try to use created models.
                // Creating a model for the library allows "peek definition/references" commands to work with the library.
                monaco.editor.createModel(tsContent, "typescript", monaco.Uri.parse(libUri));
            });
        });
    }
}

onMounted(() => {
    initEditor();
    // 可以精确地监听元素大小变化，避免了全局 resize 事件可能带来的性能问题，尤其是当页面上有多个需要监听大小变化的元素时。
    resizeObserver.observe(editorWrapper.value!);
    if (editor) {
        tableStore.editor[codeType].instance = editor;
        if (codeType === "mappingSpec") {
            tableStore.editor.mappingSpec.decorations = editor.createDecorationsCollection([]);
        }
    }
});

onUnmounted(() => {
    // 没有这段代码会导致Code Panel 中的const option 重复被声明
    if (editor) {
        editor.dispose();
    }
});


</script>


<style lang="less">
.editor-container {
    width: 100%;
    height: 100%;
    /* You can adjust the height as needed */

    .nullShallow {
        // background-color: var(--color-null);
        background-color: var(--color-nullRGBA); // var(--color-nullShallow);
    }

    .positionShallow {
        // background-color: var(--color-position);
        background-color: var(--color-positionRGBA); // var(--color-positionShallow);
    }

    .valueShallow {
        // background-color: var(--color-value);
        background-color: var(--color-valueRGBA); // var(--color-valueShallow);
    }

    .contextShallow {
        // background-color: var(--color-context);
        background-color: var(--color-contextRGBA); // var(--color-contextShallow);
    }

    .selectionShallow {
        // background-color: var(--color-selection);
        background-color: var(--color-selectionRGBA); // var(--color-selectionShallow);
    }

}
</style>