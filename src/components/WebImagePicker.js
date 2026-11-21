import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * A tiny web-only image picker. On Expo web a hidden <input type="file"> is
 * enough — no native image-picker dependency is needed. Call open() on the ref
 * to launch the device file dialog; onPick(file, fileName) receives the raw
 * File so callers can upload it (Cloudinary) or read it locally as a fallback.
 * Native platforms render nothing for now.
 */
const WebImagePicker = forwardRef(function WebImagePicker(
  { onPick, label = 'Choose image' },
  ref
) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open() {
      if (Platform.OS === 'web' && inputRef.current) {
        inputRef.current.click();
      }
    },
  }));

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      aria-label={label}
      tabIndex={-1}
      style={{ display: 'none' }}
      onChange={(event) => {
        const file = event.target?.files?.[0];
        // Reset so picking the same file again still fires onChange.
        if (event.target) {
          event.target.value = '';
        }
        if (!file) {
          return;
        }
        onPick?.(file, file.name);
      }}
    />
  );
});

export default WebImagePicker;
