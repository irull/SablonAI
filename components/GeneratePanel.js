"use client";
import { useEffect, useState } from 'react';
import { ArrowRight, LoaderCircle, Plus, Sparkles, WandSparkles } from 'lucide-react';
import { config, sampleBriefs } from '../lib/config';
import { metaRequest } from '../lib/api';

export default function GeneratePanel({ design, onDesign, onMode }) {
  const [brief,setBrief]=useState(''),[demo,setDemo]=useState(config.demoMode),[liveReady,setLiveReady]=useState(false);
  const [busy,setBusy]=useState(''),[error,setError]=useState(''),[record,setRecord]=useState(null);
  useEffect(()=>{fetch('/api/meta').then(r=>r.json()).then(s=>setLiveReady(s.liveReady)).catch(()=>{});},[]);
  const example=s=>{setBrief(s.brief);};
  async function generate() {
    if(brief.trim().length<5) {setError('Ceritakan idemu sedikit lagi, minimal 5 karakter.');return;}
    setError('');setRecord(null);setBusy(demo?'Memilih contoh sesuai tema…':'Muse Spark merapikan brief…');
    try {
      const refined=await metaRequest({action:'refine',brief,demo});
      setBusy(demo?'Menyiapkan desain demo…':'Muse Image membuat desain…');
      const result=await metaRequest({action:'image',prompt:refined.prompt,demo});
      const next={...result,prompt:refined.prompt,brief,trace:{sparkMs:refined.durationMs,imageMs:result.durationMs,sparkUsage:refined.usage,imageUsage:result.usage}};
      onDesign(next);
      setRecord(next);
    }catch(e){setError(e.message);}finally{setBusy('');}
  }
  return <section className="brief-panel card">
    <div className="panel-heading"><span className="icon-tile"><Sparkles size={19}/></span><div><h2>Ceritakan idemu</h2><p>Mulai dari satu kalimat sederhana.</p></div></div>
    <div className="assistant-note"><span className="ai-orb"><Sparkles size={16}/></span><div><strong>Halo, kreator!</strong><p>Mau bikin kaos untuk siapa? Ceritakan tema, tulisan, dan gaya yang kamu suka.</p></div></div>
    <label className="field-label" htmlFor="brief">Brief desain kamu</label><div className="prompt-box"><textarea id="brief" value={brief} onChange={e=>setBrief(e.target.value)} placeholder="Misalnya, kaos komunitas sepeda dengan gunung dan tulisan ‘GOWES PAGI’, gaya vintage..." maxLength={1500} disabled={!!busy}/><div><span>Bahasa santai juga boleh</span><span>{brief.length}/1500</span></div></div>
    <button className="primary generate-button" disabled={!!busy} onClick={generate}>{busy?<LoaderCircle size={17} className="spinner"/>:<WandSparkles size={18}/>} {busy?'Menyiapkan desain…':'Buat desain'} {!busy&&<ArrowRight size={17}/>}</button>
    <p className="small-note center" role="status" aria-live="polite">{busy|| (demo?'Demo: memilih 1 dari 3 desain lokal, bukan AI live.':'Mode live: memakai kredit API Meta.')}</p>
    {error&&<div className="error" role="alert">{error}<button className="text-button" onClick={()=>{onDesign({...sampleBriefs[0],demo:true});setError('');}}>Pakai desain cadangan</button></div>}
    <details className="connection-settings"><summary>Pengaturan koneksi AI</summary><label><input type="checkbox" checked={!demo} disabled={!liveReady||!!busy} onChange={e=>{setDemo(!e.target.checked);onMode(e.target.checked?'live':'demo');}}/> Uji API live</label><p>{liveReady?'Koneksi server tersedia. Uji kecil dahulu dan cek Billing.':'API belum aktif. Pemilik mengisi key di server setelah istirahat.'}</p></details>
    {record&&<details className="trace"><summary>{record.demo?'Hasil contoh siap':'Desain AI siap'} · lihat prompt</summary><p>{record.prompt}</p><small>{record.demo?'Aset lokal, tidak ada panggilan berbayar.':`Spark ${record.trace.sparkMs} ms · Image ${record.trace.imageMs} ms`}</small><button className="text-button" onClick={()=>{const b=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='sablonai-log-desain.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}}>Unduh bukti prompt & hasil</button></details>}
    <div className="divider-label"><span/>ATAU MULAI DARI INSPIRASI<span/></div><div className="inspiration-list">{sampleBriefs.map((s,i)=><button disabled={!!busy} key={s.id} className="inspiration" onClick={()=>example(s)}><span className={'inspiration-icon inspiration-'+i}>{i===0?'↟':i===1?'☕':'✦'}</span><span><strong>{s.title}</strong><small>{s.category.toLowerCase()}</small></span><Plus size={15}/></button>)}</div>
    <div className="pipeline"><span className="pipeline-dot"/><p>Dirancang untuk <strong>Meta AI</strong><br/><span>Muse Spark → Muse Image → SAM 3.1</span></p></div>
  </section>;
}
