package org.agsa.simulator;

import android.app.Activity;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Collections;

/**
 * Limited native vibrator test companion; not a certified flight-training app.
 * Only the Academy's HTTPS simulator page can send haptic messages.
 * No generic addJavascriptInterface bridge is exposed to untrusted frames.
 */
public final class MainActivity extends Activity {
 private static final String ORIGIN = "https://magnusclarkson-star.github.io";
 private static final String PAGE = "/aviation-ground-school-academy/flight-sim.html";
 private static final String URL = ORIGIN + PAGE;
 private WebView webView;
 private Vibrator vibrator;
 private long lastEffectMs = -10000L;

 @Override public void onCreate(Bundle savedInstanceState) {
  super.onCreate(savedInstanceState);
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
   VibratorManager manager = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
   vibrator = manager == null ? null : manager.getDefaultVibrator();
  } else {
   vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
  }
  webView = new WebView(this);
  setContentView(webView, new ViewGroup.LayoutParams(
   ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

  final WebSettings settings = webView.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);
  settings.setAllowContentAccess(false);
  settings.setMediaPlaybackRequiresUserGesture(true);
  settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  WebView.setWebContentsDebuggingEnabled(false);

  webView.setWebViewClient(new WebViewClient() {
   @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
    if (!request.isForMainFrame()) return false;
    if (isSimulatorPage(request.getUrl())) return false;
    Toast.makeText(MainActivity.this,
      "This test app only opens the official Academy simulator.", Toast.LENGTH_SHORT).show();
    return true;
   }
  });
  if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
   WebViewCompat.addWebMessageListener(webView, "AGSAHapticsNative",
    Collections.singleton(ORIGIN), this::onNativeMessage);
  } else {
   Toast.makeText(this, "Native vibration bridge unavailable. Browser fallback remains.",
     Toast.LENGTH_LONG).show();
  }
  webView.loadUrl(URL);
 }

 private boolean isSimulatorPage(Uri uri) {
  return uri != null && "https".equals(uri.getScheme()) &&
    "magnusclarkson-star.github.io".equals(uri.getHost()) &&
    PAGE.equals(uri.getPath()) && (uri.getPort() == -1 || uri.getPort() == 443);
 }

 private void onNativeMessage(WebView sender, WebMessageCompat message, Uri origin,
                              boolean isMainFrame, JavaScriptReplyProxy reply) {
  if (!isMainFrame || sender != webView || origin == null ||
    !"https".equals(origin.getScheme()) ||
    !"magnusclarkson-star.github.io".equals(origin.getHost()) ||
    !isSimulatorPage(Uri.parse(webView.getUrl())) || vibrator == null ||
    !vibrator.hasVibrator() || message.getType() != WebMessageCompat.TYPE_STRING) return;

  final String data = message.getData();
  if (data == null || data.length() > 200) return;
  try {
   JSONObject request = new JSONObject(data);
   String type = request.optString("type", "");
   if ("cancel".equals(type)) {
    vibrator.cancel();
    return;
   }
   if (!"vibrate".equals(type) || !hasWindowFocus()) return;
   final JSONArray pattern = request.optJSONArray("pattern");
   if (pattern == null || pattern.length() < 1 || pattern.length() > 5) return;
   long[] timings = new long[pattern.length() + 1];
   timings[0] = 0;
   long sum = 0;
   for (int i = 0; i < pattern.length(); i++) {
    if (!(pattern.get(i) instanceof Integer)) return;
    long value = pattern.getLong(i);
    if (value < 1 || value > 180) return;
    timings[i + 1] = value;
    sum += value;
   }
   if (sum > 500) return;
   final long now = SystemClock.uptimeMillis();
   if (now - lastEffectMs < 250) return; // prevent rapid repeated vibration
   lastEffectMs = now;
   // No repeats or indefinite vibrations, even if a message is malformed.
   vibrator.vibrate(VibrationEffect.createWaveform(timings, -1));
  } catch (Exception ignored) {
   // Invalid messages are ignored; they cannot access any other system API.
  }
 }

 @Override protected void onPause() {
  if (vibrator != null) vibrator.cancel();
  if (webView != null) webView.onPause();
  super.onPause();
 }
 @Override protected void onResume() {
  super.onResume();
  if (webView != null) webView.onResume();
 }
 @Override protected void onDestroy() {
  if (vibrator != null) vibrator.cancel();
  if (webView != null) {
   webView.loadUrl("about:blank");
   webView.destroy();
   webView = null;
  }
  super.onDestroy();
 }
 @Override public void onBackPressed() {
  // Keep the companion on the trusted official simulator; let the system exit.
  super.onBackPressed();
 }
}
