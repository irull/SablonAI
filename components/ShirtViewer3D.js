"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCcw, RotateCw } from "lucide-react";
import { translate } from "../lib/i18n";
import { artworkBox } from "../lib/artwork";
import { frontTopY, frontCxOffset, backTopY, renderCm } from "../lib/printPlacement";

// Pemetaan tekstur panel depan, terukur dari UV model: sampledU =
// 0.50007 + 3.5325 * xDunia dan sampledV = 5.2214 - 3.4411 * yDunia,
// jadi 1 meter dunia = 3.5325 fraksi tekstur (u) / 3.4411 (v), dan pusat
// tekstur tepat di pusat panel dada (panel sekitar 29,6 x 29,8 cm).
// Ukuran sablon depan (cm) diubah ke rect tekstur dari angka ini,
// sehingga A4 tampil 21x28 cm sungguhan seperti mockup 2D.
const FRONT_U_PER_M = 3.5325;
const FRONT_V_PER_M = 3.4411;
// Pusat area cetak depan di dunia: U 0,5 -> x dari pemetaan terukur,
// V 0,5 -> y = (5,2214 - 0,5) / 3,4411 ≈ 1,37206.
const FRONT_CX = (0.5 - 0.50007) / FRONT_U_PER_M;
const FRONT_CY = (5.2214 - 0.5) / FRONT_V_PER_M;
// Interpolasi bilinier generik untuk grid permukaan (dipakai permukaan
// punggung terukur BACK_GRID dan permukaan dada yang disampel dari
// mesh panel depan saat model dimuat).
function bilinear(xs, ys, grid, x, y) {
  const cx = Math.min(xs[xs.length - 1], Math.max(xs[0], x));
  const cy = Math.min(ys[ys.length - 1], Math.max(ys[0], y));
  let ix = 0;
  while (ix < xs.length - 2 && cx > xs[ix + 1]) ix++;
  let iy = 0;
  while (iy < ys.length - 2 && cy > ys[iy + 1]) iy++;
  const fx = (cx - xs[ix]) / (xs[ix + 1] - xs[ix]);
  const fy = (cy - ys[iy]) / (ys[iy + 1] - ys[iy]);
  const z00 = grid[iy][ix], z10 = grid[iy][ix + 1];
  const z01 = grid[iy + 1][ix], z11 = grid[iy + 1][ix + 1];
  return (
    z00 * (1 - fx) * (1 - fy) + z10 * fx * (1 - fy) +
    z01 * (1 - fx) * fy + z11 * fx * fy
  );
}
function frontPrintRect(widthCm, heightCm) {
  const wCm = widthCm || 21;
  const hCm = heightCm || 28;
  const w = Math.min(0.999, Math.max(0.05, (wCm / 100) * FRONT_U_PER_M));
  const h = Math.min(0.999, Math.max(0.05, (hCm / 100) * FRONT_V_PER_M));
  // Masking panduan 2026-11-03: RATA ATAS — tepi atas rect di
  // frontTopY dunia (10x10 bergeser ke dada kiri), bukan rata
  // tengah panel. Rect digeser masuk bila melebihi panel tekstur
  // (panel hanya 29,6 x 29,8 cm, jadi A3 memenuhi panel), supaya
  // garis masking selalu sama persis dengan tapak desain tercetak.
  let y = 5.2214 - FRONT_V_PER_M * frontTopY(wCm, hCm);
  y = Math.min(Math.max(y, 0), 1 - h);
  const uC = 0.50007 + FRONT_U_PER_M * (FRONT_CX + frontCxOffset(wCm, hCm));
  let x = uC - w / 2;
  x = Math.min(Math.max(x, 0), 1 - w);
  return { x, y, w, h };
}
// Ukuran cetak melebihi panel tekstur depan (29,6 x 29,8 cm) —
// hanya A3 (32x42). Ukuran seperti ini dirender sebagai decal
// permukaan badan ukuran asli (seperti sisi belakang), bukan
// tekstur panel, supaya depan-belakang tampil sama besar.
function frontExceedsPanel(wCm, hCm) {
  return (
    ((wCm || 21) / 100) * FRONT_U_PER_M > 0.999 ||
    ((hCm || 28) / 100) * FRONT_V_PER_M > 0.999
  );
}
// Rect area cetak depan efektif dalam meter dunia (hasil
// frontPrintRect dibaca balik lewat pemetaan UV terukur) — dipakai
// garis masking dan bidang seret, selalu sama dengan tapak desain.
// Untuk ukuran melebihi panel: rect asli rata atas (mode decal).
function frontAreaWorld(widthCm, heightCm) {
  const wCm = widthCm || 21;
  const hCm = heightCm || 28;
  if (frontExceedsPanel(wCm, hCm)) {
    const wM = wCm / 100;
    const hM = hCm / 100;
    return {
      cx: FRONT_CX + frontCxOffset(wCm, hCm),
      cy: frontTopY(wCm, hCm) - hM / 2,
      w: wM,
      h: hM,
      decal: true,
    };
  }
  const r = frontPrintRect(wCm, hCm);
  const wM = r.w / FRONT_U_PER_M;
  const hM = r.h / FRONT_V_PER_M;
  const cx = (r.x + r.w / 2 - 0.50007) / FRONT_U_PER_M;
  const top = (5.2214 - r.y) / FRONT_V_PER_M;
  return { cx, cy: top - hM / 2, w: wM, h: hM, decal: false };
}
// Pusat y area cetak belakang: rata atas per panduan masking
// (tepi atas di backTopY), menggantikan pusat tetap BACK_Y lama.
function backCenterY(wCm, hCm) {
  return backTopY(wCm || 28, hCm || 28) - (hCm || 28) / 100 / 2;
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
  return bilinear(BACK_XS, BACK_YS, BACK_GRID, x, y);
}
const TEX_SIZE = 2048;
const MODEL_URL = "/models/white-tee.glb";

export default function ShirtViewer3D({ artwork, backArtwork = null, backWidthCm = 0, backHeightCm = 0, frontWidthCm = 0, frontHeightCm = 0, frontTransform, backTransform, color, t, showArea = false, editSide = null, onDragDesign = null, activeSide = "front" }) {
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
  const backDimsRef = useRef(renderCm(backWidthCm, backHeightCm));
  const frontDimsRef = useRef(renderCm(frontWidthCm, frontHeightCm));
  const prevActiveSide = useRef(activeSide);
  const frontTfRef = useRef(frontTransform || null);
  const backTfRef = useRef(backTransform || null);
  const showAreaRef = useRef(showArea);
  const editSideRef = useRef(editSide);
  const onDragDesignRef = useRef(onDragDesign);
  showAreaRef.current = showArea;
  editSideRef.current = editSide;
  onDragDesignRef.current = onDragDesign;
  artworkRef.current = artwork;
  colorRef.current = color;
  backRef.current = backArtwork;
  frontTfRef.current = frontTransform || null;
  backTfRef.current = backTransform || null;
  backDimsRef.current = renderCm(backWidthCm, backHeightCm);
  frontDimsRef.current = renderCm(frontWidthCm, frontHeightCm);

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
        // Neutral + exposure lebih rendah: warna kain 3D sedekat mungkin
        // dengan mockup 2D (ACES lama membuat warna jauh lebih terang).
        renderer.toneMapping = THREE.NeutralToneMapping;
        renderer.toneMappingExposure = 1.0;
        mount.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(
          new RoomEnvironment(),
          0.04,
        ).texture;
        scene.environmentIntensity = 0.6;
        const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
        const key = new THREE.DirectionalLight(0xffffff, 1.0);
        key.position.set(1.2, 2.2, 2.4);
        scene.add(key);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x8a93a8, 0.35));
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
          frontSurf: null,
          frontBodySurf: null,
          frontDecal: null,
          frontGen: 0,
          backGen: 0,
          camAnim: null,
          guides: null,
          hitFront: null,
          hitBack: null,
          designFrontFit: null,
          designBackFit: null,
          drag: null,
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
        // Sampel permukaan dada dari mesh panel depan (material yang
        // sama dengan printMat): untuk tiap sel grid ambil z terbesar
        // (permukaan terluar) — dasar garis masking + bidang seret 3D,
        // teknik yang sama dengan grid punggung terukur BACK_GRID.
        try {
          gltf.scene.updateMatrixWorld(true);
          let printMesh = null;
          gltf.scene.traverse((obj) => {
            if (printMesh || !obj.isMesh) return;
            const mats = Array.isArray(obj.material)
              ? obj.material
              : [obj.material];
            if (w.printMat && mats.includes(w.printMat)) printMesh = obj;
          });
          if (printMesh) {
            const posAttr = printMesh.geometry.attributes.position;
            const v = new THREE.Vector3();
            const verts = [];
            for (let i = 0; i < posAttr.count; i++) {
              v.fromBufferAttribute(posAttr, i).applyMatrix4(printMesh.matrixWorld);
              verts.push([v.x, v.y, v.z]);
            }
            const xs = [];
            for (let x = -0.16; x <= 0.161; x += 0.02) xs.push(Math.round(x * 100) / 100);
            const ys = [];
            for (let y = 1.14; y <= 1.601; y += 0.02) ys.push(Math.round(y * 100) / 100);
            const grid = ys.map((gy) =>
              xs.map((gx) => {
                let best = null;
                let bestD = Infinity;
                let cell = null;
                for (const [vx, vy, vz] of verts) {
                  const dx = Math.abs(vx - gx);
                  const dy = Math.abs(vy - gy);
                  if (dx <= 0.013 && dy <= 0.013) {
                    if (cell === null || vz > cell) cell = vz;
                  }
                  const d = dx * dx + dy * dy;
                  if (d < bestD) { bestD = d; best = vz; }
                }
                return cell !== null ? cell : best !== null ? best : 0.18;
              }),
            );
            w.frontSurf = { xs, ys, grid };
            // Sampel permukaan BADAN depan (mesh badan terlebar yang
            // menghadap +z, digabung vertex panel): untuk decal
            // ukuran yang melebihi panel tekstur (A3 32x42) supaya
            // depan bisa tampil ukuran asli seperti belakang.
            let bodyMesh = null;
            let bodySpan = 0;
            gltf.scene.traverse((obj) => {
              if (!obj.isMesh || obj === printMesh) return;
              const bb = new THREE.Box3().setFromObject(obj);
              const span = bb.max.x - bb.min.x;
              if (bb.max.z > 0.03 && span > bodySpan) {
                bodySpan = span;
                bodyMesh = obj;
              }
            });
            if (bodyMesh && bodySpan > 0.4) {
              const allVerts = verts.slice();
              const bpos = bodyMesh.geometry.attributes.position;
              const bv = new THREE.Vector3();
              for (let i = 0; i < bpos.count; i++) {
                bv.fromBufferAttribute(bpos, i).applyMatrix4(bodyMesh.matrixWorld);
                allVerts.push([bv.x, bv.y, bv.z]);
              }
              const bxs = [];
              for (let x = -0.2; x <= 0.201; x += 0.02) bxs.push(Math.round(x * 100) / 100);
              const bys = [];
              for (let y = 1.0; y <= 1.621; y += 0.02) bys.push(Math.round(y * 100) / 100);
              const bgrid = bys.map((gy) =>
                bxs.map((gx) => {
                  let best = null;
                  let bestD = Infinity;
                  let cell = null;
                  for (const [vx, vy, vz] of allVerts) {
                    const dx = Math.abs(vx - gx);
                    const dy = Math.abs(vy - gy);
                    if (dx <= 0.013 && dy <= 0.013) {
                      if (cell === null || vz > cell) cell = vz;
                    }
                    const d = dx * dx + dy * dy;
                    if (d < bestD) { bestD = d; best = vz; }
                  }
                  return cell !== null ? cell : best !== null ? best : 0.1;
                }),
              );
              w.frontBodySurf = { xs: bxs, ys: bys, grid: bgrid };
            }
          }
        } catch (e) {
          w.frontSurf = null;
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
          // Mode Atur desain: putaran model dikunci supaya seretan
          // pointer murni untuk memindah desain, tidak bentrok orbit.
          const editing = Boolean(editSideRef.current);
          controls.enabled = !editing;
          // Animasi putar kamera menuju sisi aktif (tombol DEPAN/
          // BELAKANG): sudut azimuth digeser halus dari posisi
          // sekarang, radius + kemiringan dipertahankan. Selama
          // animasi, controls.update() DILEWATI — update() dengan
          // damping menghitung ulang posisi dari keadaan internal
          // kontrol dan melawan posisi yang dipasang animasi
          // (kamera berhenti puluhan derajat sebelum sasaran).
          // Seretan pengguna membatalkan animasi (listener
          // pointerdown di bawah).
          if (w.camAnim) {
            const a = w.camAnim;
            const k = Math.min(1, (performance.now() - a.start) / 550);
            const e =
              k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            const off = new THREE.Vector3().setFromSphericalCoords(
              a.radius,
              a.phi,
              a.from + a.delta * e,
            );
            camera.position.copy(controls.target).add(off);
            camera.lookAt(controls.target);
            if (k >= 1) w.camAnim = null;
          } else {
            controls.autoRotate = autoRef.current && !editing;
            controls.update();
          }
          renderer.render(scene, camera);
        };
        loop();
        renderer.domElement.addEventListener("pointerdown", () => {
          w.camAnim = null;
        });
        attachDrag();
        applyArtwork();
        applyBack();
        applyGuides();
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

  // z permukaan dada pada (x, y): dari grid sampel mesh panel depan;
  // fallback bidang datar bila sampel gagal.
  function frontZ(x, y) {
    const w = world.current;
    if (w && w.frontSurf)
      return bilinear(w.frontSurf.xs, w.frontSurf.ys, w.frontSurf.grid, x, y);
    return 0.185;
  }

  // z permukaan badan depan (grid gabungan badan + panel) untuk
  // area melebihi panel (decal A3); fallback ke grid panel.
  function frontBodyZ(x, y) {
    const w = world.current;
    if (w && w.frontBodySurf)
      return bilinear(w.frontBodySurf.xs, w.frontBodySurf.ys, w.frontBodySurf.grid, x, y);
    return frontZ(x, y);
  }

  function removeFrontDecal() {
    const w = world.current;
    if (w && w.frontDecal) {
      w.scene.remove(w.frontDecal);
      w.frontDecal.geometry.dispose();
      if (w.frontDecal.material.map) w.frontDecal.material.map.dispose();
      w.frontDecal.material.dispose();
      w.frontDecal = null;
    }
  }

  // Garis masking area cetak + outline desain di 3D (permintaan user
  // 3 Nov 2026: masking pindah ke 3D). Area = garis putus-putus abu
  // mengikuti permukaan; outline desain = garis oranye persis sebesar
  // desain terlihat (fit artworkBox x skala transform), hanya tampil
  // di mode Atur desain. Bidang seret tak terlihat dibangun seukuran
  // area cetak untuk raycast pointer.
  function applyGuides() {
    const w = world.current;
    if (!w || !w.scene) return;
    const THREE = w.THREE;
    if (w.guides) {
      w.scene.remove(w.guides);
      w.guides.traverse((o) => {
        if (o.isLine) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
      w.guides = null;
    }
    for (const key of ["hitFront", "hitBack"]) {
      if (w[key]) {
        w.scene.remove(w[key]);
        w[key].geometry.dispose();
        w[key].material.dispose();
        w[key] = null;
      }
    }
    const showF =
      Boolean(artworkRef.current) &&
      (showAreaRef.current || editSideRef.current === "front");
    const showB =
      Boolean(backRef.current) &&
      (showAreaRef.current || editSideRef.current === "back");
    const editF = editSideRef.current === "front" && Boolean(artworkRef.current);
    const editB = editSideRef.current === "back" && Boolean(backRef.current);
    if (!showF && !showB) return;
    const group = new THREE.Group();
    const mkLine = (pts, mat) => {
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const l = new THREE.Line(g, mat);
      l.computeLineDistances();
      l.renderOrder = 6;
      return l;
    };
    const areaMat = () =>
      new THREE.LineDashedMaterial({
        color: 0x75816d,
        dashSize: 0.014,
        gapSize: 0.009,
      });
    const desMat = () => new THREE.LineBasicMaterial({ color: 0xc2703e });
    const hitMat = () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      });
    // Titik keliling persegi (cx, cy, w, h) diputar rotDeg derajat
    // (CCW pada bidang xy lokal), z dari fungsi permukaan zFn(x, y).
    const rectPts = (cx, cy, wdt, hgt, rotDeg, zFn) => {
      const a = ((rotDeg || 0) * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const corners = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      const pts = [];
      const SEG = 10;
      for (let s = 0; s < 4; s++) {
        const [x0, y0] = corners[s];
        const [x1, y1] = corners[(s + 1) % 4];
        for (let i = 0; i < SEG; i++) {
          const fx = x0 + (x1 - x0) * (i / SEG);
          const fy = y0 + (y1 - y0) * (i / SEG);
          const lx = (fx * wdt) / 2;
          const ly = (fy * hgt) / 2;
          const rx = cx + lx * ca - ly * sa;
          const ry = cy + lx * sa + ly * ca;
          pts.push(new THREE.Vector3(rx, ry, zFn(rx, ry)));
        }
      }
      pts.push(pts[0].clone());
      return pts;
    };
    if (showF) {
      const area = frontAreaWorld(
        frontDimsRef.current.w || 21,
        frontDimsRef.current.h || 28,
      );
      const pw = area.w;
      const ph = area.h;
      const zSurf = area.decal ? frontBodyZ : frontZ;
      const zF = (x, y) => zSurf(x, y) + 0.006;
      group.add(mkLine(rectPts(area.cx, area.cy, pw, ph, 0, zF), areaMat()));
      if (editF && w.designFrontFit) {
        const tf = frontTfRef.current || {};
        const sc = tf.scale || 1;
        group.add(
          mkLine(
            rectPts(
              area.cx + (tf.dx || 0) * pw,
              area.cy - (tf.dy || 0) * ph,
              w.designFrontFit.w * sc,
              w.designFrontFit.h * sc,
              -(tf.rot || 0),
              zF,
            ),
            desMat(),
          ),
        );
      }
      if (editF) {
        const geo = new THREE.PlaneGeometry(pw, ph, 20, 20);
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const lx = p.getX(i);
          const ly = p.getY(i);
          p.setZ(i, zSurf(area.cx + lx, area.cy + ly) + 0.004);
        }
        geo.computeVertexNormals();
        const hit = new THREE.Mesh(geo, hitMat());
        hit.position.set(area.cx, area.cy, 0);
        w.scene.add(hit);
        w.hitFront = hit;
      }
    }
    if (showB) {
      const bw = (backDimsRef.current.w || 28) / 100;
      const bh = (backDimsRef.current.h || 28) / 100;
      const bCy = backCenterY(backDimsRef.current.w, backDimsRef.current.h);
      const holder = new THREE.Group();
      holder.rotation.y = Math.PI;
      holder.position.y = bCy;
      const zB = (lx, ly) => BACK_LIFT - surfaceZ2(-lx, bCy + ly) + 0.003;
      holder.add(mkLine(rectPts(0, 0, bw, bh, 0, zB), areaMat()));
      if (editB && w.designBackFit) {
        const tf = backTfRef.current || {};
        const sc = tf.scale || 1;
        holder.add(
          mkLine(
            rectPts(
              -(tf.dx || 0) * bw,
              -(tf.dy || 0) * bh,
              w.designBackFit.w * sc,
              w.designBackFit.h * sc,
              tf.rot || 0,
              zB,
            ),
            desMat(),
          ),
        );
      }
      group.add(holder);
      if (editB) {
        const geo = new THREE.PlaneGeometry(bw, bh, 44, 22);
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const lx = p.getX(i);
          const ly = p.getY(i);
          p.setZ(i, BACK_LIFT - surfaceZ2(-lx, bCy + ly) + 0.002);
        }
        geo.computeVertexNormals();
        const hit = new THREE.Mesh(geo, hitMat());
        hit.rotation.y = Math.PI;
        hit.position.y = bCy;
        w.scene.add(hit);
        w.hitBack = hit;
      }
    }
    w.scene.add(group);
    w.guides = group;
  }

  // Seret desain di mode Atur desain: raycast pointer ke bidang area
  // cetak sisi aktif; uv bidang -> dx/dy fraksi area cetak (semantik
  // sama dengan frame 2D: +dx ke kanan pandangan sisi itu, +dy ke
  // bawah). Hasilnya ditulis lewat onDragDesign (patchTransform).
  function attachDrag() {
    const w = world.current;
    if (!w) return;
    const THREE = w.THREE;
    const el = w.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const castAt = (e, mesh) => {
      if (!mesh) return null;
      const r = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1),
      );
      ray.setFromCamera(ndc, w.camera);
      const hits = ray.intersectObject(mesh, false);
      return hits.length && hits[0].uv ? hits[0].uv : null;
    };
    el.addEventListener("pointerdown", (e) => {
      const side = editSideRef.current;
      if (!side || !onDragDesignRef.current) return;
      const uv = castAt(e, side === "front" ? w.hitFront : w.hitBack);
      if (!uv) return;
      const tf =
        (side === "front" ? frontTfRef.current : backTfRef.current) || {};
      w.drag = { side, u: uv.x, v: uv.y, dx: tf.dx || 0, dy: tf.dy || 0 };
      try {
        el.setPointerCapture(e.pointerId);
      } catch (err) {}
      el.style.cursor = "grabbing";
      e.preventDefault();
    });
    el.addEventListener("pointermove", (e) => {
      const d = w.drag;
      if (!d || !onDragDesignRef.current) return;
      const uv = castAt(e, d.side === "front" ? w.hitFront : w.hitBack);
      if (!uv) return;
      const clamp = (v) => Math.min(0.75, Math.max(-0.75, v));
      // Sisi belakang: tekstur decal digambar tercermin (applyBack
      // memakai translate 512 - dx*1024), jadi arah x state berlawanan
      // dengan gerakan pointer — dibalik di sini supaya desain selalu
      // mengikuti arah seretan di layar.
      const du = d.side === "back" ? d.u - uv.x : uv.x - d.u;
      onDragDesignRef.current({
        dx: Math.round(clamp(d.dx + du) * 1000) / 1000,
        dy: Math.round(clamp(d.dy + (d.v - uv.y)) * 1000) / 1000,
      });
    });
    const end = () => {
      if (w.drag) {
        w.drag = null;
        el.style.cursor = editSideRef.current ? "grab" : "";
      }
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  function applyBack() {
    const w = world.current;
    if (!w || !w.scene) return;
    // Penjaga generasi: onload gambar dari panggilan lama dibatalkan
    // (cegah decal basi menumpuk hasil render terbaru).
    const gen = ++w.backGen;
    if (w.backDecal) {
      w.scene.remove(w.backDecal);
      w.backDecal.geometry.dispose();
      if (w.backDecal.material.map) w.backDecal.material.map.dispose();
      w.backDecal.material.dispose();
      w.backDecal = null;
    }
    const src = backRef.current;
    if (!src) {
      w.designBackFit = null;
      applyGuides();
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!world.current || world.current !== w || !w.scene) return;
      if (gen !== w.backGen) return;
      const THREE = w.THREE;
      const cv = document.createElement("canvas");
      cv.width = 1024;
      cv.height = 1024;
      const cx = cv.getContext("2d");
      const box = artworkBox(img);
      const s = Math.min(1024 / box.w, 1024 / box.h);
      const dw = box.w * s;
      const dh = box.h * s;
      const tf = backTfRef.current || {};
      const tScale = tf.scale || 1;
      cx.save();
      cx.translate(512 - (tf.dx || 0) * 1024, 512 + (tf.dy || 0) * 1024);
      cx.rotate(((-(tf.rot || 0)) * Math.PI) / 180);
      cx.drawImage(img, box.x, box.y, box.w, box.h, (-dw * tScale) / 2, (-dh * tScale) / 2, dw * tScale, dh * tScale);
      cx.restore();
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const bw = (backDimsRef.current.w || 28) / 100;
      const bh = (backDimsRef.current.h || 28) / 100;
      const bCy = backCenterY(backDimsRef.current.w, backDimsRef.current.h);
      w.designBackFit = { w: (dw / 1024) * bw, h: (dh / 1024) * bh };
      const geo = new THREE.PlaneGeometry(bw, bh, 44, 22);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i);
        const ly = pos.getY(i);
        pos.setZ(i, BACK_LIFT - surfaceZ2(-lx, bCy + ly));
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
      mesh.position.set(0, bCy, 0);
      mesh.rotation.y = Math.PI;
      w.scene.add(mesh);
      w.backDecal = mesh;
      applyGuides();
    };
    img.onerror = () => {};
    img.src = src;
  }

  // Kosongkan tekstur panel depan (desain mati, atau desain pindah
  // ke decal karena melebihi panel).
  function blankFrontTexture() {
    const w = world.current;
    if (!w || !w.printMat) return;
    const THREE = w.THREE;
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
  }

  // Decal desain depan untuk ukuran melebihi panel tekstur (A3):
  // bidang melengkung mengikuti permukaan badan, ukuran asli,
  // teknik yang sama dengan decal belakang (applyBack).
  function applyFrontDecal() {
    const w = world.current;
    if (!w || !w.scene) return;
    // Generasi render depan milik panggilan applyArtwork terakhir —
    // onload yang selesai belakangan dari mode/ukuran lama dibatalkan.
    const gen = w.frontGen;
    removeFrontDecal();
    const src = artworkRef.current;
    if (!src) {
      w.designFrontFit = null;
      applyGuides();
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!world.current || world.current !== w || !w.scene) return;
      if (gen !== w.frontGen) return;
      const THREE = w.THREE;
      const cv = document.createElement("canvas");
      cv.width = 1024;
      cv.height = 1024;
      const cx = cv.getContext("2d");
      const box = artworkBox(img);
      const s = Math.min(1024 / box.w, 1024 / box.h);
      const dw = box.w * s;
      const dh = box.h * s;
      const tf = frontTfRef.current || {};
      const tScale = tf.scale || 1;
      cx.save();
      cx.translate(512 + (tf.dx || 0) * 1024, 512 + (tf.dy || 0) * 1024);
      cx.rotate(((tf.rot || 0) * Math.PI) / 180);
      cx.drawImage(img, box.x, box.y, box.w, box.h, (-dw * tScale) / 2, (-dh * tScale) / 2, dw * tScale, dh * tScale);
      cx.restore();
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const area = frontAreaWorld(
        frontDimsRef.current.w || 21,
        frontDimsRef.current.h || 28,
      );
      w.designFrontFit = { w: (dw / 1024) * area.w, h: (dh / 1024) * area.h };
      const geo = new THREE.PlaneGeometry(area.w, area.h, 44, 22);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i);
        const ly = pos.getY(i);
        pos.setZ(i, frontBodyZ(area.cx + lx, area.cy + ly) + 0.004);
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
      mesh.position.set(area.cx, area.cy, 0);
      mesh.renderOrder = 5;
      w.scene.add(mesh);
      w.frontDecal = mesh;
      applyGuides();
      if (!readyOnce.current) {
        readyOnce.current = true;
        setStatus("ready");
      }
    };
    img.onerror = () => {};
    img.src = src;
  }

  function applyArtwork() {
    const w = world.current;
    if (!w || !w.printMat) return;
    const THREE = w.THREE;
    // Setiap render depan menaikkan generasi: onload gambar async
    // dari panggilan sebelumnya (mis. tekstur A4 yang baru selesai
    // setelah user pindah ke A3) TIDAK boleh menimpa hasil terbaru —
    // itulah bug "desain depan menumpuk" (tekstur panel + decal A3
    // tampil bersamaan) yang dilaporkan user 3 Nov 2026.
    const gen = ++w.frontGen;
    if (!artworkRef.current) {
      // Front print is off: clear the print texture back to transparent so
      // the 3D shirt matches the unchecked "print this side" state.
      removeFrontDecal();
      blankFrontTexture();
      w.designFrontFit = null;
      applyGuides();
      if (!readyOnce.current) {
        readyOnce.current = true;
        setStatus("ready");
      }
      return;
    }
    if (
      frontExceedsPanel(frontDimsRef.current.w || 21, frontDimsRef.current.h || 28)
    ) {
      blankFrontTexture();
      applyFrontDecal();
      return;
    }
    removeFrontDecal();
    const img = new Image();
    img.onload = () => {
      if (!world.current) return;
      if (gen !== w.frontGen) return;
      const canvas = document.createElement("canvas");
      canvas.width = TEX_SIZE;
      canvas.height = TEX_SIZE;
      const cx = canvas.getContext("2d");
      const rect = frontPrintRect(frontDimsRef.current.w, frontDimsRef.current.h);
      const rx = rect.x * TEX_SIZE;
      const ry = rect.y * TEX_SIZE;
      const rw = rect.w * TEX_SIZE;
      const rh = rect.h * TEX_SIZE;
      const box = artworkBox(img);
      const scale = Math.min(rw / box.w, rh / box.h);
      const dw = box.w * scale;
      const dh = box.h * scale;
      w.designFrontFit = {
        w: (dw / TEX_SIZE) / FRONT_U_PER_M,
        h: (dh / TEX_SIZE) / FRONT_V_PER_M,
      };
      const tf = frontTfRef.current || {};
      const tScale = tf.scale || 1;
      cx.save();
      cx.beginPath();
      cx.rect(rx, ry, rw, rh);
      cx.clip();
      cx.translate(rx + rw / 2 + (tf.dx || 0) * rw, ry + rh / 2 + (tf.dy || 0) * rh);
      cx.rotate(((tf.rot || 0) * Math.PI) / 180);
      cx.drawImage(img, box.x, box.y, box.w, box.h, (-dw * tScale) / 2, (-dh * tScale) / 2, dw * tScale, dh * tScale);
      cx.restore();
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
      applyGuides();
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
  }, [artwork, frontWidthCm, frontHeightCm, frontTransform, status]);
  useEffect(() => {
    if (status === "ready") applyColor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, status]);
  useEffect(() => {
    if (status === "ready") applyBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backArtwork, backWidthCm, backHeightCm, backTransform, status]);
  useEffect(() => {
    if (status === "ready") applyGuides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArea, editSide, frontTransform, backTransform, status]);
  // Masuk mode Atur desain: kamera menghadap lurus ke sisi yang diedit
  // (depan/belakang) supaya seretan terasa wajar; keluar mode: kursor
  // kembali normal (kontrol orbit aktif lagi lewat loop render).
  useEffect(() => {
    const w = world.current;
    if (!w || status !== "ready") return;
    const el = w.renderer.domElement;
    if (!editSide) {
      el.style.cursor = "";
      return;
    }
    const dist = w.camera.position.distanceTo(w.controls.target);
    const dir = new w.THREE.Vector3(
      0,
      0.05,
      editSide === "front" ? 1 : -1,
    ).normalize();
    w.camera.position.copy(w.controls.target).addScaledVector(dir, dist);
    w.controls.update();
    el.style.cursor = "grab";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSide, status]);

  // Klik DEPAN/BELAKANG di stage (di luar mode Atur desain): kamera
  // ikut berputar menghadap sisi yang dipilih (permintaan user
  // 2026-11-03). Orbit mouse tetap bebas — ini hanya animasi
  // sekali jalan, dibatalkan oleh seretan pengguna sendiri.
  useEffect(() => {
    const prev = prevActiveSide.current;
    prevActiveSide.current = activeSide;
    if (prev === activeSide) return;
    const w = world.current;
    if (!w || status !== "ready" || editSide) return;
    const off = w.camera.position.clone().sub(w.controls.target);
    const sph = new w.THREE.Spherical().setFromVector3(off);
    const goal = activeSide === "front" ? 0 : Math.PI;
    let delta = (goal - sph.theta) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    if (Math.abs(delta) < 0.01) return;
    // Putar-otomatis dimatikan supaya kamera BETUL-BETUL berhenti di
    // sisi yang dipilih (kalau tidak, model langsung hanyut lagi
    // belasan derajat). Pengguna bisa menyalakannya lagi dari tombol
    // putar di bar penampil.
    autoRef.current = false;
    setAuto(false);
    w.camAnim = {
      from: sph.theta,
      delta,
      radius: sph.radius,
      phi: sph.phi,
      start: performance.now(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide, status]);

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
