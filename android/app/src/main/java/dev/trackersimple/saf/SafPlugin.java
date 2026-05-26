package dev.trackersimple.saf;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SafPlugin")
public class SafPlugin extends Plugin {

    private static final int PICK_FOLDER_REQUEST = 1001;
    private PluginCall pendingCall;

    @PluginMethod
    public void pickFolder(PluginCall call) {
        pendingCall = call;
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        getActivity().startActivityForResult(intent, PICK_FOLDER_REQUEST);
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        try {
            String uri = call.getString("uri");
            String name = call.getString("name");
            String data = call.getString("data");

            if (uri == null || name == null || data == null) {
                call.reject("uri, name, and data are required");
                return;
            }

            SafHandler.writeFile(getContext(), uri, name, data);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        try {
            String uri = call.getString("uri");
            String name = call.getString("name");

            if (uri == null || name == null) {
                call.reject("uri and name are required");
                return;
            }

            String data = SafHandler.readFile(getContext(), uri, name);
            JSObject result = new JSObject();
            result.put("data", data);
            call.resolve(result);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void hasPermission(PluginCall call) {
        try {
            String uri = call.getString("uri");

            if (uri == null) {
                call.reject("uri is required");
                return;
            }

            boolean valid = SafHandler.hasPermission(getContext(), uri);
            JSObject result = new JSObject();
            result.put("valid", valid);
            call.resolve(result);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode == PICK_FOLDER_REQUEST && pendingCall != null) {
            if (resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
                Uri treeUri = data.getData();

                final int takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
                getContext().getContentResolver().takePersistableUriPermission(treeUri, takeFlags);

                JSObject result = new JSObject();
                result.put("uri", treeUri.toString());
                pendingCall.resolve(result);
            } else {
                pendingCall.reject("Selección cancelada");
            }
            pendingCall = null;
        }
    }
}
