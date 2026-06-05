package dev.trackersimple;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import dev.trackersimple.saf.SafPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SafPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
