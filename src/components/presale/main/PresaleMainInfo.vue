<template>
    <el-drawer v-model="visible" :title="title" size="50%" destory-on-close>
        <template #title>
            <div class="drawer-header">
                <span class="title-indicator"></span>
                <span class="drawer-title">{{ title }}</span>
            </div>
        </template>
        <div class="drawer-content">
            <!-- 修改：size="small" 更紧凑，column="3" 一行放更多 -->
            <el-descriptions title="基础信息" :column="4" border size="default">
                <el-descriptions-item label="配置日期">
                    {{ selectedPresaleMain?.configDateTime }}
                </el-descriptions-item>
                <el-descriptions-item label="商品编码">
                    {{ selectedPresaleMain?.goodsCode }}
                </el-descriptions-item>
                <el-descriptions-item label="商品名称" :span="2">
                    {{ selectedPresaleMain?.goodsName }}
                </el-descriptions-item>
                <el-descriptions-item label="处理方式">
                    <el-tag size="small">{{ selectedPresaleMain?.handlingMethod }}</el-tag>
                </el-descriptions-item>

                <el-descriptions-item label="负责人">
                    {{ selectedPresaleMain?.personInCharge }}
                </el-descriptions-item>
                <el-descriptions-item label="预售截止" v-if="selectedPresaleMain?.presaleEndTime">
                    {{ selectedPresaleMain?.presaleEndTime }}
                </el-descriptions-item>
                <el-descriptions-item label="预售截止" v-else>
                    -
                </el-descriptions-item>
                <el-descriptions-item label="缺货原因" :span="3">
                    {{ selectedPresaleMain?.shortageReason || '-' }}
                </el-descriptions-item>
            </el-descriptions>
            <el-tabs v-model="activeTab" style="margin-top: 20px;" @tab-change="handleTabChange">
                <el-tab-pane label="关联ERP编码" name="erp">
                    <el-table>
                        <el-table-column label="ERP编码"></el-table-column>
                        <el-table-column label="商品名称"></el-table-column>
                    </el-table>
                </el-tab-pane>
                <el-tab-pane label="店铺执行情况" name="shop">
                    <el-table>
                        <el-table-column label="店铺名称"></el-table-column>
                        <el-table-column label="任务状态"></el-table-column>
                    </el-table>
                </el-tab-pane>
            </el-tabs>
        </div>
    </el-drawer>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
const title = ref("");
const activeTab = ref("erp");
const props = defineProps<{
    visible: boolean;
    selectedPresaleMain: any;
}>();

const handleTabChange = (tabName: string) => {
    console.log('Tab changed to:', tabName);
    if (tabName === 'erp') {
        loadErpData();
    } else if (tabName === 'shop') {
        loadShopData();
    }
};
const loadErpData = async () =>{
    console.log("load erp data");
}
const loadShopData = async () =>{
    console.log("load shop data");
}

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
}>();
const visible = computed({
    get: () => props.visible,
    set: (val: boolean) => {
        emit('update:visible', val);
    }
});
watch(() => props.visible, (v) => {
    if (v) {
        title.value = `${props.selectedPresaleMain ? props.selectedPresaleMain.goodsName : '未知商品'}`;
    }
});
</script>
<style scoped>
.drawer-header {
    display: flex;
    align-items: center;
}

.title-indicator {
    width: 4px;
    height: 16px;
    background-color: #409EFF;
    /* 主题色 */
    margin-right: 8px;
    border-radius: 2px;
}

.drawer-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}
</style>