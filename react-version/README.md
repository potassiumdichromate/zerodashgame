# 🎮 Zero Dash - React Frontend

Modern, production-ready React frontend for the Zero Dash Unity WebGL game with Zerion wallet integration.

## ✨ Features

- 🔐 **Zerion Wallet Integration** - Connect with any EIP-1193 compatible wallet
- 🎨 **Pixel-Art Temple-Run Aesthetic** - Retro gaming vibes with smooth modern animations
- 🚀 **Delayed Unity Loading** - Unity loads only when player starts the game
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🏆 **Leaderboard System** - Modal overlay with pixel-styled leaderboard
- ⚡ **Optimized Performance** - Vite for lightning-fast builds
- 🎯 **Component Architecture** - Clean, maintainable React components

## 📁 Project Structure

```
zero-dash-react/
├── public/                      # Static assets
│   ├── Build/                   # Unity WebGL build files
│   ├── TemplateData/           # Unity templates and favicon
│   ├── StreamingAssets/        # Unity streaming assets
│   ├── ServiceWorker.js        # PWA service worker
│   └── manifest.webmanifest    # PWA manifest
├── src/
│   ├── components/
│   │   ├── WalletConnect.jsx   # Wallet connection splash screen
│   │   ├── GameCanvas.jsx      # Unity WebGL canvas manager
│   │   └── Leaderboard.jsx     # Leaderboard modal overlay
│   ├── hooks/
│   │   └── useWallet.js        # Wallet state management hook
│   ├── App.jsx                 # Main app orchestrator
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles + Tailwind
├── index.html                  # HTML entry point
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind theme (pixel-art)
└── postcss.config.js           # PostCSS config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Unity WebGL build files for Zero Dash
- Zerion or another Web3 wallet browser extension

### Installation

1. **Clone or extract the project**
   ```bash
   cd zero-dash-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Copy Unity build files**
   
   Copy your Unity build files to the `public/` directory:
   ```
   public/
   ├── Build/
   │   ├── ZeroDash.data
   │   ├── ZeroDash.framework.js
   │   ├── ZeroDash.wasm
   │   └── ZeroDash.loader.js
   ├── StreamingAssets/
   ├── TemplateData/
   │   ├── favicon.ico
   │   └── style.css
   ├── ServiceWorker.js
   └── manifest.webmanifest
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory. Deploy this folder to your hosting service.

### Preview Production Build

```bash
npm run preview
```

## 🎮 How It Works

### Screen Flow

1. **Splash Screen** (`WalletConnect`)
   - Player clicks "Connect Wallet"
   - Zerion/Web3 wallet prompts for connection
   - On success, transitions to Menu Screen

2. **Menu Screen** (`App.jsx`)
   - "Start Game" button - loads Unity and starts playing
   - "Leaderboard" button - opens leaderboard modal

3. **Game Screen** (`GameCanvas`)
   - Unity WebGL loads with progress bar
   - Wallet address is sent to Unity via `SendMessage`
   - Full-screen game canvas

4. **Leaderboard Modal** (`Leaderboard`)
   - Overlay modal with pixel-art styling
   - Displays top 10 players (dummy data)
   - Close button or click outside to dismiss

### Wallet Integration

The `useWallet` hook manages all wallet interactions:

```javascript
const {
  walletAddress,        // Full wallet address
  truncatedAddress,     // Shortened display format
  isConnecting,         // Loading state
  isConnected,          // Connection status
  error,                // Error message
  connectWallet,        // Connect function
  disconnectWallet,     // Disconnect function
} = useWallet();
```

### Unity Communication

After Unity loads, the wallet address is passed via:

```javascript
unityInstance.SendMessage('GameManager', 'SetWalletAddress', walletAddress);
```

**Unity side setup required:**
```csharp
// In your Unity GameManager script
public void SetWalletAddress(string address) {
    Debug.Log("Received wallet address: " + address);
    // Store and use the wallet address
}
```

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js` to customize the pixel-art color palette:

```javascript
colors: {
  temple: {
    dark: '#1a3a1a',      // Dark green background
    brown: '#2d1a0f',      // Temple brown
    gold: '#ffd700',       // Gold accents
    green: '#2d5016',      // Button green
    orange: '#c87137',     // Primary button orange
    lava: '#ff8c00',       // Score highlight
    // Add your custom colors...
  },
}
```

### Font

The project uses **Press Start 2P** from Google Fonts. Change in:
- `index.html` - Font loading
- `tailwind.config.js` - Font family definition
- `index.css` - Font application

### Leaderboard Data

Update dummy data in `src/components/Leaderboard.jsx`:

```javascript
const LEADERBOARD_DATA = [
  { rank: 1, player: '0x7a9f...3c2d', score: 152300 },
  // Add more entries...
];
```

For live data, integrate with your backend API:

```javascript
const [leaderboardData, setLeaderboardData] = useState([]);

useEffect(() => {
  fetch('https://api.yourgame.com/leaderboard')
    .then(res => res.json())
    .then(data => setLeaderboardData(data));
}, []);
```

## 🔧 Configuration

### Unity Build Path

If your Unity files are in a different location, update `GameCanvas.jsx`:

```javascript
const buildUrl = '/Build';  // Change to your path
```

### Mobile Optimization

The canvas is fixed at 432x768. For different sizes, update:

```jsx
<canvas
  width="432"    // Change width
  height="768"   // Change height
  ...
/>
```

## 🐛 Troubleshooting

### Wallet Not Connecting

1. **Check browser console** for errors
2. **Ensure wallet extension is installed** (Zerion, MetaMask, etc.)
3. **Refresh the page** and try again
4. **Check network** - ensure wallet is on the correct chain

### Unity Not Loading

1. **Verify build files** are in `public/Build/`
2. **Check browser console** for 404 errors
3. **Ensure file names match**: `ZeroDash.data`, `ZeroDash.wasm`, etc.
4. **Try building Unity** with different compression settings
5. **Check MIME types** on your server (especially for .wasm files)

### Wallet Address Not Received in Unity

1. **Verify GameManager** exists in your Unity scene
2. **Check method name** is exactly `SetWalletAddress`
3. **Check Unity console** for JavaScript communication errors
4. **Increase delay** in `GameCanvas.jsx` (currently 1000ms)

### Styling Issues

1. **Run Tailwind rebuild**: `npm run dev` (auto-rebuilds)
2. **Clear browser cache**
3. **Check CSS classes** are spelled correctly
4. **Verify Tailwind config** includes all content paths

## 📦 Dependencies

### Production
- **React 18** - UI framework
- **React DOM 18** - React rendering

### Development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **ESLint** - Code linting

## 🚀 Deployment

### Vercel

```bash
npm run build
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Static Hosting (S3, GitHub Pages, etc.)

```bash
npm run build
# Upload contents of dist/ folder
```

**Important:** Ensure your server is configured to:
1. Serve `.wasm` files with correct MIME type (`application/wasm`)
2. Enable CORS if Unity files are on a different domain
3. Serve `index.html` for all routes (SPA routing)

## 🎯 Future Enhancements

- [ ] **Live Leaderboard** - Integrate with blockchain or backend API
- [ ] **NFT Integration** - Display player NFTs/achievements
- [ ] **Social Features** - Share scores on Twitter/Discord
- [ ] **Multiple Wallets** - Support more wallet providers
- [ ] **Analytics** - Track player sessions and engagement
- [ ] **Sound Effects** - Add UI interaction sounds
- [ ] **Loading Animations** - Enhanced loading experience
- [ ] **Settings Panel** - Audio, graphics, control settings

## 📝 License

This project is provided as-is for the Zero Dash game integration.

## 🙏 Credits

- **Unity Build**: Kult Games
- **Wallet Integration**: EIP-1193 Standard
- **Font**: Press Start 2P by CodeMan38
- **Framework**: React + Vite + Tailwind CSS

---

**Need help?** Check the browser console for detailed error messages or open an issue in your project repository.

🎮 **Happy Gaming!**



Token Value = oONVd2rUlhZ6aasKEG-e9u7jaMmV9rYja0DQYH5k
Access Key ID = 5f708e2d6bc7a013495b6e03ae0ffe1b
Secret Access Key = 5190c30ca89237833774c297bf52a5909199d57bde6c69223d2ac56aeea135ad