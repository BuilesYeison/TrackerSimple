package dev.trackersimple.saf;

import android.content.Context;
import android.net.Uri;
import android.util.Base64;

import androidx.documentfile.provider.DocumentFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

public class SafHandler {

    public static boolean hasPermission(Context context, String uriString) {
        Uri treeUri = Uri.parse(uriString);
        List<android.content.UriPermission> permissions = 
            context.getContentResolver().getPersistedUriPermissions();
        for (android.content.UriPermission perm : permissions) {
            if (perm.getUri().equals(treeUri)) {
                return true;
            }
        }
        return false;
    }

    public static String readFile(Context context, String uriString, String fileName) throws Exception {
        Uri treeUri = Uri.parse(uriString);
        DocumentFile root = DocumentFile.fromTreeUri(context, treeUri);
        if (root == null || !root.exists()) {
            throw new Exception("No se puede acceder a la carpeta");
        }

        DocumentFile file = root.findFile(fileName);
        if (file == null || !file.exists()) {
            throw new Exception("Archivo no encontrado: " + fileName);
        }

        Uri fileUri = file.getUri();
        InputStream is = context.getContentResolver().openInputStream(fileUri);
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[4096];
        int n;
        while ((n = is.read(data)) != -1) {
            buffer.write(data, 0, n);
        }
        is.close();
        return new String(buffer.toByteArray(), "UTF-8");
    }

    public static void writeFile(Context context, String uriString, String fileName, String content) throws Exception {
        Uri treeUri = Uri.parse(uriString);
        DocumentFile root = DocumentFile.fromTreeUri(context, treeUri);
        if (root == null || !root.exists()) {
            throw new Exception("No se puede acceder a la carpeta");
        }

        DocumentFile existing = root.findFile(fileName);
        if (existing != null && existing.exists()) {
            existing.delete();
        }

        DocumentFile file = root.createFile("application/json", fileName);
        if (file == null) {
            throw new Exception("No se pudo crear el archivo");
        }

        Uri fileUri = file.getUri();
        OutputStream os = context.getContentResolver().openOutputStream(fileUri, "wt");
        os.write(content.getBytes("UTF-8"));
        os.flush();
        os.close();
    }
}
