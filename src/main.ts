import { createApp } from 'vue'
import App from './App.vue'

import { createPinia } from 'pinia'

const pinia = createPinia()
const app = createApp(App)

import { Select, Upload, Button, Tabs, Tooltip, Popover, Input, Modal, Space, Dropdown, Menu, Form, Row, Col, Radio, Divider, Flex, InputNumber, Checkbox } from "ant-design-vue";
// import 'ant-design-vue/dist/reset.css';

app.use(pinia).use(Select).use(Tabs).use(Button).use(Upload)
    .use(Tooltip).use(Popover).use(Input).use(Modal).use(Space).use(Dropdown).use(Menu).use(Form).use(Row).use(Col).use(Radio).use(Divider).use(Flex).use(InputNumber).use(Checkbox);

// A Vue component for including inline SVG icons from different popular iconpacks easily.
// https://oh-vue-icons.js.org/docs   // MdFitscreenOutlined
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { BiUpload, BiDownload, LaRocketSolid, BiArrowClockwise, IoArrowUndoOutline, IoArrowRedoOutline, BiChevronLeft, BiChevronRight } from "oh-vue-icons/icons";

addIcons(BiUpload, BiDownload, LaRocketSolid, BiArrowClockwise, IoArrowUndoOutline, IoArrowRedoOutline, BiChevronLeft, BiChevronRight);

// app.config.globalProperties.$basePath = process.env.BASE_URL;

app.component("v-icon", OhVueIcon);

// import ElementPlus from 'element-plus'
// app.use(ElementPlus)
// import { ElButton, ElDropdown, ElSwitch } from 'element-plus'
// app.use(ElButton).use(ElDropdown).use(ElSwitch)

// import 'element-plus/dist/index.css'

app.mount('#app')