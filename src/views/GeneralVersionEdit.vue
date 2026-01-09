<template>
    <div class="general-version-edit">
        <el-form label-width="80px" class="search-form" style="flex: 0 0 auto;">
            <div class="form-fields">
                <el-form-item label="配置日期">
                    <el-date-picker type="date" v-model="formData.configDate" value-format="YYYY-MM-DD"
                        placeholder="选择日期" />
                </el-form-item>
                <el-form-item label="文件名">
                    <el-input placeholder="请输入文件名|支持模糊搜索" v-model="formData.fileName" />
                </el-form-item>
                <el-form-item label="商品名称">
                    <el-input placeholder="请输入商品名称|支持模糊搜索" v-model="formData.productName" />
                </el-form-item>
            </div>
            <div class="form-actions">
                <el-button type="primary">
                    <el-icon>
                        <Search />
                    </el-icon>&nbsp;搜索
                </el-button>
                <el-button type="success">
                    <el-icon>
                        <Plus />
                    </el-icon>&nbsp;新增通版改新任务
                </el-button>
                <el-button type="warning" link @click="shopConfigVisible = true">
                    <el-icon>
                        <Setting />
                    </el-icon>&nbsp;店铺配置
                </el-button>
                <el-button type="warning" link>
                    <el-icon>
                        <Download />
                    </el-icon>&nbsp;导出结果
                </el-button>
            </div>
        </el-form>
        <el-divider style="flex: 0 0 auto; margin: 8px 0;" />
        <!-- 表格 + 分页 -->
        <div class="table-wrapper" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <el-table :data="tempData" style="flex: 1; width: 100%;" empty-text="暂无数据" :show-overflow-tooltip="true"
                :cell-style="{ textAlign: 'center' }">
                <el-table-column label="日期" widht="175px" prop="configDate" align="center" width="175px" />
                <el-table-column label="文件名" prop="fileNae" align="center" width="200px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.fileName)">{{
                            scope.row.fileName }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="新版编码" prop="newCode" align="center" width="150px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.newCode)">{{
                            scope.row.newCode }}</span>
                    </template>
                </el-table-column>
                <!-- <el-table-column label="旧版编码" prop="oldCode" align="center" width="150px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.oldCode)">{{
                            scope.row.oldCode }}</span>
                    </template>
                </el-table-column> -->
                <el-table-column label="商品名称" prop="productName" align="center" wdith="300px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.productName)">{{
                            scope.row.productName }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="新版定价" prop="newPrice" align="center" width="120px" />
                <el-table-column label="类型" align="center" prop="type" width="100px" />
                <el-table-column label="备注" align="center" prop="remark" width="200px">
                    <template #default="scope">
                        <span style="cursor:pointer; color: #409EFF;" @click="copyText(scope.row.remark)">{{
                            scope.row.remark }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="运营备注" align="center" width="150px">
                    <template #default="scope">
                        <el-button type="primary" link size="small" @click="drawerVisible = true" >查看/修改</el-button>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="150px">
                    <template #default="scope">
                        <el-button type="primary" link size="small">编辑</el-button>
                        <el-button type="danger" link size="small">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
   <el-drawer title="运营备注详情" v-model="drawerVisible" size="35%">
        <div>这里是运营备注的详细内容，可以进行查看和修改。</div>
   </el-drawer> 
    <ShopConfig v-model:visible="shopConfigVisible" shopType="通版改新" />
</template>
<script setup lang="ts">
import ShopConfig from '@/components/shop/ShopConfig.vue';
import { Search, Plus, Download, Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
const shopConfigVisible = ref(false);
const drawerVisible = ref(false);
const formData = reactive({
    fileName: '',
    configDate: "",
    productName: ""
});
const tempData = [
    {
        fileName: '文件A.xlsx',
        newCode: 'NB123456',
        oldCode: 'OB654321',
        productName: '商品A',
        newPrice: '99.99',
        type: '类型1',
        remark: '这是备注信息A'
    },
    {
        fileName: '文件B.xlsx',
        newCode: 'NB223344',
        oldCode: 'OB443322',
        productName: '商品Basdasdasdadasdasdas',
        newPrice: '149.99',
        type: '类型2',
        remark: '这是备注信息B12312312312312312'
    }
]
function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard:', text);
        ElMessage({
            message: '已复制到剪贴板',
            type: 'success',
            duration: 500
        });
    }).catch(err => {
        console.error('Could not copy text: ', err);
        ElMessage({
            message: '复制到剪切板失败!',
            type: 'error',
            duration: 3000
        });
    });
}
</script>
<style scoped>
.general-version-edit {
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.search-form .form-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.search-form .form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    margin-left: 10px;
}

.table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.task-summary {
    font-size: 14px;
    white-space: nowrap;
    /* 防止换行 */
    display: inline-flex;
    align-items: center;
}
</style>