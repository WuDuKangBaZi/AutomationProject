<template>
    <div class="presale-view">
        <el-card class="search-card">
            <el-form label-width="80px" class="search-form">
                <!-- 表单字段容器 -->
                <div class="form-fields">
                    <el-form-item label="配置日期">
                        <el-date-picker type="date" v-model="formData.configDate" value-format="YYYY-MM-DD" />
                    </el-form-item>

                    <el-form-item label="预售编码">
                        <el-input placeholder="请输入预售编码" v-model="formData.goodsCode" />
                    </el-form-item>

                    <el-form-item label="处理方式" style="width: 200px;">
                        <el-select placeholder="请选择处理方式" v-model="formData.handlingMethod">
                            <el-option label="全部" value="全部" />
                            <el-option label="预售" value="预售" />
                            <el-option label="取消预售" value="取消预售" />
                            <el-option label="下架" value="下架" />
                        </el-select>
                    </el-form-item>
                </div>
                <div class="form-actions">
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                    <el-button type="success" small @click="openAddDialog">批量导入</el-button>
                    <el-button type="success" link @click="shoowShopConfig">配置店铺</el-button>
                    <el-button type="warning" small link>导出结果</el-button>
                </div>
            </el-form>
            <el-divider />
            <el-table :data="searchData" style="width: 100%; margin-top: 20px;" empty-text="暂无数据" show-overflow-tooltip="true">
                <el-table-column label="配置日期">
                    <template #default="scope">
                        {{ scope.row?.configDate }} {{ scope.row?.configTime }}
                    </template>
                </el-table-column>
                <el-table-column prop="goodsCode" label="商品编码" />
                <el-table-column prop="shortageReason" label="缺货原因" />
                <el-table-column prop="presaleEndTime" label="预售截止时间" />
                <el-table-column prop="handlingMethod" label="处理方式" />
                <el-table-column prop="personInCharge" label="负责人" />
               <el-table-column label="操作">
                <template #default="scope">
                    <div class="action-buttons">
                        <el-button link size="small" type="primary">
                            查看详细
                        </el-button>
                    </div>
                </template>
               </el-table-column> 
            </el-table>
            <el-pagination style="margin-top: 20px;" layout="prev, pager, next" :total="searchData.length" />
            
        </el-card>
    </div>
    <ShopConfig v-model:visible="shopConfigVisible" />
    <AddPresaleMain v-model:visible="addPresaleDialogVisible" />
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import ShopConfig from '@/components/presale/shop/ShopConfig.vue';
import AddPresaleMain from '@/components/presale/main/AddPresaleMain.vue';
import http from '@/utils/http';
const shopConfigVisible = ref(false);
const addPresaleDialogVisible = ref(false);
const formData = reactive({
    configDate: "",
    goodsCode: '',
    handlingMethod: ''
});
const searchData = ref<any[]>([]);
function shoowShopConfig() {
    console.log("show shop config");
    shopConfigVisible.value = true;
}
function openAddDialog() {
    addPresaleDialogVisible.value = true;
}
async function onSearch() {
    console.log("on search");
    const resp = await http.post<any>('/presaleMain/search',formData);
    console.log("search response:",resp);    
    searchData.value = resp || [];
}
function onTabChange(name: string) {
    console.log("tab changed to ", name);
}
onMounted(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    formData.configDate = `${year}-${month}-${day}`;
    formData.handlingMethod = '全部';
})

</script>
<style scoped>
.search-card {
    padding: 16px;
}

/* 表单字段容器 */
.search-form .form-fields {
    display: flex;
    flex-wrap: wrap;
    /* 超出宽度自动换行 */
    gap: 16px;
    /* 字段之间间距 */
}


/* 按钮组 */
.search-form .form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
}

.search-form.form-fields.el-form-item {
    flex: 0 0 auto;
    /* min-width: 200px; */
    margin-right: 20px;
}
</style>