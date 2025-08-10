# UTBTHeader.tsx Changes - Final Diff

## Changes Made

### 1. Updated Toggle Section Structure
```diff
-      {/* Auto-detect toggle */}
-      <View style={styles.toggleRow}>
-        <Text style={[styles.toggleLabel, isDarkMode && styles.textDark]}>
-          Auto-detect speakers
-        </Text>
-        <Switch
-          value={autoDetectSpeakers}
-          onValueChange={handleAutoDetectToggle}
-          trackColor={{ false: '#767577', true: '#81b0ff' }}
-          thumbColor={autoDetectSpeakers ? '#007AFF' : '#f4f3f4'}
-          accessibilityLabel="Auto-detect speakers"
-          accessibilityRole="switch"
-        />
-      </View>
+      {/* Auto-detect toggle with caption */}
+      <View style={styles.toggleSection}>
+        <View style={styles.toggleRow}>
+          <Text style={[styles.toggleLabel, isDarkMode && styles.textDark]}>
+            Auto-detect speakers
+          </Text>
+          <Switch
+            value={autoDetectSpeakers}
+            onValueChange={handleAutoDetectToggle}
+            trackColor={{ false: '#767577', true: '#81b0ff' }}
+            thumbColor={autoDetectSpeakers ? '#007AFF' : '#f4f3f4'}
+            accessibilityLabel={autoDetectSpeakers ? "Auto-detect enabled: routes by spoken language" : "Auto-detect disabled: manual A to B routing"}
+            accessibilityRole="switch"
+          />
+        </View>
+        <Text style={[styles.caption, isDarkMode && styles.captionDark]}>
+          {autoDetectSpeakers 
+            ? 'Auto: routes by spoken language' 
+            : 'Manual: A → B (use Swap)'}
+        </Text>
+      </View>
```

### 2. Added New Styles
```diff
+  toggleSection: {
+    // Container for toggle and caption
+  },
   toggleRow: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
   },
   toggleLabel: {
     fontSize: 13,
     color: '#666',
   },
+  caption: {
+    fontSize: 11,
+    color: '#999',
+    marginTop: 2,
+    fontStyle: 'italic',
+  },
+  captionDark: {
+    color: '#666',
+  },
```

## Visual Result

The header now displays contextual captions:
- **Auto-detect ON**: "Auto: routes by spoken language" 
- **Auto-detect OFF**: "Manual: A → B (use Swap)"

These captions appear as small, italic text below the toggle switch, providing clear guidance on the current routing behavior.

## Accessibility Improvements

Dynamic `accessibilityLabel` provides screen reader users with full context:
- When enabled: "Auto-detect enabled: routes by spoken language"
- When disabled: "Auto-detect disabled: manual A to B routing"
