<template>
  <input type="file" ref="fileInput" style="display: none" @change="importSubscriptions">
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
          <v-row>
            <v-col cols="4">
              <v-btn color="blue" class="mdi-plus-btn" icon="mdi-plus" @click="addSubscription"/>
            </v-col>
            <v-col cols="4">
              <v-btn color="blue" class="mdi-plus-btn" icon="mdi-cog" @click="openSettings"/>
            </v-col>
            <v-col cols="4">
              <v-btn color="blue" class="mdi-plus-btn" icon="mdi-export" @click="exportSubscriptions"/>
            </v-col>
          </v-row>

        </v-list-item>

        <v-divider></v-divider>

        <!-- 订阅列表 -->
        <v-list-item v-for="(item, index) in items" :key="index" @click="selectItem(item)"
                     :class="{ 'selected-item': selected == item.title }">
          <v-row>
            <v-col cols="9">
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-col>
            <v-col cols="3">
              <v-app-bar-nav-icon class="mdi-minus-btn" icon="mdi-minus" @click="removeItem(item)"/>
            </v-col>
          </v-row>
        </v-list-item>


        <v-file-input
            label="Import Sub List"
            accept=".json,*"
            prepend-icon="mdi-import"
            @change="importSubscriptions"
        />
        <!--            这个很奇怪，好像只有这个 event 是可用的-->

      </v-list>
    </v-navigation-drawer>


    <v-app-bar app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>{{ selected }}</v-toolbar-title>

    </v-app-bar>

    <v-main>

      <!-- 添加订阅弹窗 -->
      <v-dialog v-model="ASDialog" max-width="500px">
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
            <v-btn color="blue darken-1" @click="ASDialog = false">
              Cancel
            </v-btn>
            <v-btn color="blue darken-1" @click="submitAddition">
              Submit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 设置弹窗 -->
      <v-dialog v-model="settingDialog" max-width="500px">
        <v-card>
          <v-card-title>
            <span class="headline">Setting</span>
          </v-card-title>

          <v-card-text>

            <v-row>
              <v-text-field v-model="timeInterval" label="Update Interval(min)"></v-text-field>
            </v-row>

          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="settingDialog = false">
              Cancel
            </v-btn>
            <v-btn color="blue darken-1" text @click="submitSetting">
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
import {ref, onMounted} from 'vue';
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
    },
  },
  setup() {
    const drawer = ref(true);
    const items = ref([]);

    const ASDialog = ref(false);

    const settingDialog = ref(false);
    const timeInterval = ref('');

    const title = ref('');
    const url = ref('');
    const selected = ref('');
    const parsedData = ref();

    const localParseAPI = "http://localhost:3000/api/parse"
    const remoteParseAPI = "http://lrssrd.netlify.app/api/parse"

    const config = useRuntimeConfig()
    // console.log(config.public.parseAPI)

    const selectItem = (item) => {
      // console.log(item)
      selected.value = item.title
      // console.log(selected)

      if (item.url) { // 否则只解析当前 item
        // 打开数据库
        const dbPromise = indexedDB.open('rssReader', 1);

        // 配置 idb 更新
        dbPromise.onupgradeneeded = function (event) {
          const db = event.target.result;
          // 创建对象存储
          const objectStore = db.createObjectStore('rssData', {keyPath: 'url'});

          // 创建索引
          objectStore.createIndex('url', 'url', {unique: true})
        };


        dbPromise.onsuccess = function (event) {
          const db = event.target.result;

          // 创建事务
          const transaction = db.transaction(['rssData'], 'readwrite');
          const objectStore = transaction.objectStore('rssData');
          const request = objectStore.get(item.url);

          request.onsuccess = function (event) {
            if (request.result) {
              console.log("Date already exist, Get data from indexedDB")

              // 通过 item.url 获取待解析的数据
              parsedData.value = JSON.parse(request.result.data);

              console.log(parsedData.value)
            } else {
              console.log("No data record, fetch from remote API")
              axios.get(config.public.parseAPI, {params: {url: item.url}})
                  .then(response => {
                    parsedData.value = JSON.parse(response.data.body);
                    // console.log(response.data.body)
                    // console.log(parsedData.value)

                    // 创建事务进行存储
                    const transaction = db.transaction(['rssData'], 'readwrite');
                    const objectStore = transaction.objectStore('rssData');

                    // 如果是存解析后的数据似乎有不支持的格式
                    objectStore.add({url: item.url, data: response.data.body});
                  })
                  .catch(error => {
                    console.error(error);
                  });
            }

            // 将当前时间存为最后更新时间存入 localStorage
            localStorage.setItem('lastCacheTime', new Date().getTime());

            // 查看数据库存储的内容
            console.log("traverse db content")
            objectStore.openCursor().onsuccess = function (event) {
              const cursor = event.target.result;

              if (cursor) {
                console.log(cursor.value); // 输出当前游标指向的数据
                cursor.continue(); // 移动游标到下一条数据
              } else {
                console.log('No more data'); // 游标遍历完毕
              }
            };

          };

        };
      }
    };

    const addSubscription = () => {
      ASDialog.value = true;
    };
    const openSettings = () => {
      settingDialog.value = true;
    };

    const submitAddition = () => {
      items.value.push({title: title.value, url: url.value});
      localStorage.setItem('items', JSON.stringify(items.value));
      ASDialog.value = false;

      // 清空输入框
      title.value = '';
      url.value = '';
    }

    const submitSetting = () => {
      // 将 timeInterval 存入 localStorage
      localStorage.setItem('timeInterval', timeInterval.value)
      settingDialog.value = false;
    }

    const removeItem = (item) => {
      items.value = items.value.filter(elem => elem !== item);
      localStorage.setItem('items', JSON.stringify(items.value));
    }

    // 导入和导出订阅相关函数


    const handleFileSelect = () => {
      this.$refs.fileInput.click();
    }

    const importSubscriptions = (e) => {
      // console.log(e.target.files[0]);
      const file = e.target.files[0];
      const reader = new FileReader();

      // 设置载入 json 文件后的回调函数
      reader.onload = function (e) {
        // console.log(e.target.result)
        const data = JSON.parse(e.target.result);
        items.value = data;
        localStorage.setItem('items', JSON.stringify(items.value));
      };
      // 启动 reader
      reader.readAsText(file);
    };

    const exportSubscriptions = () => {
      const data = JSON.stringify(items.value);
      const blob = new Blob([data], {type: 'text/plain'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subscriptions.json';
      a.click();
    };

    const clearCache = () => {
      // 从 localStorage 获取最后缓存的时间
      const lastCacheTime = localStorage.getItem('lastCacheTime');
      // 也是获取，但是需要字符串转时间戳
      timeInterval.value = localStorage.getItem('timeInterval')

      // timeInterval 是用户输入的分钟数，使用这个变量，计算当前时间和 lastCacheTime 的差值
      // 如果大于 timeInterval 对应的时间，那么则清空 IndexDb 所有内容

      console.log("lastCacheTime: ", lastCacheTime)
      console.log("user setting interval: ", timeInterval.value)
      if (lastCacheTime && timeInterval.value) {
        const currentTime = new Date().getTime();
        const timeDiff = (currentTime - lastCacheTime) / 1000 / 60;
        if (timeDiff > timeInterval.value) {
          console.log("clear cache")
          // 打开数据库
          const dbPromise = indexedDB.open('rssReader', 1);

          // 配置 idb 更新
          dbPromise.onupgradeneeded = function (event) {
            const db = event.target.result;
            // 创建对象存储
            const objectStore = db.createObjectStore('rssData', {keyPath: 'url'});

            // 创建索引
            objectStore.createIndex('url', 'url', {unique: true})
          };

          dbPromise.onsuccess = function (event) {
            const db = event.target.result;

            // 创建事务
            const transaction = db.transaction(['rssData'], 'readwrite');
            const objectStore = transaction.objectStore('rssData');
            const request = objectStore.clear();

            request.onsuccess = function (event) {
              console.log("clear cache success")
            }
          }
        }
      }
    }

    onMounted(() => {
      const storedItems = localStorage.getItem('items');
      if (storedItems) {
        items.value = JSON.parse(storedItems);
      } else {
        items.value = [
          {title: 'BBC', url: 'http://feeds.bbci.co.uk/news/rss.xml'},
          {title: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'},
          {title: 'ruanyf', url: 'https://www.ruanyifeng.com/blog/atom.xml'},
        ];
        localStorage.setItem('items', JSON.stringify(items.value));
      }
      clearCache();

      // 向 localhost:8080/uc 发起请求，如果返回 {"update":true}
      // 则调用浏览器 API 发起通知（不是 alert），提示用户有订阅源更新
      axios.get("http://127.0.0.1:8080/cu", {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      })
          .then(response => {
            if (!response.data.update) {
              // 通知
              // if (Notification.permission === 'granted') {
              //   const notification = new Notification('RSS Reader', {
              //     body: '有订阅源更新',
              //     icon: 'https://vuejs.org/images/logo.png'
              //   });
              // }
              alert("有订阅源更新！") // 不知道为什么通知不起作用，暂时用 alert 代替
            }
          })
          .catch(error => {
            console.error(error);
          });
    });

    return {
      drawer,
      items,
      ASDialog,
      settingDialog,
      title,
      url,
      selected,
      selectItem,
      addSubscription,
      submitAddition,
      submitSetting,
      removeItem,
      openSettings,
      parsedData,
      timeInterval,
      exportSubscriptions,
      importSubscriptions,
      handleFileSelect
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

.selected-item {
  background-color: rgba(0, 0, 255, 0.1) !important;
}
</style>

