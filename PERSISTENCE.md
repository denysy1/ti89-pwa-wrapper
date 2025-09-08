# TI-89 Calculator State Persistence

This PWA app now supports **automatic session persistence**, allowing your calculator work to be saved and restored between sessions.

## How It Works

The app uses a sophisticated multi-layered approach to capture and restore your calculator state:

### Storage Methods

1. **IndexedDB (Primary)**: Modern, high-capacity browser storage
2. **localStorage (Fallback)**: Compatible with older browsers
3. **Cross-origin Communication**: Attempts to communicate with the TI-89 simulator

### What Gets Saved

- Calculator display state
- Input history and calculations
- Any local storage from the calculator
- Session state and settings
- Canvas display data (visual state)

## Features

### Automatic Saving
- **Auto-save every 30 seconds** during use
- **Save on app backgrounding** (when you switch apps)
- **Save before closing** the app or browser
- **Save on network changes** (going offline/online)

### Manual Controls (for debugging)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Force save current state |
| `Ctrl/Cmd + Shift + R` | Manually restore saved state |
| `Ctrl/Cmd + Shift + D` | Clear all saved state (with confirmation) |

### Visual Feedback
- **"Saved" indicator** appears briefly in the top-right when state is saved
- Console logs provide detailed information about save/load operations

## Compatibility

### Full Support
- ✅ Chrome/Chromium browsers
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ✅ Edge

### Limited Support
- ⚠️ Older browsers (falls back to localStorage)
- ⚠️ Private/incognito mode (limited storage)
- ⚠️ Very low storage devices

## Technical Details

### Cross-Origin Limitations
Due to browser security (CORS), the app cannot directly access the TI-89 simulator's internal state. Instead, it uses these methods:

1. **PostMessage API**: Attempts to communicate with the calculator iframe
2. **Visual State Capture**: Captures canvas and display elements
3. **Storage Mirroring**: Saves any accessible localStorage/sessionStorage
4. **Periodic Snapshots**: Regular state captures during use

### Storage Fallback Chain
```
IndexedDB → localStorage → Session-only (no persistence)
```

### Data Structure
```javascript
{
  timestamp: 1234567890,
  state: {
    canvasData: [...],    // Visual calculator state
    inputs: [...],        // Input field values
    localStorage: {...},  // Calculator's local storage
    sessionStorage: {...} // Calculator's session storage
  }
}
```

## Privacy & Security

- **All data stored locally** in your browser
- **No data transmitted** to external servers
- **Automatic cleanup** of old states to manage storage
- **Clear data anytime** using manual controls

## Troubleshooting

### State Not Restoring?
1. Check browser console for error messages
2. Ensure you're using a supported browser
3. Check available storage space
4. Try the manual restore shortcut: `Ctrl/Cmd + Shift + R`

### Storage Issues?
1. Clear browser cache and cookies for the site
2. Use manual clear: `Ctrl/Cmd + Shift + D`
3. Check if you're in private/incognito mode
4. Verify JavaScript is enabled

### Performance Issues?
1. The auto-save interval can be adjusted in the code
2. Old states are automatically cleaned up
3. Clear saved data if storage becomes full

## Development Notes

### Files Involved
- `js/state-manager.js` - Main persistence logic
- `js/storage-fallback.js` - localStorage fallback
- `js/calculator-bridge.js` - Cross-origin communication
- `index.html` - Integration and UI

### Customization
You can modify the auto-save interval by changing this line in `index.html`:
```javascript
stateManager.startAutoSave(30000); // 30 seconds
```

### Adding New State Capture Methods
Extend the `captureCalculatorState()` function in `calculator-bridge.js` to capture additional state elements.

## Future Enhancements

Potential improvements for even better persistence:
- Cloud backup integration
- Multiple save slots
- Import/export functionality
- State compression for larger calculations
- Offline calculator fallback

---

**Note**: Due to browser security restrictions, persistence effectiveness may vary depending on how the TI-89 simulator implements its state management. The app does its best to capture and restore as much state as possible within these constraints.
