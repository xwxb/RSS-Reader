<template>
    <v-app>
        <!-- 侧栏 -->
        <v-navigation-drawer v-model="drawer" app>
            <v-list>

                <!-- 标题 -->
                <v-list-item>
                    <v-list-item-title class="title">
                        RSS Reader
                    </v-list-item-title>
                </v-list-item>

                <v-divider></v-divider>

                <!-- 功能按钮区 -->
                <v-list-item>
                    <v-btn color="blue" class="mdi-plus-btn" icon="mdi-plus" @click="addSubscription" />
                </v-list-item>

                <v-divider></v-divider>

                <!-- 订阅列表 -->
                <v-list-item @click="selectItem({ title: 'All' })" :class="{ 'selected-item': selected === 'All' }">
                    <v-list-item-title>All</v-list-item-title>
                </v-list-item>

                <v-list-item v-for="(item, index) in items" :key="index" @click="selectItem(item)"
                    :class="{ 'selected-item': selected == item.title }">
                    <v-row>
                        <v-col cols="9">
                            <v-list-item-title>{{ item.title }}</v-list-item-title>
                        </v-col>
                        <v-col cols="3">
                            <v-app-bar-nav-icon class="mdi-minus-btn" icon="mdi-minus" @click="removeItem(item)" />
                        </v-col>
                    </v-row>
                </v-list-item>

            </v-list>
        </v-navigation-drawer>

        <v-app-bar app>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
            <v-toolbar-title>{{ selected }}</v-toolbar-title>

        </v-app-bar>

        <v-main>

            <!-- 添加订阅弹窗 -->
            <v-dialog v-model="dialog" max-width="500px">
                <v-card>
                    <v-card-title>
                        <span class="headline">Add Subscription</span>
                    </v-card-title>

                    <v-card-text>

                        <v-row>
                            <v-text-field v-model="title" label="Title"></v-text-field>
                        </v-row>
                        <v-row>
                            <v-text-field v-model="url" label="URL"></v-text-field>
                        </v-row>

                    </v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="blue darken-1" text @click="dialog = false">
                            Cancel
                        </v-btn>
                        <v-btn color="blue darken-1" text @click="submitAddition">
                            Submit
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- 解析呈现 XML 内容 -->
            <v-container>
                <v-row>
                    <v-col v-for="(entry, index) in getEntries(parsedData)" :key="index">
                        <v-card>
                            <v-card-title>
                                {{ entry.title }}
                            </v-card-title>
                            <v-card-text>
                                {{ entry.description || entry.summary }}
                            </v-card-text>
                            <v-card-actions>
                                <v-btn text :href="entry.link" target="_blank">Read More</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>

        </v-main>

    </v-app>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
    name: 'App',
    methods: {
        getEntries(parsedData) {
            if (parsedData?.rss?.channel?.item) {
                // Handle the original format
                return parsedData.rss.channel.item.map((entry) => ({
                    title: entry.title,
                    description: entry.description,
                    link: entry.link
                }));
            } else if (parsedData?.feed?.entry) {
                // Handle the new format
                return parsedData.feed.entry.map((entry) => ({
                    title: entry.title,
                    description: entry.summary,
                    link: entry.link
                }));
            } else {
                return [];
            }
        }
    },
    setup() {
        const drawer = ref(true);
        const items = ref([]);
        const dialog = ref(false);
        const title = ref('');
        const url = ref('');
        const selected = ref('All');
        const parsedData = ref();
        const parseAPI = "http://localhost:3000/api/parse"

        const selectItem = (item) => {
            console.log(item)
            selected.value = item.title
            console.log(selected)

            if (item.title === 'All') { // 如果选中的是 All
                console.log("AAALLL")
                parsedData.value = items.value.map(item => { // 解析所有 items 中 item 的值到 prasedData 中
                    axios.get(item.url)
                        .then(response => {
                            parseString(response.data, (err, result) => {
                                if (err) {
                                    console.error(err);
                                } else {
                                    parsedData.value.push(result);
                                }
                            });
                        })
                        .catch(error => {
                            console.error(error);
                        });
                })
            } else if (item.url) { // 否则只解析当前 item
                axios.get(parseAPI, { params: { url: item.url } })
                    .then(response => {
                        parsedData.value = JSON.parse(response.data.body);
                        console.log(parsedData.value)
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        };


        const addSubscription = () => {
            dialog.value = true;
        };

        const submitAddition = () => {
            items.value.push({ title: title.value, url: url.value });
            localStorage.setItem('items', JSON.stringify(items.value));
            dialog.value = false;

            // 清空输入框
            title.value = '';
            url.value = '';
        }

        const removeItem = (item) => {
            items.value = items.value.filter(elem => elem !== item);
            localStorage.setItem('items', JSON.stringify(items.value));
        }

        onMounted(() => {
            const storedItems = localStorage.getItem('items');
            if (storedItems) {
                items.value = JSON.parse(storedItems);
            } else {
                items.value = [
                    { title: 'BBC', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
                    { title: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
                    { title: 'ruanyf', url: 'https://www.ruanyifeng.com/blog/atom.xml' },
                ];
                localStorage.setItem('items', JSON.stringify(items.value));
            }
        });

        return {
            drawer,
            items,
            dialog,
            title,
            url,
            selected,
            selectItem,
            addSubscription,
            submitAddition,
            removeItem,
            parsedData
        };
    },
};
</script>


<style>
.mdi-plus-btn {
    margin-bottom: 10px;
}

.mdi-minus-btn {
    margin-top: 10px;
}

.v-list-item {
    text-align: center;
}

.selected-item {
    background-color: rgba(0, 0, 255, 0.1) !important;
}
</style>
