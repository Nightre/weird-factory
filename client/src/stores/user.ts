import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';

export interface UserInfo {
  name: string;
  id: string;
}

interface LoginResponse {
  token: string;
  user: UserInfo;
}

const EMPTY = {};
const isCapacitor = import.meta.env.VITE_TYPE === 'mobile'; // 判断是否为 Capacitor 环境
export const getToken = async () => {
  return import.meta.env.VITE_TYPE == "mobile" ?
    (await Preferences.get({ key: 'token' })).value :
    localStorage.getItem('token');
}
export const useUserStore = defineStore('user', () => {
  const isLogin = ref(false);
  const userInfo = reactive<UserInfo | {}>(EMPTY);

  // 初始化函数：根据环境选择存储方式
  async function initialize() {
    if (isCapacitor) {
      const { value: token } = await Preferences.get({ key: 'token' });
      const { value: userInfoStr } = await Preferences.get({ key: 'userInfo' });
      isLogin.value = Boolean(token);
      Object.assign(userInfo, userInfoStr ? JSON.parse(userInfoStr) : EMPTY);
    } else {
      isLogin.value = Boolean(localStorage.getItem('token'));
      Object.assign(
        userInfo,
        JSON.parse(localStorage.getItem('userInfo') ?? JSON.stringify(EMPTY))
      );
    }
  }

  // 在 store 创建时执行初始化
  initialize();

  // 设置登录状态和用户信息
  async function setLogin(data: LoginResponse) {
    Object.assign(userInfo, data.user);
    if (isCapacitor) {
      await Preferences.set({ key: 'userInfo', value: JSON.stringify(data.user) });
      if (data.token) {
        await Preferences.set({ key: 'token', value: data.token });
      }
    } else {
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
    }
    isLogin.value = true;
  }

  // 设置登录状态（仅修改 isLogin，不影响存储）
  function setLoginStatus(status: boolean) {
    isLogin.value = status;
  }

  // 登出并清除数据
  async function logout() {
    Object.assign(userInfo, EMPTY);
    if (isCapacitor) {
      await Preferences.remove({ key: 'userInfo' });
      await Preferences.remove({ key: 'token' });
    } else {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
    }
    isLogin.value = false;
  }

  // 获取用户 ID
  const getSelfId = () => {
    if (isLogin.value) {
      const userId = (userInfo as UserInfo).id;
      return userId;
    }
  };

  return { userInfo, isLogin, setLogin, setLoginStatus, logout, getSelfId };
});