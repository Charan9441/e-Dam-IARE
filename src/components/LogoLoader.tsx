import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import edamLogo from '../assets/edam-logo.jpg';

interface LogoLoaderProps {
  onComplete: () => void;
  onZoomStart?: () => void;
}

export const LogoLoader = ({ onComplete, onZoomStart }: LogoLoaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoWrapperRef = useRef<HTMLDivElement>(null);
  const glowBacklightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lock scroll during loader
    document.body.style.overflow = 'hidden';

    let isCancelled = false;
    let animFrame: number;

    // Particle Fog Canvas Setup
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const setCanvasSize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };
        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);

        const isMobile = window.innerWidth < 768;
        const numParticles = isMobile ? 40 : 85;
        const particles: any[] = [];

        for (let i = 0; i < numParticles; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2.2 + 0.6,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            alpha: Math.random() * 0.5 + 0.15,
          });
        }

        const renderCanvas = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
            ctx.fill();
          });
          animFrame = requestAnimationFrame(renderCanvas);
        };
        renderCanvas();
      }
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (containerRef.current) {
      containerRef.current.style.opacity = '1';
    }
    if (logoWrapperRef.current) {
      logoWrapperRef.current.style.opacity = '1';
    }

    if (glowBacklightRef.current) {
      animate(glowBacklightRef.current, {
        opacity: [0, 0.6],
        scale: [0.8, 1],
        duration: 1000,
        ease: 'outQuad',
      });
    }

    // Zoom out after a brief moment
    const tZoom = setTimeout(() => {
      if (isCancelled) return;
      if (onZoomStart) onZoomStart();

      if (prefersReducedMotion) {
        if (containerRef.current) {
          animate(containerRef.current, {
            opacity: 0,
            duration: 1000,
            ease: 'easeInOutQuad',
            complete: () => {
              document.body.style.overflow = '';
              onComplete();
            },
          });
        }
      } else {
        if (containerRef.current && logoWrapperRef.current) {
          animate(logoWrapperRef.current, {
            scale: [1, 10],
            filter: ['blur(0px)', 'blur(26px)'],
            opacity: [1, 0],
            duration: 1200,
            ease: 'inOutExpo',
          });

          animate(containerRef.current, {
            opacity: [1, 0],
            duration: 1200,
            ease: 'inOutExpo',
            complete: () => {
              document.body.style.overflow = '';
              onComplete();
            },
          });
        }
      }
    }, 1500); // Start zoom after 1.5 seconds

    return () => {
      isCancelled = true;
      document.body.style.overflow = '';
      clearTimeout(tZoom);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [onComplete, onZoomStart]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030305] text-[#F5F3FF] transition-opacity overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none"
      />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_30%,transparent_100%)] pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div
          ref={glowBacklightRef}
          className="absolute -inset-12 bg-[#8B5CF6]/30 rounded-full blur-[90px] opacity-0 pointer-events-none"
        />
        <div
          ref={logoWrapperRef}
          className="relative z-10 flex flex-col items-center justify-center p-6 transition-all drop-shadow-[0_0_35px_rgba(168,85,247,0.65)]"
        >
          <img
            src={edamLogo}
            alt="EDAM Logo"
            className="w-[150px] md:w-[200px] h-auto object-contain mb-8"
          />
        </div>
      </div>
    </div>
  );
};
