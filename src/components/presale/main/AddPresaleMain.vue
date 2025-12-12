<template>
    <el-dialog title="预售信息" v-model="addDialogVisible" width="50%" :before-close="() => { }">
        <span>粘贴自动识别预售信息</span>
        <el-input class="dialog-textarea" type="textarea" :rows="10" placeholder="请输入内容" v-model="pastPresale" clearable
            @input="handleInput">
        </el-input>
        <el-table :data="pastedRows" :key="duplicateGoodsCodes.join(',')" border height="300px"
            :row-class-name="tableRowClassName">
            <el-table-column prop="configDate" label="日期" />
            <el-table-column prop="configTime" label="时间" />
            <el-table-column prop="goodsCode" label="商品编码" />
            <el-table-column prop="goodsName" label="商品名称" />
            <el-table-column prop="shortageReason" label="缺货原因" />
            <el-table-column prop="presaleEndTime" label="预售截止" />
            <el-table-column prop="handlingMethod" label="处理方式" />
            <el-table-column prop="personInCharge" label="负责人" />
        </el-table>
        <template #footer>
            <el-button @click="close">取 消</el-button>
            <el-button type="primary" @click="submitPresale" :disabled="duplicateGoodsCodes.length > 0">确 定</el-button>
        </template>
    </el-dialog>
</template>
<script lang="ts" setup>
import { normalizeDate } from '@/utils/dateUtil';
import http from '@/utils/http';
import { ElMessage } from 'element-plus';
import { ref, computed, watch } from 'vue';

const loading = ref(false);
const duplicateGoodsCodes = ref<string[]>([]);

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'reoload'): void;
}>();

const addDialogVisible = computed({
    get: () => props.visible,
    set: (val: boolean) => {
        emit('update:visible', val);
    }
});

let timer: any = null;
const pastPresale = ref("");

/** 
 * 改成 ref，避免 computed 每次都创建新对象导致 row-class 失效 
 */
const pastedRows = ref<any[]>([]);

/** 
 * 单独的解析函数
 */
function parseRows() {
    if (!pastPresale.value) {
        pastedRows.value = [];
        return;
    }

    pastedRows.value = pastPresale.value
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(line => {
            const cols = line.includes('\t')
                ? line.split('\t')
                : line.split(/\s{2,}/);

            return {
                configDate: normalizeDate(cols[0]).trim(),
                configTime: (cols[1] || "").trim(),
                goodsCode: (cols[2] || "").trim(),
                goodsName: (cols[3] || "").trim(),
                shortageReason: (cols[4] || "").trim(),
                presaleEndTime: (normalizeDate(cols[5]) || "").trim(),
                handlingMethod: (cols[6] || "").trim(),
                personInCharge: (cols[7] || "").trim(),
                create_time: ""
            };
        })
        .filter(r => r.goodsCode !== undefined); // 允许空字符串，过滤 undefined
}

function close() {
    addDialogVisible.value = false;
    pastPresale.value = "";
    pastedRows.value = [];
    duplicateGoodsCodes.value = [];
}

function handleInput() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
        parseRows();              // <-- 新增：每次输入都重新解析
        await checkDuplicates();  // <-- 再检查重复
    }, 400);
}

async function checkDuplicates() {
    duplicateGoodsCodes.value = [];

    if (pastedRows.value.length < 1) {
        loading.value = false;
        return;
    }

    try {
        loading.value = true;
        const resp = await http.post<any[]>('/presaleMain/check', pastedRows.value);

        if (resp && resp.length > 0) {
            duplicateGoodsCodes.value = resp.map(item => String(item.goodsCode));
            ElMessage.warning(`发现 ${resp.length} 条重复数据，已标红显示`);
        }
    } catch (error) {
        console.error("Check failed:", error);
    } finally {
        loading.value = false;
    }
}

async function submitPresale() {
    try {
        await http.post('/presaleMain/batchInsert', pastedRows.value);
        close();
        emit('reoload');
    } catch (error) {
        console.error("Failed to submit presale data:", error);
        close();
    }
}

const tableRowClassName = ({ row }: { row: any }) => {
    return duplicateGoodsCodes.value.includes(String(row.goodsCode))
        ? 'warning-row'
        : '';
};
</script>
<style scoped>
:deep(.warning-row > td) {
    background-color: var(--el-color-danger-light-9) !important;
}

:deep(.warning-row:hover > td) {
    background-color: var(--el-color-danger-light-8) !important;
}
</style>