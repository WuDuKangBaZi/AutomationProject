<template>
    <div id="swagger-container" style="height: 100vh;"></div>
</template>

<script>
import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle';
import 'swagger-ui-dist/swagger-ui.css';
import { useAuthStore } from '@/stores/auth';

export default {
    name: 'SwaggerView',
    mounted() {
        const authStore = useAuthStore();
        const token = authStore.token;
        let baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        baseUrl = baseUrl.replace(/\/api\/?$/, '');
        if (!token) {
            alert('请先登录系统！');
            this.$router.push('/login');
            return;
        }
        const specUrl = `${baseUrl}/v3/api-docs`;
        SwaggerUI({
            dom_id: '#swagger-container',
            supportedSubmitMethods: [],
            defaultModelsExpandDepth: -1,
            url: specUrl,
            // 关键：拦截所有请求，自动添加 Authorization 头
            requestInterceptor: (req) => {
                req.headers.Authorization = `Bearer ${token}`;
                return req;
            },
            responseInterceptor: (res) => {
                return res;
            },
            presets: [
                SwaggerUI.presets.apis,
                SwaggerUI.SwaggerUIStandalonePreset
            ],
            layout: 'BaseLayout',
            docExpansion: 'list',
            filter: true,
            deepLinking: true
        });
    }
};
</script>
<style scoped></style>