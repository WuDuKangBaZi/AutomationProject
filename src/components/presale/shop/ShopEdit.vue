<template>
    <el-dialog v-model="shopEditVisible" width="350px">
        <template #title>
            <div class="dialog-title">
                <span>{{ dialogTitle }}</span>
            </div>
        </template>
        <el-form v-model="shopInfo" label-width="80px" class="shop-edit-form">
            <!-- 表单内容 -->
            <el-form-item label="店铺名称">
                <el-input placeholder="请输入店铺名称" v-model="shopInfo.shopName" />
            </el-form-item>
            <el-form-item label="登录账号">
                <el-input placeholder="请输入登录账号" v-model="shopInfo.loginAccount" />
            </el-form-item>
            <el-form-item label="登录密码">
                <el-input placeholder="请输入登录密码" show-password v-model="shopInfo.loginPassword" />
            </el-form-item>
            <el-form-item label="验证手机号">
                <el-input placeholder="请输入验证手机号" v-model="shopInfo.verifyPhone" />
            </el-form-item>
            <el-form-item label="备注">
                <el-input type="textarea" placeholder="请输入备注" v-model="shopInfo.remark" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="close">取消</el-button>
                <el-button type="primary" @click="save">保存</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script lang="ts" setup>
import http from '@/utils/http';
import { computed, ref, watch } from 'vue';
interface ShopInfo {
    id: string;
    shopName: string;
    loginAccount: string;
    loginPassword: string;
    verifyPhone?: string;
    remark: string;
}
const shopInfo = ref<ShopInfo>({
    id: '',
    shopName: '',
    loginAccount: '',
    loginPassword: '',
    verifyPhone: '',
    remark: ''
});
const dialogTitle = ref('未触发的title');

const props = defineProps<{
    visible: boolean;
    shopInfo?: any;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'close'): void;
}>();

const shopEditVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});
watch(() => props.visible, (v) => {
    if (v) {
        if (props.shopInfo && props.shopInfo.id) {
            dialogTitle.value = '编辑店铺';
            shopInfo.value = { ...props.shopInfo };
        } else {
            dialogTitle.value = '新增店铺';
            shopInfo.value = {
                id: '',
                shopName: '',
                loginAccount: '',
                loginPassword: '',
                verifyPhone: '',
                remark: ''
            };
        }
    }
})
function close() {
    emit('update:visible', false);
}
async function save() {
    console.log("Saving shop info: ", shopInfo.value);
    // 这里可以添加保存逻辑，比如调用接口保存店铺信息
    if (shopInfo.value.id) {
        const resp = await http.post('/shops/update',shopInfo.value);
        console.log("Update shop response: ", resp);
    } else {
        const resp = await http.post('/shops/add/预售', shopInfo.value);
        console.log("Add shop response: ", resp);
    }
    close();
    emit('close');
}
</script>
<style scoped></style>
