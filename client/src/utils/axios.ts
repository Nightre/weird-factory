import axios from "axios";
import { useToast } from "vuestic-ui";
import { Preferences } from '@capacitor/preferences';
import { getToken } from "@/stores/user";

const axiosIns = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    timeout: 1000 * 5,
});
let hasErrorToast = false
// 添加请求拦截器，自动添加 token
axiosIns.interceptors.request.use(
    async (config) => {
        const token = await getToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosIns.interceptors.response.use(
    (response) => {
        // 成功响应处理
        if (!response.data.success && response.data.errors) {
            const { notify } = useToast();
            notify({
                message: response.data.errors,
                color: 'warning'
            });
        }
        return response;
    },
    (error) => {
        const { notify } = useToast();
        const { config, response } = error;
        const customMessage = config?.customErrorMessage;

        // 如果明确指定不需要通知，则直接拒绝
        if (config?.noNotift) {
            return Promise.reject(error);
        }

        // 错误消息优先级：自定义消息 > 服务器返回的错误 > 默认状态码消息
        let message = customMessage ||
            (response?.data?.errors) ||
            getDefaultErrorMessage(error);

        if (!hasErrorToast) {
            hasErrorToast = true
            notify({
                message,
                color: 'warning',
                onClose: () => { hasErrorToast = false }
            });
        }

        return Promise.reject(error);
    }
);

// 抽取默认错误消息函数
function getDefaultErrorMessage(error: any) {
    if (!error.response) {
        return '无法连接至服务器，请检测网络';
    }

    const { status } = error.response;
    const errorMessages: Record<string, string> = {
        "400": '请求参数错误',
        "401": '无权限',
        "404": '资源丢失',
        "500": '服务器内部错误，请联系管理员'
    };

    return errorMessages[status] || '请求失败';
}

export { axiosIns as axios };
