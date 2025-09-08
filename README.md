# TI-89 Calculator PWA

A Progressive Web App (PWA) wrapper for the TI-89 Graphing Calculator Simulator that provides a native app experience on mobile devices.

## 🚀 Features

- **📱 Native App Experience**: Installs as a standalone app with no browser UI
- **⚡ Fast Loading**: Optimized loading with custom splash screen
- **🔄 Auto-Retry**: Intelligent connection handling with automatic retries
- **📶 Offline Detection**: Proper online/offline state management
- **🎯 Mobile Optimized**: Full-screen experience designed for touch devices
- **🔒 Service Worker**: Caches static resources for faster subsequent loads
- **🍎 iOS Compatible**: Proper iOS PWA support with status bar handling

## 📱 Installation

### iPhone/iPad (iOS)
1. Open Safari and navigate to your GitHub Pages URL
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Customize the name if desired and tap **"Add"**
5. The app will appear on your home screen like a native app!

### Android
1. Open Chrome and navigate to your GitHub Pages URL
2. Tap the **menu** (three dots) in the top-right corner
3. Select **"Add to Home Screen"** or **"Install App"**
4. Follow the prompts to install
5. The app will appear in your app drawer and home screen

### Desktop (Chrome/Edge)
1. Open your PWA URL in Chrome or Edge
2. Look for the **install icon** (⊞) in the address bar
3. Click it and follow the installation prompts
4. The app will be installed as a desktop application

## 🛠️ Technical Details

This PWA wrapper provides several advantages over using the calculator in a regular browser tab:

- **Iframe Integration**: Loads the TI-89 simulator in a full-screen iframe
- **Loading States**: Professional loading screen with app branding
- **Error Handling**: Graceful error handling with retry functionality
- **Connection Monitoring**: Detects online/offline states and responds appropriately
- **App-like Behavior**: Prevents zooming and provides smooth touch interactions
- **Resource Caching**: Static resources are cached for offline PWA shell

## 📁 Project Structure

```
ti89-pwa-wrapper/
├── index.html              # Main PWA application
├── manifest.webmanifest    # PWA manifest with app metadata
├── sw.js                   # Service worker for caching
├── favicon.ico             # Root favicon
├── icons/                  # App icons for different sizes
│   ├── icon.png           # Base icon
│   ├── icon-180.png       # iOS icon
│   ├── icon-192.png       # Android icon
│   ├── icon-512.png       # High-res icon
│   ├── apple-touch-icon.png # iOS touch icon
│   └── favicon.ico        # Icon favicon
└── TI89/                  # Reference files (saved for development)
    └── [saved website files]
```

## 🔧 How It Works

1. **PWA Shell**: The app provides a native-feeling shell with proper PWA metadata
2. **Iframe Loading**: The TI-89 simulator loads in a seamless iframe
3. **Connection Handling**: Monitors connectivity and provides appropriate feedback
4. **Service Worker**: Caches the PWA shell for fast loading and basic offline functionality
5. **Native Integration**: Behaves like a native app when installed

## 🌐 Deployment

This PWA is designed to be deployed on GitHub Pages:

1. **Repository**: Host your code in a GitHub repository
2. **GitHub Pages**: Enable GitHub Pages from the repository settings
3. **Custom Domain** (optional): Configure a custom domain if desired
4. **HTTPS**: GitHub Pages provides HTTPS by default (required for PWAs)

## 📋 Requirements

- **HTTPS**: PWAs require secure connections (GitHub Pages provides this)
- **Service Worker**: Implemented for basic caching and PWA functionality
- **Web App Manifest**: Complete manifest with proper icons and metadata
- **Mobile Responsive**: Optimized for mobile devices

## 🎯 Usage Tips

- **Portrait Mode**: The app works best in portrait orientation on mobile
- **Full Screen**: Once installed, the app runs in full-screen mode without browser UI
- **Reliable Connection**: The calculator requires internet connectivity to function
- **Touch Optimized**: Designed for touch interaction on mobile devices

## 🔍 Troubleshooting

**App won't install on iOS:**
- Make sure you're using Safari (not Chrome or other browsers)
- Ensure the site is loaded over HTTPS
- Try refreshing and waiting for full page load before installing

**Connection errors:**
- Check your internet connection
- The app will automatically retry when connection is restored
- Use the retry button if manual intervention is needed

**Loading issues:**
- Clear your browser cache and reload
- Ensure JavaScript is enabled
- Check browser console for any error messages

## 📄 License

This PWA wrapper is open source. The TI-89 calculator simulator itself is provided by ti89-simulator.com.
