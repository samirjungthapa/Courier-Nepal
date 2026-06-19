import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { useState, useEffect, useRef } from "react";
import { 
  Package, 
  Search, 
  QrCode, 
  Activity,
  ArrowRight,
  Terminal,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import * as THREE from "three";
import Lenis from "lenis";



export default function HomePage() {
  const token = useSelector((s: RootState) => s.auth.token);

  // Loading Screen State
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Command Palette & Modals
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Input states
  const [trackingId, setTrackingId] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Digital Twin Simulator Engine States
  const nepaleseCities = [
    "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan",
    "Hetauda", "Biratnagar", "Birgunj", "Butwal", "Itahari",
    "Nepalgunj", "Dhangadhi", "Jumla", "Mustang"
  ];

  const [simFrom, setSimFrom] = useState("Kathmandu");
  const [simTo, setSimTo] = useState("Pokhara");
  const [simWeight, setSimWeight] = useState(1);
  const [simSpeed, setSimSpeed] = useState("Standard");
  const [simResult, setSimResult] = useState<{
    cost: number;
    time: string;
    carbon: string;
    recommendation: string;
    isSimulating: boolean;
  }>({
    cost: 180,
    time: "2 Business Days",
    carbon: "0.35 kg CO₂",
    recommendation: "Standard overland freight is recommended for non-urgent shipments.",
    isSimulating: false
  });

  // Global Network Map Hub State
  const [selectedHub, setSelectedHub] = useState<{
    name: string;
    volume: string;
    efficiency: string;
    activeShipments: number;
  }>({
    name: "Kathmandu Central Terminal",
    volume: "14,820 dispatches/day",
    efficiency: "99.4%",
    activeShipments: 384
  });



  // Live simulation variables
  const [liveTransitCount, setLiveTransitCount] = useState(482);
  const [activeDronesCount, setActiveDronesCount] = useState(24);
  const [activeFlightsCount, setActiveFlightsCount] = useState(12);

  // Cursor Spotlight State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Bento Card Tilt Mouse Tracking
  const [tiltStyles, setTiltStyles] = useState<Record<string, React.CSSProperties>>({});

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgMapRef = useRef<SVGSVGElement | null>(null);

  // 1. Loading Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 600);
          return 100;
        }
        return prev + Math.floor(Math.random() * 9) + 4;
      });
    }, 85);
    return () => clearInterval(interval);
  }, []);

  // 2. Lenis smooth scroll integration
  useEffect(() => {
    if (loading) return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Scroll progress tracker
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 50);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollY / (docHeight || 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      lenis.destroy();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loading]);

  // 3. GSAP Countup Sequence on Load Complete
  useEffect(() => {
    if (loading) return;

    // Animate stats values with GSAP
    gsap.fromTo(".kpi-digit", 
      { textContent: "0" },
      { 
        duration: 2.2, 
        ease: "power3.out", 
        snap: { textContent: 1 }, 
        stagger: 0.15 
      }
    );
  }, [loading]);

  // 4. Command Palette Listener (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 5. Cursor spotlight glow positioning
  useEffect(() => {
    const updateGlow = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateGlow);
    return () => window.removeEventListener("mousemove", updateGlow);
  }, []);

  // 6. Live ticking metrics
  useEffect(() => {
    const ticker = setInterval(() => {
      setLiveTransitCount((prev) => prev + (Math.random() > 0.48 ? 1 : -1));
      setActiveDronesCount((prev) => Math.max(10, Math.min(45, prev + (Math.random() > 0.5 ? 1 : -1))));
      setActiveFlightsCount((prev) => Math.max(5, Math.min(20, prev + (Math.random() > 0.6 ? 1 : -1))));
    }, 4000);

    return () => {
      clearInterval(ticker);
    };
  }, []);

  // 7. Interactive digital twin route calculation logic
  const handleSimulateRoute = () => {
    setSimResult((prev) => ({ ...prev, isSimulating: true }));

    // Animate local SVG path tracing
    if (svgMapRef.current) {
      const path = svgMapRef.current.querySelector(".sim-path") as SVGPathElement;
      if (path) {
        path.style.strokeDashoffset = "50";
        // Trigger reflow
        void path.getBoundingClientRect();
        path.style.transition = "stroke-dashoffset 1.8s ease-in-out";
        path.style.strokeDashoffset = "0";
      }
    }

    setTimeout(() => {
      let baseCost = simFrom === simTo ? 120 : 200;
      let extraWeight = Math.max(0, simWeight - 1) * 45;
      let multiplier = simSpeed === "Express" ? 1.6 : simSpeed === "Air Cargo" ? 2.4 : 1.0;
      let cost = Math.round((baseCost + extraWeight) * multiplier);

      let time = simSpeed === "Express" ? "Same-Day / Next-Day" : simSpeed === "Air Cargo" ? "1 Business Day" : "2 Business Days";
      let carbon = (simWeight * (simSpeed === "Air Cargo" ? 1.8 : 0.45)).toFixed(2);
      
      let recommendation = `Autonomous ${simSpeed} routing assigned via Corridor ${Math.floor(Math.random() * 8) + 1}. AI bypassed landslide nodes.`;

      setSimResult({
        cost,
        time,
        carbon: `${carbon} kg CO₂`,
        recommendation,
        isSimulating: false
      });
    }, 1800);
  };

  // 8. Interactive Bento card mouse tilt calculations
  const handleBentoTilt = (e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const tiltX = (yc - y) / 12;
    const tiltY = (x - xc) / 12;

    setTiltStyles((prev) => ({
      ...prev,
      [cardId]: {
        transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.01, 1.01, 1.01)`,
        transition: "transform 0.1s ease",
        borderColor: "rgba(0, 198, 255, 0.35)",
        boxShadow: "0 10px 30px rgba(0, 198, 255, 0.15)"
      }
    }));
  };

  const resetBentoTilt = (cardId: string) => {
    setTiltStyles((prev) => ({
      ...prev,
      [cardId]: {
        transform: `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        transition: "transform 0.4s ease",
        borderColor: "rgba(255, 255, 255, 0.05)",
        boxShadow: "none"
      }
    }));
  };

  // 9. Three.js rotating particle logistics globe with Atmospheric Glow
  useEffect(() => {
    if (loading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 280;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00C6FF, 2, 300);
    pointLight1.position.set(150, 150, 80);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x6D5DFC, 2, 300);
    pointLight2.position.set(-150, -150, 80);
    scene.add(pointLight2);

    const sphereRadius = 105;

    // 9.1 Volumetric Atmospheric Glow Sphere
    const glowGeom = new THREE.SphereGeometry(sphereRadius * 1.03, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00C6FF,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(glowGeom, glowMat);
    scene.add(glowSphere);

    // 9.2 Rotating Globe Particles
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 400 : 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorCyan = new THREE.Color("#00E5FF");
    const colorBlue = new THREE.Color("#00C6FF");
    const colorViolet = new THREE.Color("#6D5DFC");

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      positions[i * 3] = sphereRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = sphereRadius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = sphereRadius * Math.cos(phi);

      const rand = Math.random();
      let mixedColor = colorCyan;
      if (rand > 0.6) mixedColor = colorBlue;
      else if (rand > 0.3) mixedColor = colorViolet;

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: isMobile ? 2.4 : 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const globeParticles = new THREE.Points(geometry, material);
    scene.add(globeParticles);

    // 9.3 Logistics Hub Pulse Nodes
    const hubsGroup = new THREE.Group();
    const hubsList: THREE.Vector3[] = [];
    const hubCount = 6;

    for (let i = 0; i < hubCount; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const hubPos = new THREE.Vector3(
        sphereRadius * Math.sin(phi) * Math.cos(theta),
        sphereRadius * Math.sin(phi) * Math.sin(theta),
        sphereRadius * Math.cos(phi)
      );
      hubsList.push(hubPos);

      const markerGeom = new THREE.SphereGeometry(2, 8, 8);
      const markerMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00E5FF : 0x6D5DFC,
        transparent: true,
        opacity: 0.85
      });
      const markerMesh = new THREE.Mesh(markerGeom, markerMat);
      markerMesh.position.copy(hubPos);
      hubsGroup.add(markerMesh);
    }
    scene.add(hubsGroup);

    // 9.4 Air & Ground Flight Paths
    const curvesGroup = new THREE.Group();
    const traceGroup = new THREE.Group();
    const curvePoints: THREE.CatmullRomCurve3[] = [];
    const tracingProgress: number[] = [];

    for (let i = 0; i < hubCount; i++) {
      const p1 = hubsList[i];
      const p2 = hubsList[(i + 1) % hubCount];

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(sphereRadius * 1.35);

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      curvePoints.push(curve);
      tracingProgress.push(Math.random());

      const pts = curve.getPoints(40);
      const curveGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const curveMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x00C6FF : 0x6D5DFC,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      });
      const lineMesh = new THREE.Line(curveGeom, curveMat);
      curvesGroup.add(lineMesh);

      // Trailing Cargo dot
      const dotGeom = new THREE.SphereGeometry(1.2, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const dotMesh = new THREE.Mesh(dotGeom, dotMat);
      traceGroup.add(dotMesh);
    }
    scene.add(curvesGroup);
    scene.add(traceGroup);

    // 9.5 Camera reactive mouse tracking parallax
    let targetCameraX = 0;
    let targetCameraY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      targetCameraX = (e.clientX - window.innerWidth / 2) * 0.05;
      targetCameraY = (e.clientY - window.innerHeight / 2) * 0.05;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Loop
    let animId: number;
    const animate = () => {
      globeParticles.rotation.y += 0.0012;
      globeParticles.rotation.x += 0.0004;
      hubsGroup.rotation.y += 0.0012;
      hubsGroup.rotation.x += 0.0004;
      curvesGroup.rotation.y += 0.0012;
      curvesGroup.rotation.x += 0.0004;
      traceGroup.rotation.y += 0.0012;
      traceGroup.rotation.x += 0.0004;

      // Eased mouse camera look parallax
      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y += (-targetCameraY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Animate active dot segments
      for (let i = 0; i < hubCount; i++) {
        tracingProgress[i] += 0.0075;
        if (tracingProgress[i] > 1) tracingProgress[i] = 0;
        const p = curvePoints[i].getPointAt(tracingProgress[i]);
        traceGroup.children[i].position.copy(p);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      const w = canvas.parentElement?.clientWidth || window.innerWidth;
      const h = canvas.parentElement?.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [loading]);

  return (
    <div className="home-page min-h-screen text-white relative font-sans overflow-hidden select-none aurora-bg">
      
      {/* Custom Mouse Spotlight radial effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 198, 255, 0.08) 0%, rgba(109, 93, 252, 0.04) 40%, transparent 80%)`
        }}
      />

      {/* Dynamic Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00C6FF] via-[#00E5FF] to-[#6D5DFC] origin-left z-50"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* ─── LOADING MISSION CONTROL SCREEN ─── */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            className="fixed inset-0 z-50 bg-[#071426] flex flex-col items-center justify-center"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          >
            <div className="w-full max-w-md px-8 flex flex-col items-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border border-dashed border-[#00C6FF] flex items-center justify-center mb-6 relative"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#6D5DFC] flex items-center justify-center shadow-lg shadow-[#00C6FF]/40">
                  <Package size={16} className="text-white" />
                </div>
                <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-[#00E5FF] rounded-full shadow-lg shadow-[#00E5FF]/80 -translate-x-1/2" />
              </motion.div>

              <h2 className="text-xl font-extrabold tracking-widest text-white uppercase flex gap-1">
                {"COURIER".split("").map((char, index) => (
                  <motion.span 
                    key={index}
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.1, repeatType: "reverse" }}
                  >
                    {char}
                  </motion.span>
                ))}
                <span className="text-[#00E5FF] font-black">NEPAL v3</span>
              </h2>
              <p className="text-[#6a7c96] text-xs font-mono tracking-widest mt-1 uppercase">Logistics Operating System</p>

              <div className="w-full bg-white/5 border border-white/10 h-1.5 rounded-full overflow-hidden mt-8 relative">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#00C6FF] via-[#00E5FF] to-[#6D5DFC]"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>

              <span className="text-[#a3b3c9] text-sm font-mono mt-3">{loadProgress}% INITALIZED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── COMMAND PALETTE MODAL ─── */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#071426]/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-2xl relative"
            >
              <button 
                onClick={() => setCommandPaletteOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                ✕
              </button>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Terminal size={18} className="text-[#00E5FF]" /> Command Palette Shortcuts
              </h3>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-white text-sm placeholder-white/30 mb-6"
                placeholder="Search tools, tracking, simulator..."
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <Link to="/track" onClick={() => setCommandPaletteOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                  <span className="text-sm text-white/80 group-hover:text-white flex items-center gap-3"><Search size={16} /> Track Shipments</span>
                  <kbd className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded font-mono">⌘T</kbd>
                </Link>
                <a href="#calculator" onClick={() => setCommandPaletteOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                  <span className="text-sm text-white/80 group-hover:text-white flex items-center gap-3"><Activity size={16} /> Digital Twin Simulator</span>
                  <kbd className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded font-mono">⌘D</kbd>
                </a>
                <Link to="/ai" onClick={() => setCommandPaletteOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                  <span className="text-sm text-white/80 group-hover:text-white flex items-center gap-3"><Cpu size={16} /> AI Dispatch Center</span>
                  <kbd className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded font-mono">⌘AI</kbd>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FLOATING GLASS NAVIGATION BAR ─── */}
      <header className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-40 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${scrolled ? 'bg-[#071426]/75 border-white/10 py-3 shadow-lg shadow-[#000000]/30' : 'bg-transparent border-transparent py-5'}`}>
        <div className="px-6 flex items-center justify-between gap-4">
          <Link to="/" className="text-lg font-black tracking-tighter flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#6D5DFC] flex items-center justify-center shadow-lg shadow-[#00C6FF]/25 group-hover:scale-105 transition-transform">
              <Package size={14} className="text-white" />
            </span>
            <span className="text-white font-bold group-hover:text-[#00E5FF] transition-colors">Courier<span className="text-[#00C6FF]">Nepal</span></span>
            <span className="text-[9px] font-mono border border-[#00C6FF]/30 text-[#00E5FF] bg-[#00C6FF]/5 px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:inline-block">OS v3</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <a href="#services" className="text-sm text-white/60 hover:text-white px-4 py-2 hover:bg-white/5 rounded-xl transition-all font-medium">Services</a>
            <a href="#intelligence" className="text-sm text-white/60 hover:text-white px-4 py-2 hover:bg-white/5 rounded-xl transition-all font-medium">Control Room</a>
            <a href="#network" className="text-sm text-white/60 hover:text-white px-4 py-2 hover:bg-white/5 rounded-xl transition-all font-medium">Network Map</a>
            <a href="#calculator" className="text-sm text-white/60 hover:text-white px-4 py-2 hover:bg-white/5 rounded-xl transition-all font-medium">Digital Twin</a>
            <a href="#timeline" className="text-sm text-white/60 hover:text-white px-4 py-2 hover:bg-white/5 rounded-xl transition-all font-medium">Operations Timeline</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/40 border border-white/10 bg-white/5 px-2.5 py-1.5 rounded-xl hover:text-white hover:border-white/20 transition-all font-mono"
            >
              <span>⌘K</span>
            </button>
            {token ? (
              <Link to="/dashboard" className="bg-[#00C6FF] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-[#00C6FF]/20 hover:bg-[#00b3e6] transition-all hover:scale-[1.02]">
                Console
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="bg-gradient-to-r from-[#00C6FF] to-[#6D5DFC] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-[#00C6FF]/20 hover:scale-[1.02] transition-all">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── MISSION CONTROL HERO V3 ─── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(0,198,255,0.08)_0%,transparent_80%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 relative">
          
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-[#a3b3c9] font-semibold tracking-wide mb-6 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              SpaceX Control & Drone Node dispatch v3.4 Active
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-white"
            >
              Logistics Mission <br />
              <span className="bg-gradient-to-r from-[#00C6FF] via-[#00E5FF] to-[#6D5DFC] bg-clip-text text-transparent">Control Operating System</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-[#a3b3c9] max-w-xl mb-8 leading-relaxed"
            >
              Telemetry systems evaluating dynamic landslide corridors, optimizing global transits, and tracking every package mile in real-time.
            </motion.p>

            {/* Tracking Search Widget */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-lg bg-[#ffffff]/5 border border-white/10 p-2.5 rounded-2xl backdrop-blur-xl flex flex-col sm:flex-row gap-2 shadow-2xl mb-12 animate-pulse"
            >
              <div className="flex-1 flex items-center px-3 gap-2">
                <Search size={18} className="text-[#00C6FF]" />
                <input 
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-white/30"
                  placeholder="Enter dynamic parcel tracking ID (e.g. 1)..."
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowQRScanner(!showQRScanner)}
                  className="bg-white/5 border border-white/10 hover:border-white/20 p-3 rounded-xl transition-all text-white flex items-center justify-center"
                >
                  <QrCode size={16} />
                </button>
                <Link 
                  to={trackingId ? `/track?id=${trackingId}` : "/track"}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#00C6FF] to-[#6D5DFC] hover:opacity-90 text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-lg shadow-[#00C6FF]/25 flex items-center justify-center gap-2"
                >
                  Scan & Track <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* QR Scanner Feed Simulator */}
            {showQRScanner && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-black/60 border border-white/10 rounded-2xl p-6 mb-8 text-center flex flex-col items-center justify-center relative overflow-hidden"
              >
                <div className="w-32 h-32 border-2 border-dashed border-[#00C6FF] rounded-xl flex items-center justify-center text-xs text-white/40 relative">
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-[#00E5FF] animate-bounce" />
                  [ Camera Stream Active ]
                </div>
                <p className="text-xs text-white/50 mt-4">Place code in guiding square.</p>
              </motion.div>
            )}

            {/* Mission Control Live KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              {[
                { count: liveTransitCount, label: "Live Active Cargo", class: "kpi-digit" },
                { count: activeDronesCount, label: "Active Drones", class: "kpi-digit" },
                { count: activeFlightsCount, label: "Air Cargo Flights", class: "kpi-digit" },
                { count: "99.8", suffix: "%", label: "Delivery Accuracy", class: "kpi-no-anim" }
              ].map((st, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 px-4 py-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-0.5">
                    <span className={st.class}>{st.count}</span>{st.suffix}
                  </div>
                  <div className="text-[10px] text-[#6a7c96] font-bold tracking-wider uppercase leading-none">{st.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* WebGL Cargo Sphere */}
          <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[480px] flex items-center justify-center">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" />
            
            {/* Mission Control Floating Telemetry */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-[8%] left-[-8%] bg-white/5 border border-white/10 p-3.5 rounded-2xl shadow-xl backdrop-blur-lg flex items-center gap-3 pointer-events-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00C6FF]/10 flex items-center justify-center">
                <Activity size={16} className="text-[#00C6FF]" />
              </div>
              <div>
                <div className="text-[9px] text-[#6a7c96] font-bold">LINK STATUS</div>
                <div className="text-xs font-bold text-white">SATELLITE ACTIVE</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── REAL-TIME GLOBAL LOGISTICS INTELLIGENCE (DASHBOARD) ─── */}
      <section id="intelligence" className="py-24 relative bg-black/10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs text-[#00E5FF] font-black tracking-widest uppercase bg-[#00E5FF]/5 border border-[#00E5FF]/15 px-3 py-1 rounded-full">Telemetry Analytics</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">Logistics Command Center</h2>
            <p className="text-sm text-[#a3b3c9] mt-3">Monitoring active dispatch routing grids, regional volume capacity, and fleet utilization metrics.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Dashboard Spline graph */}
            <div className="lg:col-span-8 bg-[#030a17]/50 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Active Dispatch Volumes</h3>
                  <p className="text-xs text-[#a3b3c9] mt-0.5">Real-time volume flows across core airport hubs</p>
                </div>
                <span className="text-[10px] font-mono text-[#00E5FF] border border-[#00E5FF]/30 px-2 py-0.5 rounded bg-[#00E5FF]/5 font-bold">LIVE TELEMETRY FEED</span>
              </div>

              {/* Animated Spline chart */}
              <div className="w-full h-52 relative mb-4">
                <svg className="w-full h-full text-[#00C6FF]" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <path d="M 0 90 Q 40 40 80 70 T 160 30 T 240 50 T 300 15 L 300 100 L 0 100 Z" fill="url(#chartGlow)" />
                  <path d="M 0 90 Q 40 40 80 70 T 160 30 T 240 50 T 300 15" fill="none" stroke="#00C6FF" strokeWidth="2" />
                  <circle cx="80" cy="70" r="3" fill="#00E5FF" />
                  <circle cx="160" cy="30" r="3" fill="#6D5DFC" />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                <div>
                  <span className="text-[9px] text-[#6a7c96] font-bold uppercase">Average latency</span>
                  <div className="text-lg font-black text-white mt-1">4.2 min</div>
                </div>
                <div>
                  <span className="text-[9px] text-[#6a7c96] font-bold uppercase">Bypassed Landslides</span>
                  <div className="text-lg font-black text-[#10b981] mt-1">14 corridors</div>
                </div>
                <div>
                  <span className="text-[9px] text-[#6a7c96] font-bold uppercase">Active Nodes</span>
                  <div className="text-lg font-black text-[#6D5DFC] mt-1">2,840 links</div>
                </div>
              </div>
            </div>

            {/* Dashboard Sidebar Metric stack */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {[
                { label: "Active Drones Queue", value: `${activeDronesCount} units`, stat: "Capacity: 98.2%", color: "text-[#00C6FF]" },
                { label: "Cargo Air Freight Utilization", value: "84.2%", stat: "12 active corridors", color: "text-[#6D5DFC]" },
                { label: "CO₂ Carbon Footprint Reductions", value: "3.4 tons saved", stat: "42% electric fleet", color: "text-[#10b981]" }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#030a17]/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-[#a3b3c9] font-medium">{item.label}</span>
                    <div className={`text-2xl font-black mt-2 ${item.color}`}>{item.value}</div>
                  </div>
                  <div className="text-[10px] text-[#6a7c96] font-semibold mt-4 uppercase tracking-wider">{item.stat}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── GLOBAL NETWORK VISUALIZATION ─── */}
      <section id="network" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 text-left flex flex-col items-start">
              <span className="text-xs text-[#6D5DFC] font-black tracking-widest uppercase bg-[#6D5DFC]/5 border border-[#6D5DFC]/15 px-3 py-1 rounded-full">Operations Nodes</span>
              <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight">Dynamic Global Cargo Paths</h2>
              <p className="text-sm text-[#a3b3c9] mt-3 mb-6">
                Hover over active dispatch centers on our interactive logistics map grid to analyze live cargo queues and terminal performance indexes.
              </p>

              {/* Hub Detail Glass Panel */}
              <div className="w-full bg-[#030a17]/50 border border-[#00C6FF]/20 p-5 rounded-2xl shadow-xl backdrop-blur-md">
                <span className="text-[9px] font-mono text-[#00E5FF] font-bold uppercase tracking-wider">SELECTED NODE TELEMETRY</span>
                <h4 className="text-base font-bold text-white mt-1">{selectedHub.name}</h4>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-[10px] text-[#6a7c96] font-bold uppercase">Daily Volume</div>
                    <div className="text-sm font-black text-white mt-0.5">{selectedHub.volume}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6a7c96] font-bold uppercase">Success Index</div>
                    <div className="text-sm font-black text-[#10b981] mt-0.5">{selectedHub.efficiency}</div>
                  </div>
                </div>
                <div className="text-[10px] text-[#6D5DFC] font-mono font-bold mt-3 uppercase tracking-wider">
                  ⚡ {selectedHub.activeShipments} ACTIVE PACKAGES IN QUEUE
                </div>
              </div>
            </div>

            {/* Interactive map visual */}
            <div className="lg:col-span-7 bg-[#030a17]/30 border border-white/5 rounded-3xl p-6 relative">
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              </div>

              {/* Vector SVG map representing Nepal hubs */}
              <svg viewBox="0 0 400 180" className="w-full h-auto text-white/5" stroke="currentColor" strokeWidth="0.5" fill="none">
                {/* Dotted background connections */}
                <path d="M 50 80 Q 120 40 200 90 T 350 70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                <path d="M 90 140 Q 180 80 280 120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />

                {/* Hub Points */}
                {[
                  { name: "Kathmandu Central Terminal", x: 200, y: 90, color: "text-[#00C6FF]", active: 384, vol: "14,820 dispatches/day", eff: "99.4%" },
                  { name: "Pokhara Hub Terminal", x: 130, y: 70, color: "text-[#00E5FF]", active: 142, vol: "6,200 dispatches/day", eff: "98.9%" },
                  { name: "Dhangadhi Regional Node", x: 50, y: 50, color: "text-[#6D5DFC]", active: 94, vol: "3,100 dispatches/day", eff: "97.4%" },
                  { name: "Biratnagar Cargo Terminal", x: 320, y: 110, color: "text-[#00C6FF]", active: 205, vol: "8,900 dispatches/day", eff: "99.1%" },
                  { name: "Nepalgunj Distribution Center", x: 90, y: 100, color: "text-[#6D5DFC]", active: 118, vol: "4,400 dispatches/day", eff: "98.2%" }
                ].map((hub, idx) => (
                  <g key={idx} className="cursor-pointer" onClick={() => setSelectedHub({ name: hub.name, volume: hub.vol, efficiency: hub.eff, activeShipments: hub.active })}>
                    <circle cx={hub.x} cy={hub.y} r="10" className="fill-white/5 hover:fill-[#00C6FF]/10 transition-colors" />
                    <circle cx={hub.x} cy={hub.y} r="4" className={selectedHub.name === hub.name ? "fill-[#00E5FF]" : "fill-white/40"} />
                    {selectedHub.name === hub.name && (
                      <circle cx={hub.x} cy={hub.y} r="14" className="stroke-[#00E5FF] stroke-[1] animate-ping" />
                    )}
                  </g>
                ))}
              </svg>
              <div className="text-[10px] text-[#6a7c96] font-mono text-center mt-4 uppercase">
                CLICK NODES TO MAP TELEMETRY VECTORS
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── DIGITAL TWIN LOGISTICS SIMULATOR ─── */}
      <section id="calculator" className="py-24 bg-black/15 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Estimator Configuration */}
            <div className="lg:col-span-5 text-left flex flex-col items-start justify-between">
              <div>
                <span className="text-xs text-[#00E5FF] font-black tracking-widest uppercase bg-[#00E5FF]/5 border border-[#00E5FF]/15 px-3 py-1 rounded-full">Digital Twin Engine</span>
                <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight">Path Optimization Solver</h2>
                <p className="text-sm text-[#a3b3c9] mt-3 mb-8">Model shipping paths and predict estimated latency through autonomous logistics simulation.</p>
              </div>

              <div className="w-full bg-[#030a17]/50 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-[#a3b3c9] uppercase tracking-wide">Shipment Weight</label>
                    <span className="text-xs font-mono font-bold text-[#00E5FF]">{simWeight} kg</span>
                  </div>
                  <input 
                    type="range"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={simWeight}
                    onChange={(e) => setSimWeight(parseFloat(e.target.value))}
                    className="w-full accent-[#00C6FF] bg-white/5 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#a3b3c9] uppercase tracking-wide">Pickup Node</label>
                    <select 
                      value={simFrom}
                      onChange={(e) => setSimFrom(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#00C6FF]"
                    >
                      {nepaleseCities.map((c) => <option key={c} value={c} className="bg-[#071426]">{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#a3b3c9] uppercase tracking-wide">Destination Node</label>
                    <select 
                      value={simTo}
                      onChange={(e) => setSimTo(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#00C6FF]"
                    >
                      {nepaleseCities.map((c) => <option key={c} value={c} className="bg-[#071426]">{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#a3b3c9] uppercase tracking-wide">Velocity Profile</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Standard", "Express", "Air Cargo"].map((serv) => (
                      <button
                        key={serv}
                        onClick={() => setSimSpeed(serv)}
                        className={`text-xs font-semibold py-2.5 rounded-xl border transition-all ${simSpeed === serv ? 'bg-[#00C6FF] border-[#00C6FF] text-white' : 'bg-white/5 border-white/10 text-[#a3b3c9] hover:border-white/20'}`}
                      >
                        {serv}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSimulateRoute}
                  disabled={simResult.isSimulating}
                  className="w-full bg-gradient-to-r from-[#00C6FF] to-[#6D5DFC] text-white font-bold text-xs py-3.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {simResult.isSimulating ? "COMPUTING DIJKSTRA NODES..." : "RUN DIGITAL TWIN SIMULATION"}
                </button>
              </div>
            </div>

            {/* Live Solver Telemetry Screen */}
            <div className="lg:col-span-7 bg-[#030a17]/60 border border-white/10 rounded-3xl p-8 backdrop-blur-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent" />
              
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-[#a3b3c9] uppercase mb-4 text-center">SOLVER PIPELINE SIMULATION</h3>
                
                {/* SVG Live Simulation Route Map */}
                <div className="w-full bg-black/45 rounded-2xl border border-white/5 p-4 flex items-center justify-center mb-6 h-44">
                  <svg ref={svgMapRef} className="w-full h-full text-white/10" viewBox="0 0 200 100">
                    <circle cx="40" cy="50" r="3" fill="#6D5DFC" />
                    <circle cx="160" cy="50" r="3" fill="#00E5FF" />
                    <path 
                      className="sim-path" 
                      d="M 40 50 Q 100 20 160 50" 
                      fill="none" 
                      stroke="#00C6FF" 
                      strokeWidth="1.5" 
                      strokeDasharray="60" 
                      strokeDashoffset="60" 
                    />
                    <text x="35" y="65" fill="#a3b3c9" fontSize="6" fontFamily="monospace">{simFrom}</text>
                    <text x="145" y="65" fill="#a3b3c9" fontSize="6" fontFamily="monospace">{simTo}</text>
                  </svg>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <span className="text-[9px] text-[#6a7c96] font-bold uppercase">Estimated Latency</span>
                    <div className="text-sm font-black text-white mt-1">{simResult.time}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <span className="text-[9px] text-[#6a7c96] font-bold uppercase">Computed Cost</span>
                    <div className="text-sm font-black text-white mt-1">NPR {simResult.cost}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <span className="text-[9px] text-[#6a7c96] font-bold uppercase">CO₂ Footprint</span>
                    <div className="text-sm font-black text-[#10b981] mt-1">{simResult.carbon}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <span className="text-[9px] text-[#6a7c96] font-bold uppercase">Optimal Route</span>
                    <div className="text-sm font-black text-[#6D5DFC] mt-1">Found</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 mt-6 flex gap-3 items-start">
                <span className="p-2 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center flex-shrink-0">
                  <Cpu size={16} />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">AI Routing Recommendation</h4>
                  <p className="text-[11px] text-[#a3b3c9] mt-0.5 leading-relaxed">{simResult.recommendation}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── DYNAMIC LOGISTICS SCROLL TIMELINE STORYTELLING ─── */}
      <section id="timeline" className="py-24 relative bg-black/15">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs text-[#6D5DFC] font-black tracking-widest uppercase bg-[#6D5DFC]/5 border border-[#6D5DFC]/15 px-3 py-1 rounded-full">Journey Milestones</span>
            <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight">The Path of a Package</h2>
            <p className="text-sm text-[#a3b3c9] mt-3">From pickup coordinates to final handover authentication.</p>
          </div>

          <div className="relative border-l border-white/10 max-w-3xl mx-auto pl-8 flex flex-col gap-12">
            {[
              { title: "01 // Order Creation Nodes", desc: "Package parameters synchronized into blockchain dispatch database.", status: "PENDING_PICKUP" },
              { title: "02 // Agent Retrieval Collection", desc: "Barcode registered via hand-held digital scanner terminal.", status: "PICKED" },
              { title: "03 // Sorting Facility Processing", desc: "Dijkstra routing assigned automatically inside sorting warehouse.", status: "PROCESSING" },
              { title: "04 // Corridor Transportation", desc: "Cargo forwarded via air flight transit lines.", status: "IN_TRANSIT" },
              { title: "05 // Destination Hub Sorting", desc: "Telemetry update triggered at municipal dispatch hub.", status: "OUT_FOR_DELIVERY" },
              { title: "06 // Final Handover Signature", desc: "Biometric authentication completed successfully.", status: "DELIVERED" }
            ].map((node, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="relative group cursor-pointer"
              >
                {/* Checkpoint light */}
                <div className="absolute left-[-41px] top-1.5 w-6 h-6 rounded-full bg-[#071426] border-2 border-white/15 group-hover:border-[#00C6FF] flex items-center justify-center transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C6FF]/60 group-hover:bg-[#00E5FF] transition-all" />
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-[#00E5FF] transition-colors">{node.title}</h4>
                <p className="text-xs text-[#a3b3c9] mt-1 leading-relaxed">{node.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE OPERATIONS FEED (TICKER) ─── */}
      <section className="py-24 bg-black/10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <span className="text-xs text-[#00C6FF] font-black tracking-widest uppercase bg-[#00C6FF]/5 border border-[#00C6FF]/15 px-3 py-1 rounded-full">Telemetry Stream</span>
          <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight">Active Dispatches</h2>
        </div>

        {/* Live Scrolling Activity Feed */}
        <div className="max-w-3xl mx-auto border border-white/10 rounded-3xl p-6 bg-[#030a17]/50 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-[#030a17] to-transparent z-10" />
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#030a17] to-transparent z-10" />

          <div className="ops-feed-container relative">
            <div className="ops-feed-scroll flex flex-col gap-4">
              {[
                { log: "Cargo Flight NP-409 landed at Kathmandu Central Sorting Hub", type: "AIR" },
                { log: "Autonomous delivery drone dispatch initialized for Lalitpur sector", type: "DRONE" },
                { log: "B2B Shipment #98472 cleared customs check at Birgunj Border Port", type: "CUSTOMS" },
                { log: "Local delivery verified via digital signature inside Pokhara Hub", type: "DELIVERED" },
                { log: "Dijkstra path solver modified route coordinates to avoid Trishuli landslide", type: "AI" },
                { log: "Hetauda Distribution Hub verified 1,840 incoming express units", type: "WAREHOUSE" },
                // Duplicate logs for infinite loop
                { log: "Cargo Flight NP-409 landed at Kathmandu Central Sorting Hub", type: "AIR" },
                { log: "Autonomous delivery drone dispatch initialized for Lalitpur sector", type: "DRONE" },
                { log: "B2B Shipment #98472 cleared customs check at Birgunj Border Port", type: "CUSTOMS" },
                { log: "Local delivery verified via digital signature inside Pokhara Hub", type: "DELIVERED" },
                { log: "Dijkstra path solver modified route coordinates to avoid Trishuli landslide", type: "AI" },
                { log: "Hetauda Distribution Hub verified 1,840 incoming express units", type: "WAREHOUSE" }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                    <span className="text-xs font-mono text-white/90">{item.log}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#6a7c96] uppercase font-bold">{item.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── BENTO GRID 3.0 (INTELLIGENCE MODULES) ─── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs text-[#00E5FF] font-black tracking-widest uppercase bg-[#00E5FF]/5 border border-[#00E5FF]/15 px-3 py-1 rounded-full">Intelligence Assets</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">Autonomous Dispatch Modules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]">
            {/* Bento Card 1 */}
            <div 
              onMouseMove={(e) => handleBentoTilt(e, "b1")}
              onMouseLeave={() => resetBentoTilt("b1")}
              style={tiltStyles["b1"]}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bento-card-v3"
            >
              <div className="glow-overlay" style={{ "--mouse-x": `${mousePos.x}px`, "--mouse-y": `${mousePos.y}px` } as React.CSSProperties} />
              <div>
                <span className="text-[10px] text-[#00C6FF] font-bold uppercase tracking-wider">AI Optimization</span>
                <h3 className="text-lg font-bold text-white mt-1">Autonomous Dijkstra Path Solver</h3>
              </div>
              <p className="text-xs text-[#a3b3c9]">Re-calculating travel vectors across municipal hubs instantly.</p>
            </div>

            {/* Bento Card 2 */}
            <div 
              onMouseMove={(e) => handleBentoTilt(e, "b2")}
              onMouseLeave={() => resetBentoTilt("b2")}
              style={tiltStyles["b2"]}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bento-card-v3"
            >
              <div className="glow-overlay" style={{ "--mouse-x": `${mousePos.x}px`, "--mouse-y": `${mousePos.y}px` } as React.CSSProperties} />
              <div>
                <span className="text-[10px] text-[#6D5DFC] font-bold uppercase tracking-wider">Asset Telemetry</span>
                <h3 className="text-lg font-bold text-white mt-1">Dynamic Fleet Routing Map</h3>
              </div>
              <p className="text-xs text-[#a3b3c9]">Monitoring cargo planes and electric transit vans continuously.</p>
            </div>

            {/* Bento Card 3 */}
            <div 
              onMouseMove={(e) => handleBentoTilt(e, "b3")}
              onMouseLeave={() => resetBentoTilt("b3")}
              style={tiltStyles["b3"]}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bento-card-v3"
            >
              <div className="glow-overlay" style={{ "--mouse-x": `${mousePos.x}px`, "--mouse-y": `${mousePos.y}px` } as React.CSSProperties} />
              <div>
                <span className="text-[10px] text-[#00E5FF] font-bold uppercase tracking-wider">Eco-corridor</span>
                <h3 className="text-lg font-bold text-white mt-1">Carbon Reduction Metrics</h3>
              </div>
              <p className="text-xs text-[#a3b3c9]">Diverting cargo to eco-freight routes to save metric tons of CO₂.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AURORA CONVERSION CTA ─── */}
      <section className="py-28 relative text-center overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-r from-[#00C6FF] to-[#6D5DFC] rounded-full opacity-[0.07] blur-[130px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">Join the Modern Logistics Grid</h2>
          <p className="text-sm text-[#a3b3c9] max-w-md mx-auto mt-4 mb-8">Deploy automated dispatch routing APIs and scale cargo fulfillment with Courier Nepal.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto bg-gradient-to-r from-[#00C6FF] to-[#6D5DFC] hover:opacity-95 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-xl shadow-[#00C6FF]/25 hover:scale-[1.02] transition-all"
            >
              Start Shipping Now
            </Link>
            <a 
              href="#calculator" 
              className="w-full sm:w-auto bg-white/5 border border-white/10 hover:border-white/20 text-white font-semibold text-sm px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
            >
              Simulate Transit Cost
            </a>
          </div>
        </div>
      </section>

      {/* ─── ENTERPRISE FOOTER ─── */}
      <footer className="py-16 bg-black/45 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="text-md font-extrabold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-[#00C6FF] flex items-center justify-center">
                <Package size={12} className="text-white" />
              </span>
              Courier Nepal
            </div>
            <p className="text-xs text-[#6a7c96] mt-4 leading-relaxed">
              The industry-first AI logistics node mesh built for enterprise shipping, route optimization, and cargo dispatch telemetry.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Ecosystem</h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#6a7c96]">
              <span className="hover:text-white cursor-pointer transition-colors">Same Day Dispatch</span>
              <span className="hover:text-white cursor-pointer transition-colors">International Air Routing</span>
              <span className="hover:text-white cursor-pointer transition-colors">B2B API Integrations</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Developer Tools</h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#6a7c96]">
              <Link to="/track" className="hover:text-white transition-colors">Shipment Journey</Link>
              <a href="#calculator" className="hover:text-white transition-colors">Twin Solver</a>
              <Link to="/ai" className="hover:text-white transition-colors">Dispatch Copilot</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Operations Center</h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#6a7c96]">
              <a href="mailto:support@couriernepal.com" className="hover:text-white transition-colors">support@couriernepal.com</a>
              <span>24/7 Hotline dispatch</span>
              <span>77 District Hub Network</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-white/5 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#6a7c96]">
          <span>© {new Date().getFullYear()} Courier Nepal Inc. All rights reserved.</span>
          <span className="font-mono">SECURE DISPATCH NODE ACTIVE</span>
        </div>
      </footer>

    </div>
  );
}
