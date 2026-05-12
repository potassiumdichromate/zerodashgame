import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Zap, FileText, Gamepad2, Users, Trophy, Globe, ArrowRight, Shield, BarChart3, Coins, Infinity as InfinityIcon, Play, MessageSquare, Send, Twitter } from "lucide-react";

// Assets
import heroBg from "../assets/hero-bg.png";
import heroBgMobile from "../assets/hero-bg-mobile.png";
import avatarImg from "../assets/avatar.jpeg";
import ogLogo from "../assets/0G Logo.png";
import ctaVideo from "../assets/bottom.mp4";
import iconChain from "../assets/icon-chain.png";
import iconShield from "../assets/icon-shield-premium.png";
import iconChest from "../assets/icon-chest.png";
import iconCommunity from "../assets/icon-community.png";
import stepRun from "../assets/step-run.png";
import stepCollect from "../assets/step-collect.png";
import stepCompete from "../assets/step-compete.png";
import stepEarn from "../assets/step-earn.png";
import gameplayVideo from "../assets/gameplay.mp4";
import kultLogo from "../assets/kult-0G-logo.png";
import visionVideo from "../assets/mp_.mp4";
import heroVideo from "../assets/bkg.mp4";
import FooterThree from "./FooterThree";
import HowToPlayThree from "./HowToPlayThree";
import FeaturesThree from "./FeaturesThree";
import CTAThree from "./CTAThree";

function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 font-black ${className}`}>
      <img src={avatarImg} alt="Zero Dash" width={40} height={40} className="w-10 h-10 rounded-md border border-border" />
      <span className="text-lg tracking-tight font-display hidden sm:inline" style={{ fontFamily: '"Press Start 2P", monospace' }}>ZERO DASH</span>
    </div>
  );
}

function ZeroGLogo({ className = "h-4" }) {
  return <img src={ogLogo} alt="0G" className={`inline-block align-middle ${className}`} />;
}

function Stat({ icon, value, label, small }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <div className={`font-black ${small ? "text-lg" : "text-2xl"}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>{value}</div>
        <div className="text-[0.65rem] tracking-widest text-muted-foreground font-bold">{label}</div>
      </div>
    </div>
  );
}

function Feature({ img, title, alt, titleClass, desc }) {
  return (
    <div className="card-panel p-6 text-center flex flex-col items-center gap-4 hover:-translate-y-1 transition h-full">
      <img src={img} alt={alt || ""} loading="lazy" width={512} height={512} className="w-24 h-24 object-contain" />
      <h3 className={`font-pixel text-[10px] sm:text-xs ${titleClass}`}>{title}</h3>
      <p className="font-pixel text-[9px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ n, img, title, desc, last }) {
  return (
    <div className="card-panel p-6 text-center flex flex-col items-center gap-3 relative">
      <span className="absolute top-3 left-3 text-xs font-black text-cyan-glow tracking-widest" style={{ fontFamily: '"Press Start 2P", monospace' }}>{n}</span>
      <img src={img} alt={title} loading="lazy" width={512} height={512} className="w-28 h-28 object-contain" />
      <h3 className="heading-section text-lg text-cyan-glow">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
      {!last && (
        <ArrowRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 text-accent z-10 bg-background rounded-full p-1" size={28} />
      )}
    </div>
  );
}

function OrbitNode({ pos, icon, color, label }) {
  return (
    <div className={`absolute ${pos} flex flex-col items-center gap-1`}>
      <div className={`w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center ${color} shadow-[0_0_20px_oklch(0.7_0.18_230/0.4)]`}>
        {icon}
      </div>
      <span className="text-[0.6rem] font-bold tracking-wider text-muted-foreground text-center max-w-[80px]">{label}</span>
    </div>
  );
}

const revealUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

const revealLeft = {
  initial: { opacity: 0, x: -50 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

const revealRight = {
  initial: { opacity: 0, x: 50 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

const zoomIn = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function LandingPage({ onPlayNow }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="landing-page-root min-h-screen overflow-x-hidden selection:bg-cyan-glow selection:text-background">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-cyan-glow z-[10000] origin-left shadow-[0_0_15px_oklch(0.78_0.16_220)]"
        style={{ scaleX }}
      />
      {/* HERO with full-bleed background */}
      <motion.section 
        className="relative min-h-[100vh] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <video
          src={heroVideo}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/30" />

        {/* NAV */}
        <header className="relative max-w-7xl mx-auto flex items-center justify-between px-6 py-6 z-10">
          <Logo />
          <button onClick={onPlayNow} className="btn-gold text-sm">CONNECT WALLET <Zap size={16} fill="currentColor" /></button>
        </header>

        {/* HERO CONTENT */}
        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-20 lg:pb-40 z-10">
          <div className="max-w-2xl space-y-7">
            <div className="flex flex-col gap-2">
              <span className="text-cyan-glow font-pixel text-[10px] sm:text-xs tracking-[0.3em] uppercase opacity-80">The First Intelligent Onchain Arcade</span>
              <h1
                className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight uppercase leading-[0.95] drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
                style={{ fontFamily: '"Press Start 2P", monospace', lineHeight: 1.1 }}
              >
                <span className="text-gold">Zero</span><br />
                <span className="text-cyan-glow">Dash</span>
              </h1>
            </div>
            <p className="text-xl sm:text-2xl font-bold uppercase tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Risk Nothing. <span className="text-gold">Earn Everything.</span>
            </p>
            <p className="text-base text-foreground/85 max-w-md drop-shadow">
              The intelligent onchain arcade built for the 0G era.<br />
              <span className="text-gold">Dash. Compete. Own everything.</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onPlayNow} className="btn-gold">CONNECT WALLET <Zap size={16} fill="currentColor" /></button>
              <a href="#trailer" className="btn-outline"><Play size={16} /> WATCH TRAILER</a>
            </div>
          </div>
        </div>

      </motion.section>

      {/* GAMEPLAY VIDEO */}
      <motion.section id="trailer" className="section-alt-bright" {...zoomIn}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-pixel text-3xl sm:text-4xl lg:text-5xl text-center mb-12 uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            See <span className="text-gold">Zero Dash</span> in Action
          </h2>
          <div className="card-panel overflow-hidden relative group">
            {/* Cyber Corners */}
            <div className="cyber-corner cyber-corner-tl" />
            <div className="cyber-corner cyber-corner-tr" />
            <div className="cyber-corner cyber-corner-bl" />
            <div className="cyber-corner cyber-corner-br" />

            <video
              src={gameplayVideo}
              className="w-full h-auto"
              autoPlay
              muted
              loop
              playsInline
              poster={heroBg}
            />
          </div>
        </div>
      </motion.section>

      {/* FEATURES */}
      <motion.section 
        id="features" 
        className="section-alt-dark relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
      >
        <FeaturesThree />
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="font-pixel text-xl sm:text-2xl lg:text-3xl text-center mb-12 uppercase leading-relaxed"
            variants={staggerItem}
          >
            Not built for Web3.<br />
            <span className="text-cyan-glow">Built for what comes after.</span>
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div variants={staggerItem}>
              <Feature img={iconChain} title={<>BUILT ON <ZeroGLogo className="h-4" /> CHAIN</>} alt="Built on 0G Chain" titleClass="text-cyan-glow" desc="High-performance infrastructure for speed, security and true ownership." />
            </motion.div>
            <motion.div variants={staggerItem}>
              <Feature img={iconShield} title="SECURE & FAIR" alt="Secure & Fair" titleClass="text-purple-glow" desc="Transparent, verifiable and always on-chain." />
            </motion.div>
            <motion.div variants={staggerItem}>
              <Feature img={iconChest} title="PLAY & EARN" alt="Play & Earn" titleClass="text-gold" desc="Skill-based gameplay with real rewards. You play, You own." />
            </motion.div>
            <motion.div variants={staggerItem}>
              <Feature img={iconCommunity} title="COMMUNITY FIRST" alt="Community First" titleClass="text-green-glow" desc="A strong ecosystem of players, creators and backers." />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* POWERED BY 0G — INFRASTRUCTURE STACK */}
      <motion.section id="infrastructure" className="section-alt-bright" {...revealRight}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative z-10 text-center mb-12">
            <h2 className="font-pixel text-xl sm:text-4xl lg:text-5xl font-black uppercase flex flex-wrap items-center justify-center gap-2 sm:gap-4 drop-shadow-[0_0_20px_white/0.2]">
              THE <ZeroGLogo className="h-6 sm:h-10 lg:h-12 drop-shadow-[0_0_20px_white]" /> ADVANTAGE
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              Zero Dash is built on the first decentralized AI Arcade,<br className="hidden sm:block" />
              providing a high-performance gaming experience that <span className="text-purple-glow">traditional Web3 platforms can't match.</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 relative z-10">
            {/* DA */}
            <div className="infra-card cyan group">
              <div className="infra-icon-wrapper">
                <div className="infra-icon-bg" />
                <Shield className="text-cyan-glow relative z-10" size={32} />
              </div>
              <div>
                <h4 className="font-pixel text-[10px] sm:text-xs text-cyan-glow mb-3 tracking-widest uppercase">0G Data Availability</h4>
                <p className="font-pixel text-[9px] sm:text-[11px] text-muted-foreground leading-relaxed">
                  Real-time session verification and anti-cheat logic. Every milestone is cryptographically secured via the <span className="text-cyan-glow/80">0G DA pipeline.</span>
                </p>
              </div>
            </div>
            
            {/* Storage */}
            <div className="infra-card orange group">
              <div className="infra-icon-wrapper">
                <div className="infra-icon-bg" />
                <FileText className="relative z-10" size={32} style={{ color: 'oklch(0.75 0.18 60)' }} />
              </div>
              <div>
                <h4 className="font-pixel text-[10px] sm:text-xs mb-3 tracking-widest uppercase" style={{ color: 'oklch(0.75 0.18 60)' }}>0G Storage</h4>
                <p className="font-pixel text-[9px] sm:text-[11px] text-muted-foreground leading-relaxed">
                  Immutable, decentralized storage for player history and snapshots. Your achievements are <span style={{ color: 'oklch(0.75 0.18 60)' }}>permanent and tamper-proof.</span>
                </p>
              </div>
            </div>
            
            {/* Compute */}
            <div className="infra-card purple group">
              <div className="infra-icon-wrapper">
                <div className="infra-icon-bg" />
                <Zap className="text-purple-glow relative z-10" size={32} />
              </div>
              <div>
                <h4 className="font-pixel text-[10px] sm:text-xs text-purple-glow mb-3 tracking-widest uppercase">0G Compute</h4>
                <p className="font-pixel text-[9px] sm:text-[11px] text-muted-foreground leading-relaxed">
                  Decentralized <span className="text-purple-glow/80">AI</span> powers dynamic game intelligence and coaching without compromising player privacy or exposing API keys.
                </p>
              </div>
            </div>
            
            {/* Blockchain */}
            <div className="infra-card green group">
              <div className="infra-icon-wrapper">
                <div className="infra-icon-bg" />
                <Globe className="text-green-glow relative z-10" size={32} />
              </div>
              <div>
                <h4 className="font-pixel text-[10px] sm:text-xs text-green-glow mb-3 tracking-widest uppercase">0G Mainnet</h4>
                <p className="font-pixel text-[9px] sm:text-[11px] text-muted-foreground leading-relaxed">
                  The economic engine of Zero Dash. Featuring <span className="text-green-glow/80">zero-gas</span> NFT minting and verifiable on-chain assets for all players.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* HOW TO PLAY */}
      <motion.section id="how-to-play" className="section-alt-dark relative overflow-hidden" {...revealUp}>
        <HowToPlayThree />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h2 className="font-pixel text-3xl sm:text-4xl lg:text-5xl text-center mb-12 uppercase drop-shadow-[0_0_15px_oklch(0.78_0.16_220/0.4)]">
            How to Play
          </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {/* STEP 01 */}
          <div className="how-card cyan">
            <div className="card-glow" />
            <div className="how-step-number">01</div>
            <div className="how-image-wrapper">
              <img src={stepRun} alt="DASH" />
            </div>
            <h3 className="font-pixel text-lg">DASH</h3>
            <div className="how-line" />
            <p className="text-sm">Navigate high-speed obstacles in a fully onchain environment.</p>
            <div className="how-arrow">→</div>
          </div>

          {/* STEP 02 */}
          <div className="how-card yellow">
            <div className="card-glow" />
            <div className="how-step-number">02</div>
            <div className="how-image-wrapper">
              <img src={stepCollect} alt="EVOLVE" />
            </div>
            <h3 className="font-pixel text-lg">EVOLVE</h3>
            <div className="how-line" />
            <p className="text-sm">Collect data fragments to upgrade your agent's neural capacity.</p>
            <div className="how-arrow">→</div>
          </div>

          {/* STEP 03 */}
          <div className="how-card purple">
            <div className="card-glow" />
            <div className="how-step-number">03</div>
            <div className="how-image-wrapper">
              <img src={stepCompete} alt="CLIMB" />
            </div>
            <h3 className="font-pixel text-lg">CLIMB</h3>
            <div className="how-line" />
            <p className="text-sm">Outperform others in real-time verified sessions on 0G DA.</p>
            <div className="how-arrow">→</div>
          </div>

          {/* STEP 04 */}
          <div className="how-card green">
            <div className="card-glow" />
            <div className="how-step-number">04</div>
            <div className="how-image-wrapper">
              <img src={stepEarn} alt="ASCEND" />
            </div>
            <h3 className="font-pixel text-lg">ASCEND</h3>
            <div className="how-line" />
            <p className="text-sm">Own your legacy. Your progression lives permanently on 0G.</p>
          </div>
        </div>
      </div>
    </motion.section>

    {/* PERSISTENT IDENTITY SECTION */}
    <motion.section className="section-alt-dark relative overflow-hidden py-32" {...revealUp}>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <span className="text-gold font-pixel text-[10px] sm:text-xs tracking-widest uppercase mb-6 block drop-shadow-[0_0_10px_gold/0.5]">Ecosystem Superpower</span>
        <h2 className="font-pixel text-2xl sm:text-4xl lg:text-5xl uppercase mb-8 leading-tight drop-shadow-[0_0_20px_white/0.2]">
          One Identity.<br />
          <span className="text-cyan-glow">Infinite Progression.</span>
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Your assets, achievements, and progression live permanently onchain.<br className="hidden sm:block" />
          This is your hidden superpower across the entire <span className="text-gold">Kult Ecosystem.</span>
        </p>
        <div className="flex flex-center justify-center">
            <div className="px-6 py-3 border border-cyan-glow/20 rounded-full bg-cyan-glow/5 backdrop-blur-sm">
              <span className="text-cyan-glow font-pixel text-[10px] uppercase tracking-[0.2em]">Verified by 0G Storage Protocol</span>
            </div>
        </div>
      </div>
    </motion.section>

      {/* BUILT FOR THE FUTURE */}
      <motion.section id="about" className="section-alt-bright" {...revealLeft}>
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
          <div>
            <h2 className="font-pixel text-3xl sm:text-4xl lg:text-5xl mb-6 uppercase">
              Built for<br /><span className="text-cyan-glow">The Future</span>
            </h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Zero Dash connects players, economies and opportunities into one limitless on-chain adventure.
            </p>
            <a href="#vision" className="btn-outline">EXPLORE THE VISION <ArrowRight size={16} /></a>
          </div>
          <div className="card-panel overflow-hidden aspect-video flex items-center justify-center bg-black/20 relative group">
            {/* Cyber Corners */}
            <div className="cyber-corner cyber-corner-tl" />
            <div className="cyber-corner cyber-corner-tr" />
            <div className="cyber-corner cyber-corner-bl" />
            <div className="cyber-corner cyber-corner-br" />

            <video
              src={visionVideo}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section id="play" className="section-alt-dark relative overflow-hidden" {...zoomIn}>
        <CTAThree />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="relative rounded-2xl overflow-hidden card-panel h-[420px] sm:h-[520px]">
            <video 
              src={ctaVideo} 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-background/80" />
            <div className="absolute inset-0 flex items-center justify-center sm:justify-end p-8 sm:p-16">
              <div className="max-w-md text-center sm:text-right space-y-6">
                <h2 className="hidden sm:block font-pixel text-2xl sm:text-3xl lg:text-4xl uppercase mb-6">
                  The Adventure<br />is on <span className="text-gold"><ZeroGLogo className="h-8 sm:h-10 lg:h-12" /></span>.
                </h2>
                <p className="hidden sm:block heading-section text-sm tracking-wider">Risk Nothing.<br />Earn Everything.</p>
                <button onClick={onPlayNow} className="btn-gold mx-auto sm:ml-auto sm:mr-0">CONNECT WALLET <Zap size={16} fill="currentColor" /></button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className="relative max-w-7xl mx-auto px-6 py-10 border-t border-border overflow-hidden">
        <FooterThree />
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 relative z-10">
          {/* LEFT: Branding */}
          <div className="flex justify-center md:justify-start">
            <Logo />
          </div>

          {/* CENTER: Social Links */}
          <div className="flex justify-center items-center gap-5">
            <a href="https://t.me/KultGamesOfficial" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-cyan-glow/30 bg-cyan-glow/5 backdrop-blur-md flex items-center justify-center text-cyan-glow hover:text-white hover:bg-cyan-glow hover:border-cyan-glow transition-all hover:scale-110 group shadow-[0_0_15px_oklch(0.78_0.16_220/0.1)]" title="Telegram">
              <Send size={20} className="group-hover:drop-shadow-[0_0_8px_white]" />
            </a>
            <a href="https://discord.com/invite/Cge7rrCyUB" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-purple-glow/30 bg-purple-glow/5 backdrop-blur-md flex items-center justify-center text-purple-glow hover:text-white hover:bg-purple-glow hover:border-purple-glow transition-all hover:scale-110 group shadow-[0_0_15px_oklch(0.65_0.22_300/0.1)]" title="Discord">
              <MessageSquare size={20} className="group-hover:drop-shadow-[0_0_8px_white]" />
            </a>
            <a href="https://x.com/_KultGames" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-gold/30 bg-gold/5 backdrop-blur-md flex items-center justify-center text-gold hover:text-white hover:bg-gold hover:border-gold transition-all hover:scale-110 group shadow-[0_0_15px_oklch(0.82_0.17_80/0.1)]" title="X (Twitter)">
              <Twitter size={20} className="group-hover:drop-shadow-[0_0_8px_white]" />
            </a>
          </div>

          {/* RIGHT: Partner Logo */}
          <div className="flex justify-center md:justify-end">
            <img src={kultLogo} alt="Kult x 0G" className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">© 2024 Zero Dash. All rights reserved.</p>
      </footer>
    </div>
  );
}
