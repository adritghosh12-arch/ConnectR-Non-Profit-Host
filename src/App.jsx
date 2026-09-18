import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, deleteDoc } from 'firebase/firestore';

// Initialize Firebase outside the component
let app, auth, db, appId;
try {
  const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (e) {
  console.error("Firebase init error:", e);
}

const customCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@700;900&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

  :root {
    --bg-dark: #030303;
    --cyan-glow: #00f0ff;
    --purple-glow: #7000ff;
  }

  body {
    font-family: 'Inter', sans-serif;
    background-color: var(--bg-dark) !important;
    color: #ffffff;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    cursor: none;
    margin: 0;
  }

  /* Ultra-smooth Scrollbar */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: var(--bg-dark); }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

  /* Premium Glassmorphism */
  .premium-glass {
    background: rgba(10, 10, 12, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }

  /* Hardware-Accelerated Cursor */
  .cursor-dot, .cursor-outline {
    position: fixed; top: 0; left: 0;
    pointer-events: none; border-radius: 50%; z-index: 9999;
    transform: translate(-50%, -50%);
  }
  .cursor-dot {
    width: 6px; height: 6px;
    background-color: var(--cyan-glow);
    box-shadow: 0 0 12px var(--cyan-glow);
  }
  .cursor-outline {
    width: 40px; height: 40px;
    border: 1px solid rgba(0, 240, 255, 0.4);
    transition: width 0.2s, height 0.2s, background-color 0.2s, border-color 0.2s;
  }

  /* Spotlight & Tilt Framework */
  .spotlight-wrapper {
    position: relative; border-radius: 1.5rem; overflow: hidden;
    background: rgba(10, 10, 12, 0.6); border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .spotlight-wrapper::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(800px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(0, 240, 255, 0.08), transparent 40%);
    opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 0;
  }
  .spotlight-wrapper:hover::before { opacity: 1; }
  .spotlight-content { position: relative; z-index: 1; height: 100%; }

  .tilt-card { transform-style: preserve-3d; }
  .tilt-content { transform: translateZ(40px); }

  /* Marquee */
  .fade-edges { mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
  .marquee-container { display: flex; width: max-content; animation: marquee 30s linear infinite; }
  @keyframes marquee { to { transform: translateX(-50%); } }

  /* Canvas & Grids */
  #canvas-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; opacity: 0.6; pointer-events: none; }
  .grid-overlay {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background-image: linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 60px 60px; mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
  }

  /* View Transition */
  .view-enter { animation: viewFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes viewFadeIn { 0% { opacity: 0; transform: translateY(20px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }

  /* Radar Animation */
  .radar-box { position: relative; overflow: hidden; border-radius: 50%; width: 100px; height: 100px; border: 1px solid rgba(0, 240, 255, 0.3); background: rgba(0, 240, 255, 0.05); }
  .radar-box::before {
    content: ''; position: absolute; top: 50%; left: 50%; width: 50%; height: 50%;
    background: linear-gradient(45deg, rgba(0, 240, 255, 0.8), transparent); transform-origin: 0 0; animation: radar-spin 3s linear infinite;
  }
  .radar-box::after { content: ''; position: absolute; inset: 2px; border-radius: 50%; background: #0a0a0c; z-index: 1; }
  .radar-grid { position: absolute; inset: 0; background-image: radial-gradient(rgba(0, 240, 255, 0.4) 1px, transparent 1px); background-size: 10px 10px; z-index: 2; border-radius: 50%; opacity: 0.5;}
  .pulse-ring { position: absolute; inset: 0; border: 1px solid #00f0ff; border-radius: 50%; animation: pulse-ring-anim 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; z-index: 2; }
  @keyframes radar-spin { 100% { transform: rotate(360deg); } }
  @keyframes pulse-ring-anim { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

  /* Map Pings */
  .map-ping-container { position: absolute; transform: translate(-50%, -50%); }
  .map-ping { width: 12px; height: 12px; background-color: #00f0ff; border-radius: 50%; box-shadow: 0 0 10px #00f0ff; position: relative; z-index: 2; }
  .map-ping::after {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    border: 2px solid #00f0ff; border-radius: 50%; opacity: 0; animation: ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .map-ping.purple { background-color: #7000ff; box-shadow: 0 0 10px #7000ff; }
  .map-ping.purple::after { border-color: #7000ff; }
  @keyframes ripple { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

  /* Thermal Receipt Jagged Edge */
  .thermal-receipt {
    background: #e5e5e5; color: #111; font-family: 'JetBrains Mono', monospace;
    position: relative;
  }
  .thermal-receipt::before, .thermal-receipt::after {
    content: ""; position: absolute; left: 0; right: 0; height: 10px;
    background-size: 20px 20px;
  }
  .thermal-receipt::before {
    top: -10px;
    background-image: linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%);
    background-position: 0 10px;
  }
  .thermal-receipt::after {
    bottom: -10px;
    background-image: linear-gradient(135deg, #e5e5e5 25%, transparent 25%), linear-gradient(-135deg, #e5e5e5 25%, transparent 25%);
  }

  /* Typewriter */
  .typewriter-cursor::after { content: '█'; animation: blink 1s step-end infinite; color: #7000ff; margin-left: 4px; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
`;

const ScrambleText = ({ text, className }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  
  useEffect(() => {
    let frame = 0; let animationFrameId; const queue = [];
    for (let i = 0; i < text.length; i++) {
      queue.push({ from: '', to: text[i] || '', start: Math.floor(Math.random() * 40), end: Math.floor(Math.random() * 40) + Math.floor(Math.random() * 40), char: '' });
    }
    const update = () => {
      let output = ''; let complete = 0;
      for (let i = 0, n = queue.length; i < n; i++) {
        let { to, start, end, char } = queue[i];
        if (frame >= end) { complete++; output += to; }
        else if (frame >= start) {
          if (!char || Math.random() < 0.28) { char = chars[Math.floor(Math.random() * chars.length)]; queue[i].char = char; }
          output += char;
        }
      }
      setDisplayText(output);
      if (complete === queue.length) cancelAnimationFrame(animationFrameId);
      else { frame++; animationFrameId = requestAnimationFrame(update); }
    };
    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [text]);
  return <span className={className}>{displayText}</span>;
};

const SpotlightCard = ({ children, className = '' }) => {
  const cardRef = useRef(null);
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);
  return (
    <div ref={cardRef} onMouseMove={handleMouseMove} className={`spotlight-wrapper ${className}`}>
      <div className="spotlight-content">{children}</div>
    </div>
  );
};

const TiltCard = ({ children, className = '' }) => {
  const cardRef = useRef(null);
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -15;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 15;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };
  return (
    <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ transition: 'transform 0.1s ease-out' }} className={`tilt-card ${className}`}>
      <div className="tilt-content h-full w-full">{children}</div>
    </div>
  );
};

const MagneticIcon = ({ children }) => {
  const itemRef = useRef(null);
  const handleMouseMove = (e) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    itemRef.current.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px) scale(1.1)`;
  };
  const handleMouseLeave = () => {
    if (itemRef.current) itemRef.current.style.transform = `translate(0px, 0px) scale(1)`;
  }
  return (
    <div ref={itemRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ transition: 'transform 0.2s cubic-bezier(0.1, 1, 0.3, 1)', display: 'inline-block' }}>
      {children}
    </div>
  );
};

const Typewriter = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayedText(prev => prev + text.charAt(i)); i++; } 
      else clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [text]);
  return <span className="typewriter-cursor">{displayedText}</span>;
};

const ComparisonSlider = () => {
  const containerRef = useRef(null);
  const beforeLayerRef = useRef(null);
  const handleRef = useRef(null);
  const isDragging = useRef(false);

  const updateSlider = useCallback((clientX) => {
    if (!containerRef.current || !beforeLayerRef.current || !handleRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let pos = ((clientX - rect.left) / rect.width) * 100;
    pos = Math.max(5, Math.min(pos, 95));
    beforeLayerRef.current.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    handleRef.current.style.left = `${pos}%`;
  }, []);

  const handlePointerDown = (e) => { isDragging.current = true; updateSlider(e.clientX || e.touches[0].clientX); };
  
  useEffect(() => {
    const handlePointerMove = (e) => { if (!isDragging.current) return; updateSlider(e.clientX || (e.touches && e.touches[0].clientX)); };
    const handlePointerUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', handlePointerMove); window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseup', handlePointerUp); window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove); window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp); window.removeEventListener('touchend', handlePointerUp);
    };
  }, [updateSlider]);

  return (
    <div ref={containerRef} className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-zinc-800/50 select-none cursor-ew-resize bg-[#030303]" onMouseDown={handlePointerDown} onTouchStart={handlePointerDown}>
      {/* AFTER: ConnectR */}
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-[#0a0a0c] to-[#050505]">
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-xs font-mono text-[#00f0ff]">
            <div className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></div> ConnectR Edge
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-zinc-500">MONTHLY BILL</div>
            <div className="text-4xl font-bold text-white tracking-tighter" style={{ fontFamily: 'Orbitron' }}>$0.00</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 opacity-90">
          <div className="bg-black/40 border border-[#00f0ff]/20 rounded-xl p-5 backdrop-blur-md">
            <i className="fa-solid fa-server text-[#00f0ff] mb-3 text-2xl"></i>
            <div className="text-sm font-bold text-white">Edge Compute</div>
            <div className="text-xs text-emerald-400 font-mono mt-1">Uptime: 100%</div>
          </div>
          <div className="bg-black/40 border border-[#00f0ff]/20 rounded-xl p-5 backdrop-blur-md">
            <i className="fa-solid fa-database text-[#00f0ff] mb-3 text-2xl"></i>
            <div className="text-sm font-bold text-white">Managed DB</div>
            <div className="text-xs text-emerald-400 font-mono mt-1">Latency: 12ms</div>
          </div>
          <div className="bg-black/40 border border-[#00f0ff]/20 rounded-xl p-5 backdrop-blur-md">
            <i className="fa-solid fa-shield-halved text-[#00f0ff] mb-3 text-2xl"></i>
            <div className="text-sm font-bold text-white">DDoS Protect</div>
            <div className="text-xs text-emerald-400 font-mono mt-1">Active Blocks: 42</div>
          </div>
        </div>
      </div>

      {/* BEFORE: Legacy Cloud */}
      <div ref={beforeLayerRef} className="absolute inset-0 bg-[#0c0505] p-8 md:p-12 flex flex-col justify-center border-r border-red-500/30" style={{ clipPath: 'inset(0 50% 0 0)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMTEwNTA1Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMzMzExMTEiPjwvcmVjdD4KPC9zdmc+')" }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-500">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div> Legacy Cloud (AWS/GCP)
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-zinc-500">MONTHLY BILL</div>
              <div className="text-4xl font-bold text-white tracking-tighter" style={{ fontFamily: 'Orbitron' }}>$4,860.00</div>
            </div>
          </div>
          <div className="space-y-3 font-mono text-xs text-red-400/80 bg-black/40 p-5 rounded-lg border border-red-900/30">
            <p>&gt; [WARN] CPU Utilization at 98%...</p>
            <p>&gt; [ERROR] OutOfMemoryException in Postgres Pod</p>
            <p>&gt; [ALERT] Traffic spike detected. Auto-scaling failed.</p>
            <p className="text-zinc-400 py-2 border-y border-red-900/30 my-2">&gt; [BILLING] Credit card charged $1,200.00 for overages.</p>
            <p>&gt; [CRITICAL] App is offline. Donors cannot access page.</p>
            <p className="mt-4 text-white font-sans text-sm border-l-2 border-red-500 pl-3 italic">"We spent half our donations just keeping the servers running."</p>
          </div>
        </div>
      </div>

      <div ref={handleRef} className="absolute top-0 bottom-0 w-[2px] bg-white z-20 group" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black border-[3px] border-white rounded-full flex items-center justify-center transition-transform group-hover:scale-110 pointer-events-none">
          <i className="fa-solid fa-arrows-left-right text-sm text-white"></i>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState('client');
  const [isSigninOpen, setIsSigninOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // --- NEW: Database State ---
  const [user, setUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [stats, setStats] = useState({ volunteers: "412", uptime: "99.99%", orgs: "1,402" });
  const [roles, setRoles] = useState([]);
  
  const cursorDotRef = useRef(null);
  const cursorOutlineRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const threeState = useRef({ reqId: null });

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    // 1. Listen to Network Stats
    const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'platformStats', 'main');
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data());
      } else {
        // Set defaults if it's the first time ever loading
        setDoc(statsRef, { volunteers: "412", uptime: "99.99%", orgs: "1,402" });
      }
    }, (error) => console.error("Stats Error:", error));

    // 2. Listen to Open Roles
    const rolesRef = collection(db, 'artifacts', appId, 'public', 'data', 'volunteerRoles');
    const unsubRoles = onSnapshot(rolesRef, (snapshot) => {
      const fetchedRoles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Seed default roles if database is empty
      if (fetchedRoles.length === 0) {
        const defaultRoles = [
          { title: "Senior DevOps / SRE", hours: "5-10 HRS/WEEK", desc: "Maintain core infrastructure, build deployment pipelines." },
          { title: "Frontend Architect", hours: "PROJECT-BASED", desc: "Build accessible, blazing-fast interfaces for non-profits." },
          { title: "Non-Profit Liaison", hours: "FLEXIBLE", desc: "Interface directly with charity founders. Write technical specs." }
        ];
        defaultRoles.forEach(r => addDoc(rolesRef, r));
      } else {
        setRoles(fetchedRoles);
      }
    }, (error) => console.error("Roles Error:", error));

    return () => { unsubStats(); unsubRoles(); };
  }, [user]);

  const handleStatChange = (field, value) => {
    if (!user || !db) return;
    const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'platformStats', 'main');
    setDoc(statsRef, { ...stats, [field]: value }, { merge: true });
  };

  const addNewRole = () => {
    if (!user || !db) return;
    const rolesRef = collection(db, 'artifacts', appId, 'public', 'data', 'volunteerRoles');
    addDoc(rolesRef, { title: "New Role Title", hours: "TBD", desc: "Role description goes here..." });
  };

  const deleteRole = (id) => {
    if (!user || !db) return;
    const roleRef = doc(db, 'artifacts', appId, 'public', 'data', 'volunteerRoles', id);
    deleteDoc(roleRef);
  };

  // Force pure black body background on mount to override any iframe wrappers
  useEffect(() => {
    document.body.style.backgroundColor = '#030303';
    document.body.style.margin = '0';
  }, []);

  // Custom Cursor
  useEffect(() => {
    let mouseX = window.innerWidth / 2; let mouseY = window.innerHeight / 2;
    let outlineX = mouseX; let outlineY = mouseY; let animationFrame;
    const onMouseMove = (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;
    };
    const animateOutline = () => {
      outlineX += (mouseX - outlineX) * 0.2; outlineY += (mouseY - outlineY) * 0.2;
      if (cursorOutlineRef.current) cursorOutlineRef.current.style.transform = `translate3d(${outlineX - 20}px, ${outlineY - 20}px, 0)`;
      animationFrame = requestAnimationFrame(animateOutline);
    };
    window.addEventListener('mousemove', onMouseMove); animateOutline();
    return () => { window.removeEventListener('mousemove', onMouseMove); cancelAnimationFrame(animationFrame); };
  }, []);

  useEffect(() => {
    if (!window.THREE || !canvasContainerRef.current) return;
    const initThree = () => {
      const scene = new window.THREE.Scene();
      scene.fog = new window.THREE.FogExp2(0x030303, 0.001);
      const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.z = 500;
      const renderer = new window.THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      canvasContainerRef.current.innerHTML = '';
      canvasContainerRef.current.appendChild(renderer.domElement);

      const particleCount = window.innerWidth < 768 ? 200 : 400;
      const geometry = new window.THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const color = new window.THREE.Color();
      const themeColor1 = activeView === 'client' ? 0x00f0ff : 0x7000ff;

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 2000; positions[i+1] = (Math.random() - 0.5) * 2000; positions[i+2] = (Math.random() - 0.5) * 1500;
        const mix = Math.random();
        if (mix > 0.6) color.setHex(themeColor1); else if (mix > 0.3) color.setHex(0x0055ff); else color.setHex(0x333344);
        colors[i] = color.r; colors[i+1] = color.g; colors[i+2] = color.b;
      }
      geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new window.THREE.BufferAttribute(colors, 3));

      // Circular texture
      const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16;
      const context = canvas.getContext('2d');
      const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient; context.fillRect(0, 0, 16, 16);
      const texture = new window.THREE.CanvasTexture(canvas);

      const material = new window.THREE.PointsMaterial({ size: 5, vertexColors: true, transparent: true, opacity: 0.6, map: texture, depthWrite: false, blending: window.THREE.AdditiveBlending });
      const particles = new window.THREE.Points(geometry, material);
      scene.add(particles);

      let mouseX = 0, mouseY = 0;
      const onDocMouseMove = (e) => { mouseX = (e.clientX - window.innerWidth / 2) * 0.5; mouseY = (e.clientY - window.innerHeight / 2) * 0.5; };
      document.addEventListener('mousemove', onDocMouseMove);

      const animate = () => {
        threeState.current.reqId = requestAnimationFrame(animate);
        particles.rotation.y += 0.0003; particles.rotation.x += 0.0001;
        camera.position.x += (mouseX - camera.position.x) * 0.02; camera.position.y += (-mouseY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
      window.addEventListener('resize', onResize);

      return () => { document.removeEventListener('mousemove', onDocMouseMove); window.removeEventListener('resize', onResize); cancelAnimationFrame(threeState.current.reqId); renderer.dispose(); };
    };

    if (!window.THREE) {
      const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = initThree; document.head.appendChild(script);
    } else { return initThree(); }
  }, [activeView]);

  // Live Toast System
  const showToast = useCallback((message, color = "cyan") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, color }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 500);
    }, 4000);
  }, []);

  useEffect(() => {
    const events = ["Node deployed in EU-CENTRAL.", "Wildlife Rescue DB synced.", "SRE Volunteer online.", "Traffic re-routed for latency.", "Disaster Relief API scaled."];
    const interval = setInterval(() => { if (Math.random() < 0.2) showToast(events[Math.floor(Math.random() * events.length)], Math.random() > 0.5 ? 'cyan' : 'purple'); }, 5000);
    setTimeout(() => showToast("Mainframe connection secured.", "emerald"), 1000);
    return () => clearInterval(interval);
  }, [showToast]);

  const setHoverState = (isHovering) => {
    if (cursorOutlineRef.current) {
      const color = activeView === 'client' ? 'rgba(0,240,255,0.1)' : 'rgba(112,0,255,0.1)';
      cursorOutlineRef.current.style.width = isHovering ? '60px' : '40px';
      cursorOutlineRef.current.style.height = isHovering ? '60px' : '40px';
      cursorOutlineRef.current.style.backgroundColor = isHovering ? color : 'transparent';
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans relative overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: customCSS }} />
      
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <div id="canvas-container" ref={canvasContainerRef}></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Hardware Cursor */}
      <div ref={cursorDotRef} className="cursor-dot hidden md:block"></div>
      <div ref={cursorOutlineRef} className="cursor-outline hidden md:block"></div>

      {/* Navigation */}
      <nav className="relative w-full z-50 py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-[85rem] mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group z-20" onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)}>
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-300 bg-black/50 ${activeView === 'client' ? 'border-[#00f0ff]/30 text-[#00f0ff] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]' : 'border-[#7000ff]/30 text-[#7000ff] group-hover:shadow-[0_0_20px_rgba(112,0,255,0.4)]'}`}>
              <i className="fa-solid fa-network-wired text-sm"></i>
            </div>
            <span className="text-2xl font-bold tracking-widest text-white transition-colors" style={{ fontFamily: 'Orbitron' }}>Connect<span className={activeView === 'client' ? 'text-[#00f0ff]' : 'text-[#7000ff]'}>R</span></span>
          </button>
          
          <div className="flex items-center bg-black/50 p-1.5 rounded-full border border-white/10 relative z-20 shadow-inner">
            <div className="absolute top-1.5 bottom-1.5 left-1.5 bg-zinc-800 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ width: '130px', transform: activeView === 'client' ? 'translateX(0)' : 'translateX(100%)' }}></div>
            <button onClick={() => setActiveView('client')} onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)} className={`relative z-10 w-[130px] text-xs font-mono py-2 font-semibold tracking-widest transition-colors ${activeView === 'client' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>ORG VIEW</button>
            <button onClick={() => setActiveView('volunteer')} onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)} className={`relative z-10 w-[130px] text-xs font-mono py-2 font-semibold tracking-widest transition-colors ${activeView === 'volunteer' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>CORE TEAM</button>
          </div>

          <div className={`hidden md:flex items-center gap-6 z-20 transition-opacity duration-300 ${activeView === 'client' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={() => setIsSigninOpen(true)} onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)} className="text-sm font-mono text-zinc-400 hover:text-white transition-colors">
              <i className="fa-solid fa-lock mr-2 text-[10px]"></i> SIGN IN
            </button>
            <button onClick={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })} onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)} className="relative group rounded-lg p-[1px] overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity"></span>
              <div className="relative bg-[#050505] px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all group-hover:bg-transparent">
                Deploy Project <i className="fa-solid fa-bolt text-[#00f0ff] group-hover:text-white transition-colors"></i>
              </div>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 w-full min-h-screen pt-24 md:pt-0">
        
        {/* ========================================== */}
        {/* CLIENT VIEW */}
        {/* ========================================== */}
        {activeView === 'client' && (
          <div className="view-enter relative w-full pb-20">
            
            {/* HERO */}
            <section className="relative pt-24 pb-24 lg:pt-40 lg:pb-32 flex flex-col justify-center items-center">
              <div className="max-w-[85rem] mx-auto px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
                <div className="premium-glass inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-xs font-mono text-zinc-300 mb-8 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] animate-pulse"></div>
                  SYSTEM: <span className="text-white font-semibold">ONLINE</span> <span className="text-zinc-600">|</span> FOR ALL NON-PROFITS
                </div>

                <h1 className="text-[3.5rem] md:text-[5rem] lg:text-[7rem] font-bold tracking-tighter text-white leading-[0.95] mb-6 w-full drop-shadow-2xl">
                  <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
                    <ScrambleText text="Enterprise Tech." />
                  </span>
                  <span className="block italic font-serif text-zinc-500 font-light pr-8">
                    Zero Cost for
                  </span>
                  <span className="block" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #00f0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <ScrambleText text="All Non-Profits." />
                  </span>
                </h1>
                
                <p className="text-lg lg:text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed">
                  Food pantries, animal rescues, disaster relief—your mission deserves world-class infrastructure. We host your apps and databases entirely for free.
                </p>

                {/* Infinite Marquee */}
                <div className="w-full max-w-5xl overflow-hidden relative mb-16 py-6 border-y border-white/5 bg-black/20 backdrop-blur-md fade-edges">
                  <div className="marquee-container text-sm font-mono text-zinc-400 font-medium tracking-wide">
                    <div className="flex gap-16 px-8 whitespace-nowrap items-center">
                      {[1,2,3].map(i => (
                        <React.Fragment key={i}>
                          <span className="flex items-center gap-3"><i className="fa-solid fa-bowl-food text-[#00f0ff]/80"></i> Food Banks</span>
                          <span className="flex items-center gap-3"><i className="fa-solid fa-paw text-[#00f0ff]/80"></i> Animal Rescues</span>
                          <span className="flex items-center gap-3"><i className="fa-solid fa-house-medical text-[#00f0ff]/80"></i> Free Clinics</span>
                          <span className="flex items-center gap-3"><i className="fa-solid fa-leaf text-[#00f0ff]/80"></i> Climate Action</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button onClick={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })} onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#00f0ff] to-blue-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-black border border-white/10 text-white font-semibold px-12 py-4 rounded-full flex items-center justify-center gap-3 w-full sm:w-auto text-lg transition-transform group-hover:scale-[0.98]">
                    Host Your Project <i className="fa-solid fa-arrow-right text-sm text-[#00f0ff] group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </button>
              </div>
            </section>

            {}
            <section className="py-24 relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden">
              <div className="max-w-[85rem] mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-xs font-mono text-[#00f0ff] tracking-widest mb-4">THE CONNECTR DIFFERENCE</h2>
                  <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Instantly see the value.</h3>
                  <p className="text-zinc-400 max-w-2xl mx-auto">Drag the slider below to see what happens to non-profit software when you switch from expensive self-hosting to our free edge infrastructure.</p>
                </div>
                <ComparisonSlider />

                {/* THERMAL RECEIPT (The true cost) */}
                <div className="mt-20 max-w-3xl mx-auto">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="md:w-1/2">
                      <h3 className="text-3xl font-bold text-white mb-4">Save $60k+/year in hosting.</h3>
                      <p className="text-zinc-400 text-sm mb-6">Most charities don't realize how much cloud providers charge for basic routing, database storage, and DDoS protection. We absorb 100% of these costs so your donations actually go toward your mission.</p>
                      <MagneticIcon>
                        <div className="inline-flex items-center gap-2 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-[#00f0ff]/50 transition-colors cursor-default">
                          <i className="fa-solid fa-calculator text-[#00f0ff]"></i> View Real Cost Breakdown
                        </div>
                      </MagneticIcon>
                    </div>
                    
                    <div className="md:w-1/2 w-full">
                      <div className="thermal-receipt p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transform rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="text-center border-b-2 border-dashed border-zinc-400 pb-4 mb-4">
                          <div className="font-bold text-xl mb-1">STANDARD CLOUD HOSTING</div>
                          <div className="text-xs text-zinc-500">INVOICE #9042-A</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span>Compute (EC2)</span><span>$1,450.00</span></div>
                          <div className="flex justify-between"><span>Managed DB (RDS)</span><span>$850.00</span></div>
                          <div className="flex justify-between"><span>Load Balancer</span><span>$240.00</span></div>
                          <div className="flex justify-between"><span>DDoS Protection</span><span>$3,000.00</span></div>
                          <div className="flex justify-between text-xs text-zinc-500"><span>Overage Fees</span><span>$420.00</span></div>
                        </div>
                        <div className="border-t-2 border-dashed border-zinc-400 mt-4 pt-4 text-lg font-bold flex justify-between">
                          <span>TOTAL/MO</span><span>$5,960.00</span>
                        </div>
                        <div className="mt-6 text-center text-xs font-bold text-red-600 bg-red-100 py-1 border border-red-300">
                          CARD DECLINED. SERVICE OFFLINE.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {}
            <section className="py-24 relative z-10 border-t border-white/5">
              <div className="max-w-[85rem] mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-xs font-mono text-[#00f0ff] tracking-widest mb-4">GLOBAL EDGE NETWORK</h2>
                  <h3 className="text-4xl font-bold text-white mb-4">Your Project, Everywhere.</h3>
                  <p className="text-zinc-400 max-w-2xl mx-auto mb-8">We deploy your non-profit software across global data centers simultaneously. Zero latency for your users, no matter where they are.</p>
                  
                  {/* Magnetic Tech Stack Icons */}
                  <div className="flex flex-wrap justify-center gap-6 mb-12">
                    {['fa-brands fa-react', 'fa-brands fa-node-js', 'fa-solid fa-database', 'fa-brands fa-aws', 'fa-brands fa-docker'].map((icon, i) => (
                      <MagneticIcon key={i}>
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-zinc-400 hover:text-[#00f0ff] hover:border-[#00f0ff]/50 transition-colors shadow-lg cursor-pointer">
                          <i className={icon}></i>
                        </div>
                      </MagneticIcon>
                    ))}
                  </div>
                </div>

                {/* Animated Map Section */}
                <SpotlightCard className="h-[400px] w-full">
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '20px 20px' }}></div>
                  <div className="relative w-full h-full opacity-80">
                    <div className="map-ping-container" style={{ top: '30%', left: '20%' }}><div className="map-ping"></div><div className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#00f0ff] bg-black/80 px-1 rounded">US-WEST</div></div>
                    <div className="map-ping-container" style={{ top: '40%', left: '28%' }}><div className="map-ping purple"></div></div>
                    <div className="map-ping-container" style={{ top: '25%', left: '48%' }}><div className="map-ping"></div><div className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#00f0ff] bg-black/80 px-1 rounded">EU-CENTRAL</div></div>
                    <div className="map-ping-container" style={{ top: '45%', left: '55%' }}><div className="map-ping purple"></div></div>
                    <div className="map-ping-container" style={{ top: '35%', left: '75%' }}><div className="map-ping"></div><div className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#00f0ff] bg-black/80 px-1 rounded">AP-NORTH</div></div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M20 30 Q 35 15, 48 25 T 75 35" fill="none" stroke="#00f0ff" strokeWidth="0.2" strokeDasharray="2 2"></path>
                    </svg>
                  </div>
                </SpotlightCard>
              </div>
            </section>

            {}
            <section className="py-24 relative z-10 bg-gradient-to-b from-transparent to-[#050505]">
              <div className="max-w-[85rem] mx-auto px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-12 items-end mb-16">
                  <div className="md:w-1/2">
                    <h2 className="text-xs font-mono text-[#00f0ff] tracking-widest mb-4">THE ARCHITECTURE OF TRUST</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">New non-profit.<br/>Veteran engineering.</h3>
                  </div>
                  <div className="md:w-1/2 border-l-2 border-[#00f0ff]/30 pl-8">
                    <p className="text-zinc-400 text-lg">Why trust us with your mission? Because ConnectR isn't built by amateurs. We are a collective of industry professionals utilizing transparent, enterprise-grade systems to guarantee your data is safe.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 relative z-10">
                  <SpotlightCard className="md:col-span-2 p-8 lg:p-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 h-full">
                      <div className="shrink-0">
                        <div className="radar-box flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                          <div className="radar-grid"></div>
                          <div className="pulse-ring"></div>
                          <i className="fa-solid fa-shield-cat relative z-10 text-[#00f0ff] text-2xl"></i>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-white mb-3">Bank-Grade Security</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">We don't cut corners on security. Every project hosted on ConnectR benefits from AES-256 database encryption, automated DDoS mitigation, and daily off-site backups.</p>
                        <div className="flex gap-4 text-[10px] font-mono text-[#00f0ff]">
                          <span className="flex items-center gap-1"><i className="fa-solid fa-check"></i> SOC-2 Compliant Tech</span>
                          <span className="flex items-center gap-1"><i className="fa-solid fa-check"></i> Auto-SSL</span>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>

                  <SpotlightCard className="md:col-span-1 p-8 text-center flex flex-col justify-center items-center group">
                    <div className="mb-6 w-20 h-20 rounded-full border-2 border-dashed border-zinc-700 group-hover:border-emerald-400 group-hover:rotate-180 transition-all duration-700 flex items-center justify-center">
                      <i className="fa-solid fa-unlock-keyhole text-2xl text-zinc-500 group-hover:text-emerald-400 transition-colors"></i>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Zero Lock-In</h4>
                    <p className="text-zinc-400 text-xs">Export databases and source code with a single click. We are a launchpad, not a cage.</p>
                  </SpotlightCard>
                </div>
              </div>
            </section>

            {}
            <section className="py-24 relative z-10">
              <div className="max-w-[85rem] mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-xs font-mono text-[#00f0ff] tracking-widest mb-4">INCUBATION PIPELINE</h2>
                  <h3 className="text-4xl font-bold text-white mb-4">From Idea to Global Scale</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  <TiltCard className="spotlight-wrapper h-[300px]">
                    <div className="spotlight-content p-8 flex flex-col items-center text-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-black border border-white/10 flex items-center justify-center text-xl font-bold text-white mb-6">1</div>
                      <h4 className="text-xl font-bold text-white mb-3">Apply & Audit</h4>
                      <p className="text-sm text-zinc-400">Submit your charity's project. Our Core Engineering Team reviews your tech stack.</p>
                    </div>
                  </TiltCard>
                  <TiltCard className="spotlight-wrapper h-[300px]">
                    <div className="spotlight-content p-8 flex flex-col items-center text-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/50 flex items-center justify-center text-xl font-bold text-[#00f0ff] mb-6 shadow-[0_0_15px_rgba(0,240,255,0.2)]">2</div>
                      <h4 className="text-xl font-bold text-white mb-3">Provisioning</h4>
                      <p className="text-sm text-zinc-400">We automatically generate your cloud environments on our secure network.</p>
                    </div>
                  </TiltCard>
                  <TiltCard className="spotlight-wrapper h-[300px]">
                    <div className="spotlight-content p-8 flex flex-col items-center text-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-black border border-white/10 flex items-center justify-center text-xl font-bold text-emerald-400 mb-6">3</div>
                      <h4 className="text-xl font-bold text-white mb-3">Global Deployment</h4>
                      <p className="text-sm text-zinc-400">Your app is pushed to edge locations globally, ensuring zero latency.</p>
                    </div>
                  </TiltCard>
                </div>
              </div>
            </section>

            {/* INTAKE FORM */}
            <section id="apply" className="py-24 relative z-10 border-t border-white/5">
              <div className="max-w-4xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold tracking-tight text-white mb-6">Initialize Your Project</h2>
                  <p className="text-xl text-zinc-400 font-light">Apply for free hosting and dedicated engineering support.</p>
                </div>

                <SpotlightCard className="p-8 md:p-12">
                  <form className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div><label className="block text-xs font-mono text-zinc-400 mb-3">Founder Name *</label><input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#00f0ff] outline-none transition-colors" placeholder="Jane Doe" onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)} /></div>
                      <div><label className="block text-xs font-mono text-zinc-400 mb-3">Work Email *</label><input type="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#00f0ff] outline-none transition-colors" placeholder="jane@nonprofit.org" onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)} /></div>
                    </div>
                    <div><label className="block text-xs font-mono text-zinc-400 mb-3">Technical Brief</label><textarea rows="4" className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#00f0ff] outline-none transition-colors resize-none" placeholder="Describe your mission..." onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)}></textarea></div>
                    <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10">
                      <p className="text-[10px] font-mono text-zinc-500 tracking-widest"><i className="fa-solid fa-lock text-[#00f0ff] mr-2"></i>SECURE SUBMISSION // AES-256</p>
                      <button type="button" className="w-full md:w-auto relative group bg-white text-black font-bold px-10 py-4 rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-[0.98]" onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)}>
                        Transmit Request <i className="fa-solid fa-arrow-right text-xs"></i>
                      </button>
                    </div>
                  </form>
                </SpotlightCard>
              </div>
            </section>
          </div>
        )}

        {/* ========================================== */}
        {/* VOLUNTEER VIEW (CORE TEAM) */}
        {/* ========================================== */}
        {}
        {activeView === 'volunteer' && (
          <div className="view-enter relative w-full pt-16 pb-20 border-t-[4px] border-[#7000ff]">
            <div className="max-w-[85rem] mx-auto px-6 lg:px-8">
              
              <div className="mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[#7000ff]/30 bg-[#7000ff]/10 text-xs font-mono text-[#7000ff] mb-8">
                    <i className="fa-solid fa-terminal"></i> INTERNAL DEV PORTAL
                  </div>
                  <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6" style={{ fontFamily: 'Orbitron' }}>Core Operations.</h2>
                  <div className="font-mono text-zinc-400 space-y-2 border-l-2 border-[#7000ff]/50 pl-6 py-2">
                    <p>&gt; <Typewriter text="Accessing internal network for ConnectR volunteers." /></p>
                    <p>&gt; Status: <span className="text-[#7000ff] animate-pulse">Awaiting your deployment_</span></p>
                  </div>
                </div>
                
                {/* CMS / Admin Toggle */}
                <button onClick={() => setIsEditMode(!isEditMode)} className={`px-6 py-3 rounded-lg border font-mono text-xs font-bold tracking-widest transition-all z-20 ${isEditMode ? 'bg-[#7000ff] text-white border-[#7000ff] shadow-[0_0_20px_rgba(112,0,255,0.4)]' : 'bg-transparent text-zinc-500 border-zinc-700 hover:text-white hover:border-[#7000ff]/50'}`}>
                  {isEditMode ? 'EXIT CMS MODE' : 'ENTER CMS MODE'}
                </button>
              </div>

              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-8">
                  <SpotlightCard className={`p-8 ${isEditMode ? 'border-[#7000ff]' : ''}`}>
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                      <h4 className="text-xs font-mono text-zinc-500 tracking-widest">NETWORK STATS</h4>
                      {isEditMode && <span className="text-[10px] font-mono text-[#7000ff] animate-pulse">EDITING LIVE DB</span>}
                    </div>
                    <div className="space-y-6">
                      <div>
                        {isEditMode ? (
                          <input type="text" value={stats.volunteers} onChange={(e) => handleStatChange('volunteers', e.target.value)} className="bg-black border border-[#7000ff]/50 rounded px-2 py-1 text-3xl font-bold text-white w-full outline-none" />
                        ) : (
                          <div className="text-3xl font-bold text-white tracking-tight">{stats.volunteers}</div>
                        )}
                        <div className="text-[10px] font-mono text-zinc-500 mt-1">ACTIVE VOLUNTEERS</div>
                      </div>
                      <div>
                        {isEditMode ? (
                          <input type="text" value={stats.uptime} onChange={(e) => handleStatChange('uptime', e.target.value)} className="bg-black border border-[#7000ff]/50 rounded px-2 py-1 text-3xl font-bold text-emerald-400 w-full outline-none" />
                        ) : (
                          <div className="text-3xl font-bold text-emerald-400 tracking-tight">{stats.uptime}</div>
                        )}
                        <div className="text-[10px] font-mono text-zinc-500 mt-1">GLOBAL UPTIME</div>
                      </div>
                      <div>
                      {isEditMode ? (
                        <input type="text" value={stats.orgs} onChange={(e) => handleStatChange('orgs', e.target.value)} className="bg-black border border-[#7000ff]/50 rounded px-2 py-1 text-3xl font-bold text-[#7000ff] w-full outline-none" />
                      ) : (
                        <div className="text-3xl font-bold text-[#7000ff] tracking-tight">{stats.orgs}</div>
                      )}
                      <div className="text-[10px] font-mono text-zinc-500 mt-1">ORGS SUPPORTED</div>
                    </div>
                  </div>
                </SpotlightCard>

                <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 font-mono text-xs text-zinc-500 h-72 overflow-hidden relative shadow-inner hidden md:block">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505] z-10 pointer-events-none"></div>
                  <div className="mb-2 text-[#7000ff] opacity-80">-- LIVE COMMIT LOG --</div>
                  <div className="space-y-2 opacity-80">
                    <div>[10:42:01] Sarah_Dev merged PR #402 for FoodRescue DB</div>
                    <div>[10:41:15] System: Auto-scaling AWS pods for ClinicApp</div>
                    <div>[10:38:59] Mike_SRE resolved latency alert in EU-West</div>
                    <div>[10:35:22] Anna_UX pushed new components to AnimalShelter UI</div>
                    <div>[10:30:00] <span className="text-[#00f0ff]">SYSTEM: 1400th Non-Profit Hosted!</span></div>
                    <div>[10:28:11] Jane_Dev initialized repo for WaterCharity</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Open Deployment Roles</h3>
                  {isEditMode && (
                      <button onClick={addNewRole} className="px-4 py-2 bg-[#7000ff]/20 text-[#7000ff] border border-[#7000ff]/50 rounded text-xs font-mono hover:bg-[#7000ff] hover:text-white transition-colors">
                        + ADD NEW ROLE
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {roles.map((role) => (
                      <div key={role.id} className={`premium-glass rounded-2xl p-8 transition-all duration-300 group ${isEditMode ? 'border-[#7000ff]/50' : 'hover:border-[#7000ff]/50'}`} onMouseEnter={() => setHoverState(true)} onMouseLeave={() => setHoverState(false)}>
                        <div className="flex justify-between items-center md:items-start flex-col md:flex-row gap-6">
                          <div className="w-full">
                            {isEditMode ? (
                              <div className="space-y-3 w-full">
                                <input type="text" value={role.title} onChange={(e) => {
                                  const updatedRoles = roles.map(r => r.id === role.id ? { ...r, title: e.target.value } : r);
                                  setRoles(updatedRoles);
                                }} onBlur={() => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'volunteerRoles', role.id), role)} className="bg-black/50 border border-[#7000ff]/50 rounded px-3 py-2 text-xl font-bold text-white w-full outline-none" placeholder="Role Title" />
                                
                                <input type="text" value={role.hours} onChange={(e) => {
                                  const updatedRoles = roles.map(r => r.id === role.id ? { ...r, hours: e.target.value } : r);
                                  setRoles(updatedRoles);
                                }} onBlur={() => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'volunteerRoles', role.id), role)} className="bg-black/50 border border-[#7000ff]/50 rounded px-3 py-1 text-xs font-mono text-zinc-400 w-full outline-none" placeholder="Hours (e.g. 5-10 HRS/WEEK)" />
                                
                                <textarea value={role.desc} onChange={(e) => {
                                  const updatedRoles = roles.map(r => r.id === role.id ? { ...r, desc: e.target.value } : r);
                                  setRoles(updatedRoles);
                                }} onBlur={() => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'volunteerRoles', role.id), role)} className="bg-black/50 border border-[#7000ff]/50 rounded px-3 py-2 text-sm text-zinc-400 w-full outline-none resize-none" rows="2" placeholder="Description" />
                              </div>
                            ) : (
                              <>
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#7000ff] transition-colors">{role.title}</h3>
                                <div className="flex gap-4 text-xs font-mono text-zinc-500 mb-4 tracking-widest">
                                  <span>REMOTE</span> <span className="text-zinc-700">|</span> <span>{role.hours}</span>
                                </div>
                                <p className="text-zinc-400 max-w-xl leading-relaxed">{role.desc}</p>
                              </>
                            )}
                          </div>
                          
                          <div className="shrink-0 flex flex-col gap-2">
                            {!isEditMode ? (
                              <button className="px-8 py-3 rounded-xl border border-[#7000ff]/50 text-[#7000ff] text-xs font-mono font-bold hover:bg-[#7000ff] hover:text-white transition-colors tracking-widest w-full">EXECUTE</button>
                            ) : (
                              <button onClick={() => deleteRole(role.id)} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-mono font-bold hover:bg-red-500 hover:text-white transition-colors w-full">
                                <i className="fa-solid fa-trash mr-2"></i> DELETE
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {roles.length === 0 && (
                      <div className="text-center py-10 border border-dashed border-zinc-700 rounded-2xl text-zinc-500 font-mono text-sm">
                        No active roles. {isEditMode && "Click '+ ADD NEW ROLE' to create one."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {}
      <footer className="border-t border-white/5 bg-[#030303] pt-12 pb-8 relative z-10 w-full mt-auto">
        <div className="max-w-[85rem] mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-zinc-600">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <i className={`fa-solid fa-network-wired ${activeView === 'client' ? 'text-[#00f0ff]' : 'text-[#7000ff]'}`}></i>
            <span className="text-white font-bold" style={{ fontFamily: 'Orbitron' }}>ConnectR</span>
          </div>
          <p>&copy; 2026 ConnectR Foundation. Built by volunteers.</p>
        </div>
      </footer>

      {/* Secure Sign In Modal */}
      {isSigninOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center view-enter" onClick={(e) => { if(e.target === e.currentTarget) setIsSigninOpen(false) }}>
          <div className="bg-[#0a0a0c] border border-[#00f0ff]/30 shadow-[0_0_50px_rgba(0,240,255,0.1)] rounded-2xl w-full max-w-md p-10 relative overflow-hidden">
            <button onClick={() => setIsSigninOpen(false)} className="absolute top-5 right-5 text-zinc-500 hover:text-white z-20"><i className="fa-solid fa-xmark text-xl"></i></button>
            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] mb-5 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <i className="fa-solid fa-fingerprint text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-widest" style={{ fontFamily: 'Orbitron' }}>SECURE LOGIN</h3>
              <p className="text-xs font-mono text-zinc-400">Authenticate to access Dashboard</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); showToast("Auth sequence initiated...", "cyan"); setTimeout(() => setIsSigninOpen(false), 1500); }} className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-2 tracking-widest">ORG EMAIL</label>
                <div className="relative"><i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i><input type="text" required className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-sm text-white focus:border-[#00f0ff] outline-none" /></div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-2 tracking-widest">ENCRYPTION KEY</label>
                <div className="relative"><i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i><input type="password" required className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-sm text-white focus:border-[#00f0ff] outline-none" /></div>
              </div>
              <button type="submit" className="w-full border border-[#00f0ff]/50 text-[#00f0ff] font-mono font-bold px-4 py-4 rounded-xl text-sm flex items-center justify-center gap-3 hover:bg-[#00f0ff] hover:text-black transition-all tracking-widest">
                INITIATE HANDSHAKE <i className="fa-solid fa-arrow-right-to-bracket"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Live Toasts */}
      <div className="fixed bottom-8 right-8 z-[150] flex flex-col gap-4 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`premium-glass border-l-4 rounded-lg px-6 py-4 flex items-center gap-3 transition-all duration-500 shadow-2xl ${toast.fading ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`} style={{ borderLeftColor: toast.color === 'purple' ? '#7000ff' : toast.color === 'emerald' ? '#34d399' : '#00f0ff' }}>
            <span style={{ color: toast.color === 'purple' ? '#7000ff' : toast.color === 'emerald' ? '#34d399' : '#00f0ff' }} className="font-mono text-lg font-bold">&gt;</span> 
            <span className="text-white font-mono text-xs">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
