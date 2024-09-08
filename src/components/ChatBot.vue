<template>

    <a-modal v-model:open="configFlag" title="Set GPT Role" centered @ok="setConfig" okText="Confirm">
        <a-textarea v-model:value="configRole" :rows="16"></a-textarea>
    </a-modal>

    <a-popover v-model:open="chatUIFlag" trigger="click" placement="topRight" @openChange="visibleChange">
        <template #title>
            <div>
                <span>Chat With GPT</span>
                <span style="right: 12px; position: absolute;">
                    <!-- <a-button type="default" @click="clearHistory">
                        <img :src="require('@/assets/broom.png')" style="height: 100%;">
                    </a-button> -->
                    <a @click="openConfig">Role</a>
                    <a @click="clearHistory">Clear</a>
                    <a @click="hide">Close</a>
                </span>
            </div>
        </template>

        <template #content>
            <div class="chatbot-view">
                <!--
                <div class="chatbot-content">
                    <div v-for="(item, index) in chatList" :key="index">
                        <div v-if="item.role === 'user'">
                            <div class="user">
                                <img :src="require('@/assets/user.png')" style="height: 15px;">
                                <p>{{ item.content }}</p>
                            </div>
                        </div>
                        <div v-else>
                            <div class="gpt">
                                <img :src="require('@/assets/gpt.png')" style="height: 15px;">
                                <p>{{ item.content }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            -->
                <div class="chatbot-content">
                    <ul>
                        <li v-for="(message, index) in chatList" :key="index">
                            <div v-if="message.role === 'user'" class="chat-user">
                                <div class="chat-img"><img src="@/assets/user.png"></div>
                                <!-- <div class="chat-time"><cite>{{ message.role }}<i>{{ message.time }}</i></cite></div> -->
                                <p> {{ message.content }}</p>
                            </div>
                            <div v-else class="chat-gpt">
                                <div class="chat-img"><img src="@/assets/gpt.png"></div>
                                <!-- <div class="chat-time"><cite>{{ message.role }}<i>{{ message.time }}</i></cite></div> -->
                                <p>{{ message.content }}</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <a-input-group compact>
                    <a-textarea v-model:value="chatText" placeholder="input your prompt"
                        style="width: calc(100% - 40px)" :autosize="{ minRows: 1, maxRows: 3 }"></a-textarea>
                    <a-button type="primary" @click="sendMessage">
                        <img :src="require('@/assets/paper-plane.png')" style="height: 100%;">
                    </a-button>
                </a-input-group>
            </div>
        </template>

        <div :class="['meun-switch animated flex-row', uploadflag ? 'active rubberBand off' : 'leave jello']"
            @mouseleave="uploadleave" @mouseenter="uploadenter" v-if="uploadShow">
            <a-tooltip title="Chat With GPT" color="cyan" placement="left" :mouseEnterDelay="1.2"
                :mouseLeaveDelay="0.05">
                <img :src="require('@/assets/robot-assistant.png')" id="chatbot" />
            </a-tooltip>
        </div>
    </a-popover>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
// import { dataManager, getAnswer } from '@/api';
// import { ChatMessage } from '@/types';

interface ChatMessage {
    role: string
    content: string
}


const uploadflag = ref(true);
const uploadShow = ref(true);
const configFlag = ref(false);
const configRole = ref('');

const chatUIFlag = ref(false);  // false
let chatClick = false;   // false
let chatText = ref('');

let chatContentDiv: HTMLDivElement | null = null

let chatList = ref<ChatMessage[]>([]);

const uploadenter = () => {
    uploadflag.value = true;
};

const uploadleave = () => {
    if (!chatClick) {
        uploadflag.value = false;
    };
};

const hide = () => {
    // click "close" button will not trigger visibleChange event
    chatUIFlag.value = false;
    uploadflag.value = false;
    chatClick = false;
};

const visibleChange = (visible: boolean) => {
    uploadflag.value = visible;
    chatClick = visible;
}

const uploadanimated = () => {
    setTimeout(() => {
        uploadShow.value = true;
        setTimeout(() => {
            uploadleave();
        }, 2000);
    }, 1000);
};

function sendMessage() {

    // getAnswer(chatText.value).then((res) => {
    //     chatList.value.push({
    //         role: 'gpt',
    //         content: res.data.answer,
    //     })
    // })

    const chatMessage: ChatMessage = {
        role: 'user',
        content: chatText.value,
    };

    chatList.value.push(chatMessage);
    chatText.value = '';

    // scroll to bottom
    setTimeout(() => {
        if (chatContentDiv) {
            chatContentDiv.scrollTop = chatContentDiv.scrollHeight;
        }
    }, 100);
}

function clearHistory() {
    chatList.value = [];
    // dataManager("clear").then((res) => {
    //     console.log(res.data);
    // })
}

function openConfig() {
    configFlag.value = true;
    // setTimeout(() => {
    //     const roleConfig = document.querySelector('.ant-modal-content');
    //     console.log("roleConfig", roleConfig);
    //     roleConfig?.addEventListener('click', (event) => {
    //         chatUIFlag.value = true;
    //         uploadflag.value = true;
    //         chatClick = true;
    //     })
    // }, 100)
}

function hideConfig() {
    configFlag.value = false;
}

function setConfig() {
    // dataManager("role", configRole.value).then((res) => {
    //     console.log(res.data);
    // })
    configFlag.value = false;
}

onMounted(() => {
    uploadanimated();
    chatContentDiv = document.querySelector('.chatbot-content');
    // dataManager("role").then((res) => {
    //     configRole.value = res.data.role;
    // });

    // document.addEventListener('click', (event) => {
    //     const target = event.target as HTMLElement;
    //     console.log(target, target.id, target.className);
    //     if (target.id !== 'chatbot' && target.className != 'ant-popover-content') {
    //         chatClick = false;
    //         uploadleave();
    //     }
    // });
});

</script>


<style lang="less">
@img-width: 18px;
@img-margin: 6px;

.ant-popover-content {
    position: relative;
    right: 35px;
    // pointer-events: auto; // Set the popover content to receive events

    // * {
    //     pointer-events: none; // Set all children elements to not receive events
    // }

    .ant-popover-title {
        a {
            margin-left: 6px;
        }
    }

    .chatbot-view {
        width: 450px;
        height: 500px;
        overflow: auto;
        padding: 8px;
        // border: 1px solid #ccc;

        .chatbot-content {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            height: calc(100% - 32px);

            img {
                height: @img-width;
                margin-top: 5px;
            }

            p {
                word-break: break-all;
                white-space: pre-wrap; // keep new line
                margin-bottom: 5px;
                padding: 4px;
            }

            .chat-gpt {
                display: flex;
                flex-direction: row;

                img {
                    margin-right: @img-margin;
                }

                p {
                    margin-right: @img-margin + @img-width;
                }
            }

            .chat-user {
                display: flex;
                flex-direction: row-reverse;

                img {
                    margin-left: @img-margin;
                }

                p {
                    margin-left: @img-margin + @img-width;
                    background-color: #f0f0f0;
                    padding: 4px 8px;
                    border-radius: 5px;
                    box-shadow: 0 0 3px rgba(0, 0, 0, 0.1);
                }
            }
        }

        .ant-input-group {
            position: absolute;
            bottom: 18px;
            width: 450px;
        }
    }

    button {
        padding: 4px 8px;
    }
}

.off {
    -webkit-animation: 0.8s seconddiv;
    animation: 0.8s seconddiv;
    background: transparent;
}

/* @keyframes seconddiv {
    0% {
        transform: scale(1.4, 1.4);
    }

    10% {
        transform: scale(1, 1);
    }

    25% {
        transform: scale(1.2, 1.2);
    }

    50% {
        transform: scale(1, 1);
    }

    70% {
        transform: scale(1.2, 1.2);
    }

    100% {
        transform: scale(1, 1);
    }
} */

@keyframes seconddiv {
    0% {
        transform: scale(1, 1);
    }

    10% {
        transform: scale(1.1, 1.1);
    }

    25% {
        transform: scale(1.2, 1.2);
    }

    50% {
        transform: scale(1, 1);
    }

    75% {
        transform: scale(1.2, 1.2);
    }

    100% {
        transform: scale(1.1, 1.1);
    }
}

.meun-switch {
    position: fixed;
    bottom: 60px;
    right: 0px;
    z-index: 2001;
    cursor: pointer;
    width: 90px;
    /* height: 150px; */
    padding: 5px;
    transition: all 0.2s;

    &.leave {
        right: -50px;
        transition: right 0.8s 0.2s;
        /* 设置离开的动画延迟时间为 1s，持续时间为 0.2s */
    }

    &.active {
        right: 0;
    }

    &:hover {
        transform: scale(1.1);
    }

    img {
        width: 90px;
        /* height: 90px; */
    }
}
</style>
