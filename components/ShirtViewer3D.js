"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCcw, RotateCw } from "lucide-react";
import { translate } from "../lib/i18n";

// Area desain pada tekstur panel depan model (fraksi 0-1, y dari atas).
// Bila posisi desain terlihat meleset, ubah angka ini saja.
const PRINT_RECT = { x: 0.24, y: 0.13, w: 0.52, h: 0.46 };
const TEX_SIZE = 2048;
const MODEL_URL = "/models/white-tee.glb";

export default function ShirtViewer3D({ artwork, color, t }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const mountRef = useRef(null);
  const world = useRef(null);
  const [status, setStatus] = useState("loading");
  const [auto, setAuto] = useState(true);
  const autoRef = useRef(true);
  const artworkRef = useRef(artwork);
  const colorRef = useRef(color);
  artworkRef.current = artwork;
  colorRef.current = color;

  useEffect(() => {
    let alive = true;
    let raf = 0;
    (async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import(
          "three/addons/loaders/GLTFLoader.js"
        );
        const { OrbitControls } = await import(
          "three/addons/controls/OrbitControls.js"
        );
        const { RoomEnvironment } = await import(
          "three/addons/environments/RoomEnvironment.js"
        );
        if (!alive || !mountRef.current) return;
        const mount = mountRef.current;
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        mount.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(
          new RoomEnvironment(),
          0.04,
        ).texture;
        const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(1.2, 2.2, 2.4);
        scene.add(key);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x8a93a8, 0.5));
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotateSpeed = 1.6;
        controls.minDistance = 0.4;
        controls.maxDistance = 4;
        const w = {
          THREE,
          renderer,
          scene,
          camera,
          controls,
          printMat: null,
          fabricMats: [],
          home: null,
          tex: null,
        };
        world.current = w;
        const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
        if (!alive) return;
        scene.add(gltf.scene);
        const seen = new Set();
        gltf.scene.traverse((obj) => {
          if (!obj.isMesh) return;
          const mats = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          mats.forEach((m) => {
            if (!m || seen.has(m.uuid)) return;
            seen.add(m.uuid);
            if ((m.name || "").startsWith("PT_FABRIC")) w.printMat = m;
            else if ("color" in m) w.fabricMats.push(m);
          });
        });
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        controls.target.copy(sphere.center);
        const dir = new THREE.Vector3(0.35, 0.18, 1).normalize();
        camera.position
          .copy(sphere.center)
          .addScaledVector(dir, sphere.radius * 2.7);
        camera.near = sphere.radius / 50;
        camera.far = sphere.radius * 30;
        camera.updateProjectionMatrix();
        w.home = {
          pos: camera.position.clone(),
          target: sphere.center.clone(),
        };
        const resize = () => {
          const width = mount.clientWidth || 300;
          const height = mount.clientHeight || 420;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(mount);
        w.ro = ro;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          controls.autoRotate = autoRef.current;
          controls.update();
          renderer.render(scene, camera);
        };
        loop();
        setStatus("ready");
        applyArtwork();
      } catch (e) {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      const w = world.current;
      if (w) {
        w.ro?.disconnect();
        w.controls?.dispose();
        w.scene?.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose();
            const mats = Array.isArray(obj.material)
              ? obj.material
              : [obj.material];
            mats.forEach((m) => m?.dispose());
          }
        });
        w.tex?.dispose();
        w.renderer?.dispose();
        w.renderer?.domElement?.remove();
        world.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyArtwork() {
    const w = world.current;
    if (!w || !w.printMat) return;
    const THREE = w.THREE;
    const img = new Image();
    img.onload = () => {
      if (!world.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = TEX_SIZE;
      canvas.height = TEX_SIZE;
      const cx = canvas.getContext("2d");
      cx.fillStyle = colorRef.current || "#f2f0e8";
      cx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
      const rx = PRINT_RECT.x * TEX_SIZE;
      const ry = PRINT_RECT.y * TEX_SIZE;
      const rw = PRINT_RECT.w * TEX_SIZE;
      const rh = PRINT_RECT.h * TEX_SIZE;
      const scale = Math.min(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      cx.drawImage(img, rx + (rw - dw) / 2, ry + (rh - dh) / 2, dw, dh);
      const tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      if (w.tex) w.tex.dispose();
      w.tex = tex;
      w.printMat.map = tex;
      w.printMat.color.set("#ffffff");
      w.printMat.transparent = false;
      w.printMat.needsUpdate = true;
    };
    img.src = artworkRef.current;
  }

  function applyColor() {
    const w = world.current;
    if (!w) return;
    w.fabricMats.forEach((m) => m.color.set(colorRef.current));
    applyArtwork();
  }

  useEffect(() => {
    if (status === "ready") applyArtwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork, status]);
  useEffect(() => {
    if (status === "ready") applyColor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, status]);

  function resetView() {
    const w = world.current;
    if (!w || !w.home) return;
    w.camera.position.copy(w.home.pos);
    w.controls.target.copy(w.home.target);
    w.controls.update();
  }

  return (
    <div className="viewer3d">
      <div className="viewer3d-mount" ref={mountRef} />
      {status === "loading" && (
        <div className="viewer3d-overlay">
          <LoaderCircle className="spinner" size={22} />
          <span>{tr("loading3d")}</span>
        </div>
      )}
      {status === "error" && (
        <div className="viewer3d-overlay">
          <span>{tr("error3d")}</span>
        </div>
      )}
      {status === "ready" && (
        <div className="viewer3d-bar">
          <span className="viewer3d-hint">{tr("hint3d")}</span>
          <div className="viewer3d-actions">
            <button
              type="button"
              className={auto ? "icon-button selected" : "icon-button"}
              aria-label={tr("autoRotate")}
              aria-pressed={auto}
              title={tr("autoRotate")}
              onClick={() => {
                autoRef.current = !auto;
                setAuto(!auto);
              }}
            >
              <RotateCw size={16} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={tr("resetView")}
              title={tr("resetView")}
              onClick={resetView}
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      )}
      <span className="viewer3d-credit">{tr("credit3d")}</span>
    </div>
  );
}
