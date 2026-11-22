package com.xttopbio.altima;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public final class MainActivity extends Activity {
    private static final String HOST = "altima-career-voice-test.onrender.com";
    private static final Uri DEMO = Uri.parse("https://" + HOST + "/#demo");
    private static final int MEDIA_PERMISSIONS = 10;
    private WebView web;
    private PermissionRequest pending;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.rgb(11, 33, 67));
        Button openAr = new Button(this);
        openAr.setText("Quest 3 · Otwórz AR w przeglądarce");
        openAr.setAllCaps(false);
        openAr.setOnClickListener(view -> openExternal(DEMO));
        layout.addView(openAr);

        web = new WebView(this);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (isAltima(request.getUrl())) return false;
                if (request.isForMainFrame() && "https".equals(request.getUrl().getScheme())) {
                    openExternal(request.getUrl());
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (!isAltima(request.getOrigin()) || pending != null) {
                    request.deny();
                    return;
                }
                List<String> required = new ArrayList<>();
                for (String resource : request.getResources()) {
                    String permission = nativePermission(resource);
                    if (permission == null) {
                        request.deny();
                        return;
                    }
                    if (checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) {
                        required.add(permission);
                    }
                }
                if (required.isEmpty()) {
                    grantApprovedResources(request);
                    return;
                }
                pending = request;
                requestPermissions(required.toArray(new String[0]), MEDIA_PERMISSIONS);
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pending == request) pending = null;
            }
        });
        layout.addView(web, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(layout);
        web.loadUrl(DEMO.toString());
    }

    private static boolean isAltima(Uri url) {
        return url != null && "https".equals(url.getScheme()) && HOST.equals(url.getHost())
            && (url.getPort() == -1 || url.getPort() == 443);
    }

    private static String nativePermission(String resource) {
        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) return Manifest.permission.RECORD_AUDIO;
        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) return Manifest.permission.CAMERA;
        return null;
    }

    private void grantApprovedResources(PermissionRequest request) {
        if (!isAltima(Uri.parse(web.getUrl() == null ? "" : web.getUrl()))) {
            request.deny();
            return;
        }
        List<String> approved = new ArrayList<>();
        for (String resource : request.getResources()) {
            String permission = nativePermission(resource);
            if (permission != null && checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) {
                approved.add(resource);
            }
        }
        if (approved.isEmpty()) request.deny();
        else request.grant(approved.toArray(new String[0]));
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code != MEDIA_PERMISSIONS || pending == null) return;
        PermissionRequest request = pending;
        pending = null;
        grantApprovedResources(request);
    }

    private void openExternal(Uri url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, url).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "Brak przeglądarki dla tego adresu.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onDestroy() {
        if (pending != null) pending.deny();
        pending = null;
        if (web != null) {
            ((LinearLayout) web.getParent()).removeView(web);
            web.destroy();
        }
        super.onDestroy();
    }
}
