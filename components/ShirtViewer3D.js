"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCcw, RotateCw } from "lucide-react";
import { translate } from "../lib/i18n";

// Pemetaan tekstur panel depan, terukur dari UV model: sampledU =
// 0.50007 + 3.5325 * xDunia dan sampledV = 5.2214 - 3.4411 * yDunia,
// jadi 1 meter dunia = 3.5325 fraksi tekstur (u) / 3.4411 (v), dan pusat
// tekstur tepat di pusat panel dada (panel sekitar 29,6 x 29,8 cm).
// Ukuran sablon depan (cm) diubah ke rect tekstur dari angka ini,
// sehingga A4 tampil 21x28 cm sungguhan seperti mockup 2D.
const FRONT_U_PER_M = 3.5325;
const FRONT_V_PER_M = 3.4411;
function frontPrintRect(widthCm, heightCm) {
  const w = Math.min(0.999, Math.max(0.05, ((widthCm || 21) / 100) * FRONT_U_PER_M));
  const h = Math.min(0.999, Math.max(0.05, ((heightCm || 28) / 100) * FRONT_V_PER_M));
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}
// Decal desain belakang: model tidak punya panel sablon belakang, jadi
// desain belakang ditempel sebagai bidang tipis melengkung tepat di atas
// permukaan punggung (z permukaan terukur sekitar -0,17 pada pita dada;
// bidang di z -0,184, tepi menekuk ke depan mengikuti lengkung badan).
const BACK_Y = 1.4;
// Grid z permukaan punggung hasil ukur vertex panel belakang model
// (persentil-10 per sel 2x4 cm): punggung kaos gantung punya dua ridge
// lipatan di sekitar |x| 0,06 yang menonjol sampai z -0,198, sedangkan
// tengahnya -0,169. Decal dibentuk mengikuti grid ini (interpolasi
// bilinier) dengan jeda angkat kecil, supaya desain menempel mengikuti
// lipatan — bukan bidang datar yang melayang atau tertembus kain.
const BACK_XS = [-0.22, -0.2, -0.18, -0.16, -0.14, -0.12, -0.1, -0.08, -0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18, 0.2, 0.22];
const BACK_YS = [1.14, 1.18, 1.22, 1.26, 1.3, 1.34, 1.38, 1.42, 1.46, 1.5, 1.54, 1.58, 1.62];
const BACK_GRID = (() => {
  const raw = [
    [null, null, null, -0.102, -0.131, -0.158, -0.18, -0.191, -0.192, -0.189, -0.179, -0.17, -0.177, -0.188, -0.191, -0.189, -0.18, -0.163, -0.129, -0.081, null, null, null],
    [null, null, null, -0.102, -0.137, -0.165, -0.184, -0.193, -0.194, -0.19, -0.178, -0.17, -0.178, -0.189, -0.192, -0.191, -0.181, -0.155, -0.121, -0.089, null, null, null],
    [null, null, null, -0.074, -0.122, -0.154, -0.186, -0.195, -0.195, -0.19, -0.178, -0.17, -0.179, -0.19, -0.194, -0.193, -0.177, -0.132, -0.115, -0.089, null, null, null],
    [null, null, null, -0.063, -0.102, -0.126, -0.178, -0.197, -0.197, -0.189, -0.177, -0.17, -0.178, -0.19, -0.195, -0.194, -0.164, -0.145, -0.115, -0.067, null, null, null],
    [null, null, null, -0.086, -0.123, -0.14, -0.165, -0.198, -0.198, -0.188, -0.175, -0.17, -0.178, -0.19, -0.196, -0.194, -0.156, -0.155, -0.131, -0.093, null, null, null],
    [null, null, null, -0.119, -0.143, -0.155, -0.164, -0.198, -0.198, -0.187, -0.175, -0.169, -0.177, -0.19, -0.196, -0.194, -0.165, -0.164, -0.151, -0.119, null, null, null],
    [null, null, null, -0.14, -0.159, -0.167, -0.173, -0.197, -0.197, -0.184, -0.174, -0.169, -0.175, -0.187, -0.196, -0.193, -0.173, -0.172, -0.163, -0.139, null, null, null],
    [null, null, -0.149, -0.157, -0.171, -0.177, -0.181, -0.196, -0.194, -0.181, -0.172, -0.168, -0.174, -0.183, -0.195, -0.194, -0.181, -0.178, -0.171, -0.156, -0.147, null, null],
    [null, null, -0.16, -0.168, -0.175, -0.181, -0.186, -0.193, -0.189, -0.179, -0.173, -0.167, -0.173, -0.18, -0.191, -0.191, -0.184, -0.18, -0.174, -0.166, -0.161, null, null],
    [null, -0.153, -0.158, -0.172, -0.174, -0.18, -0.184, -0.186, -0.182, -0.176, -0.171, -0.165, -0.171, -0.177, -0.183, -0.187, -0.183, -0.18, -0.174, -0.168, -0.164, -0.152, null],
    [null, -0.14, -0.151, -0.158, -0.169, -0.173, -0.176, -0.177, -0.174, -0.17, -0.166, -0.165, -0.167, -0.171, -0.174, -0.177, -0.176, -0.171, -0.167, -0.165, -0.147, -0.14, null],
    [-0.091, -0.111, -0.126, -0.136, -0.147, -0.156, -0.16, -0.164, -0.162, -0.162, -0.163, -0.163, -0.163, -0.162, -0.163, -0.164, -0.161, -0.158, -0.147, -0.135, -0.125, -0.111, -0.101],
    [null, null, null, -0.089, -0.111, -0.124, -0.131, -0.137, -0.141, -0.141, -0.141, -0.141, -0.141, -0.141, -0.141, -0.137, -0.132, -0.122, -0.108, -0.092, null, null, null],
  ];
  return raw.map((row) => {
    const out = row.slice();
    let last = null;
    for (let i = 0; i < out.length; i++) {
      if (out[i] == null) { if (last != null) out[i] = last; } else last = out[i];
    }
    last = null;
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i] == null) { if (last != null) out[i] = last; } else last = out[i];
    }
    return out;
  });
})();
const BACK_LIFT = 0.004;
function surfaceZ2(x, y) {
  const xs = BACK_XS, ys = BACK_YS;
  const cx = Math.min(xs[xs.length - 1], Math.max(xs[0], x));
  const cy = Math.min(ys[ys.length - 1], Math.max(ys[0], y));
  let ix = 0;
  while (ix < xs.length - 2 && cx > xs[ix + 1]) ix++;
  let iy = 0;
  while (iy < ys.length - 2 && cy > ys[iy + 1]) iy++;
  const fx = (cx - xs[ix]) / (xs[ix + 1] - xs[ix]);
  const fy = (cy - ys[iy]) / (ys[iy + 1] - ys[iy]);
  const z00 = BACK_GRID[iy][ix], z10 = BACK_GRID[iy][ix + 1];
  const z01 = BACK_GRID[iy + 1][ix], z11 = BACK_GRID[iy + 1][ix + 1];
  return (
    z00 * (1 - fx) * (1 - fy) + z10 * fx * (1 - fy) +
    z01 * (1 - fx) * fy + z11 * fx * fy
  );
}
const TEX_SIZE = 2048;
const MODEL_URL = "/models/white-tee.glb";

export default function ShirtViewer3D({ artwork, backArtwork = null, backWidthCm = 0, backHeightCm = 0, frontWidthCm = 0, frontHeightCm = 0, color, t }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const mountRef = useRef(null);
  const world = useRef(null);
  const [status, setStatus] = useState("loading");
  const readyOnce = useRef(false);
  const [auto, setAuto] = useState(true);
  const autoRef = useRef(true);
  const artworkRef = useRef(artwork);
  const colorRef = useRef(color);
  const backRef = useRef(backArtwork);
  const backDimsRef = useRef({ w: backWidthCm, h: backHeightCm });
  const frontDimsRef = useRef({ w: frontWidthCm, h: frontHeightCm });
  artworkRef.current = artwork;
  colorRef.current = color;
  backRef.current = backArtwork;
  backDimsRef.current = { w: backWidthCm, h: backHeightCm };
  frontDimsRef.current = { w: frontWidthCm, h: frontHeightCm };

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
        renderer.toneMappingExposure = 1.16;
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
        scene.add(new THREE.HemisphereLight(0xffffff, 0x8a93a8, 0.65));
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
          origMap: null,
          backDecal: null,
          THREE,
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
            if ((m.name || "").startsWith("PT_FABRIC")) {
              w.printMat = m;
              w.origMap = m.map || null;
            }
            else if ("color" in m) w.fabricMats.push(m);
          });
        });
        if (w.printMat && w.origMap) {
          const phCanvas = document.createElement("canvas");
          phCanvas.width = 2;
          phCanvas.height = 2;
          const ph = new THREE.CanvasTexture(phCanvas);
          ph.repeat.copy(w.origMap.repeat);
          ph.offset.copy(w.origMap.offset);
          ph.center.copy(w.origMap.center);
          ph.rotation = w.origMap.rotation;
          ph.wrapS = w.origMap.wrapS;
          ph.wrapT = w.origMap.wrapT;
          ph.matrixAutoUpdate = w.origMap.matrixAutoUpdate;
          if (!ph.matrixAutoUpdate) ph.matrix.copy(w.origMap.matrix);
          w.tex = ph;
          w.printMat.map = ph;
          w.printMat.needsUpdate = true;
        }
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
        applyArtwork();
        applyBack();
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
        if (w.backDecal?.material?.map) w.backDecal.material.map.dispose();
        w.tex?.dispose();
        w.renderer?.dispose();
        w.renderer?.domElement?.remove();
        world.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyBack() {
    const w = world.current;
    if (!w || !w.scene) return;
    if (w.backDecal) {
      w.scene.remove(w.backDecal);
      w.backDecal.geometry.dispose();
      if (w.backDecal.material.map) w.backDecal.material.map.dispose();
      w.backDecal.material.dispose();
      w.backDecal = null;
    }
    const src = backRef.current;
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!world.current || world.current !== w || !w.scene) return;
      const THREE = w.THREE;
      const cv = document.createElement("canvas");
      cv.width = 1024;
      cv.height = 1024;
      const cx = cv.getContext("2d");
      const s = Math.min(1024 / img.width, 1024 / img.height);
      cx.drawImage(img, (1024 - img.width * s) / 2, (1024 - img.height * s) / 2, img.width * s, img.height * s);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const bw = (backDimsRef.current.w || 28) / 100;
      const bh = (backDimsRef.current.h || 28) / 100;
      const geo = new THREE.PlaneGeometry(bw, bh, 44, 22);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i);
        const ly = pos.getY(i);
        pos.setZ(i, BACK_LIFT - surfaceZ2(-lx, BACK_Y + ly));
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.04,
        roughness: 0.9,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, BACK_Y, 0);
      mesh.rotation.y = Math.PI;
      w.scene.add(mesh);
      w.backDecal = mesh;
    };
    img.onerror = () => {};
    img.src = src;
  }

  function applyArtwork() {
    const w = world.current;
    if (!w || !w.printMat) return;
    const THREE = w.THREE;
    if (!artworkRef.current) {
      // Front print is off: clear the print texture back to transparent so
      // the 3D shirt matches the unchecked "print this side" state.
      const blank = document.createElement("canvas");
      blank.width = 4;
      blank.height = 4;
      const tex = new THREE.CanvasTexture(blank);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      const orig = w.origMap;
      if (orig) {
        tex.repeat.copy(orig.repeat);
        tex.offset.copy(orig.offset);
        tex.center.copy(orig.center);
        tex.rotation = orig.rotation;
        tex.wrapS = orig.wrapS;
        tex.wrapT = orig.wrapT;
        tex.matrixAutoUpdate = orig.matrixAutoUpdate;
        if (!tex.matrixAutoUpdate) tex.matrix.copy(orig.matrix);
      }
      if (w.tex) w.tex.dispose();
      w.tex = tex;
      w.printMat.map = tex;
      w.printMat.color.set("#ffffff");
      w.printMat.needsUpdate = true;
      if (!readyOnce.current) {
        readyOnce.current = true;
        setStatus("ready");
      }
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (!world.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = TEX_SIZE;
      canvas.height = TEX_SIZE;
      const cx = canvas.getContext("2d");
      const rect = frontPrintRect(frontDimsRef.current.w, frontDimsRef.current.h);
      const rx = rect.x * TEX_SIZE;
      const ry = rect.y * TEX_SIZE;
      const rw = rect.w * TEX_SIZE;
      const rh = rect.h * TEX_SIZE;
      const scale = Math.min(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      cx.drawImage(img, rx + (rw - dw) / 2, ry + (rh - dh) / 2, dw, dh);
      const tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const orig = w.origMap;
      if (orig) {
        tex.repeat.copy(orig.repeat);
        tex.offset.copy(orig.offset);
        tex.center.copy(orig.center);
        tex.rotation = orig.rotation;
        tex.wrapS = orig.wrapS;
        tex.wrapT = orig.wrapT;
        tex.matrixAutoUpdate = orig.matrixAutoUpdate;
        if (!tex.matrixAutoUpdate) tex.matrix.copy(orig.matrix);
      }
      if (w.tex) w.tex.dispose();
      w.tex = tex;
      w.printMat.map = tex;
      w.printMat.color.set("#ffffff");
      w.printMat.needsUpdate = true;
      if (!readyOnce.current) {
        readyOnce.current = true;
        setStatus("ready");
      }
    };
    img.onerror = () => {
      if (!readyOnce.current) {
        readyOnce.current = true;
        setStatus("ready");
      }
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
  }, [artwork, frontWidthCm, frontHeightCm, status]);
  useEffect(() => {
    if (status === "ready") applyColor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, status]);
  useEffect(() => {
    if (status === "ready") applyBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backArtwork, backWidthCm, backHeightCm, status]);

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
