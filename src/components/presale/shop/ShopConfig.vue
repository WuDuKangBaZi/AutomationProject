<template>
    <el-dialog width="70%" v-model="shopConfigVisible" :before-close="() => { }" :show-close="false"
        :close-on-click-modal="true" :close-on-press-escape="false">
        <template #title>
            <div class="dialog-title">
                <span class="title-text">店铺信息配置</span>
                <span class="title-text-small">在本列表中已启用的店铺将会自动分配任务</span>
                <el-button type="primary" size="small" link @click="addShop"> <el-icon class="mr-1">
                        <Plus />
                    </el-icon> 新增店铺</el-button>
            </div>
        </template>
        <el-table :data="shopConfigList">
            <el-table-column prop="shopName" label="店铺名称" width="150px" />
            <el-table-column prop="loginAccount" label="登录账号" width="300px" />
            <el-table-column prop="loginPassword" label="登录密码" width="150px" />
            <el-table-column prop="verifyPhone" label="验证手机号" width="150px" />
            <el-table-column prop="status" label="是否启用" width="100px">
                <template #default="scope">
                    <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" active-test="启用"
                        inactive-text="禁用" inline-prompt @change="(val: any) => handleStatusChange(scope.row, val)" />
                </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
            <el-table-column prop="actions" label="操作" width="100px">
                <template #default="scope">
                    <div class="action-buttons">
                        <el-button link size="small" @click="openEdit(scope.row)" type="primary">
                            <el-icon>
                                <Edit />
                            </el-icon>
                        </el-button>
                        <el-button link size="small" @click="deleteConfig(scope.row)" type="danger">
                            <el-icon>
                                <Delete />
                            </el-icon>
                        </el-button>
                    </div>
                </template>
            </el-table-column>
        </el-table>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="closeEdit">关闭</el-button>
            </span>
        </template>
    </el-dialog>
    <ShopEdit v-model:visible="shopEditVisible" @close="loadShopConfig" :shopInfo="selectedShopInfo" />
</template>
<script lang="ts" setup>
import { computed, ref, toRef, watch } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import ShopEdit from './ShopEdit.vue';
import http from '@/utils/http';
import { Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
const shopConfigList = ref<Array<any>>([]);
const shopEditVisible = ref(false);
const selectedShopInfo = ref<any>(null);

const props = defineProps<{
    visible: boolean;
}>();
const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
}>();
const shopConfigVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});
function close() {
    emit('update:visible', false);
}
function closeEdit() {
    close();
}
async function handleStatusChange(row: any, val: number) {
    const resp = await http.post<any>(`/shops/disable/${row.id}/${val}`);
    loadShopConfig();
}
function addShop() {
    shopEditVisible.value = true;
}

async function loadShopConfig() {
    try {
        const resp = await http.post<any>('/shops/list/预售');
        shopConfigList.value = resp || [];
    } catch (error) {
        ElMessage.error(`加载店铺配置失败,\n${error}`);
        console.log("Failed to load shop config: ", error);
    }
}
function openEdit(row: any) {
    console.log("Open edit for ", row);
    selectedShopInfo.value = row;
    shopEditVisible.value = true;

}
async function deleteConfig(row: any) {
    try {
        ElMessageBox.confirm(`确定要删除店铺 ${row.shopName} 吗？`, '确认删除', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }).then(async () => {
            const resp = await http.post<any>(`/shops/delete/${row.id}`);
            console.log("Delete response: ", resp);
            loadShopConfig();
        }).catch((err) => {
            if (err === "cancel") {
                console.log("Delete cancelled");
                return;
            }
            console.log("Delete error: ", err);
        });
    } catch (error) {
        console.log("Failed to delete shop config: ", error);
    }
}
watch(() => props.visible, (v) => {
    if (v) {
        loadShopConfig();
    }
})
</script>
<style scoped>
.dialog-title {
    display: flex;
    justify-content: space-between;
    /* 标题靠左，按钮靠右 */
    align-items: center;
    /* 垂直居中 */
    padding-right: 20px;
    /* 防止按钮紧贴关闭图标（如果有的话） */
}

.title-text {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.mr-1 {
    margin-right: 4px;
}

.action-buttons {
    display: flex;
}

.title-text-small {
    font-size: 12px;
    color: #909399;
    margin-left: 16px;
}
</style>