package com.nightscratch.wonderfactory;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.view.View;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // 设置沉浸式模式
    getWindow().getDecorView().setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // 隐藏导航栏
      | View.SYSTEM_UI_FLAG_FULLSCREEN     // 隐藏状态栏
      | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY // 沉浸式模式，用户滑动边缘短暂显示 UI 后自动隐藏
    );
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      // 当窗口获得焦点时，确保沉浸式模式持续生效
      getWindow().getDecorView().setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        | View.SYSTEM_UI_FLAG_FULLSCREEN
        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      );
    }
  }
}