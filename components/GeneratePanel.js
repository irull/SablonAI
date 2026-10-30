"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  LoaderCircle,
  Plus,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { config, sampleBriefs } from "../lib/config";
import { metaRequest } from "../lib/api";
import { translate } from "../lib/i18n";

export default function GeneratePanel({ design, onDesign, onMode, t }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const [brief, setBrief] = useState(""),
    [demo, setDemo] = useState(config.demoMode),
    [liveReady, setLiveReady] = useState(false);
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [record, setRecord] = useState(null);
  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((s) => {
        setLiveReady(s.liveReady);
        if (!s.liveReady) {
          setDemo(true);
          onMode("demo");
        }
      })
      .catch(() => {});
  }, []);
  const example = (s) => {
    setBrief(s.brief);
  };
  async function generate() {
    if (brief.trim().length < 5) {
      setError(tr("briefTooShort"));
      return;
    }
    setError("");
    setRecord(null);
    setBusy(
      demo ? tr("busyPickDemo") : tr("busySpark"),
    );
    try {
      const refined = await metaRequest({ action: "refine", brief, demo });
      setBusy(demo ? tr("busyPrepareDemo") : tr("busyImage"));
      const result = await metaRequest({
        action: "image",
        prompt: refined.prompt,
        demo,
      });
      const next = {
        ...result,
        prompt: refined.prompt,
        brief,
        trace: {
          sparkMs: refined.durationMs,
          imageMs: result.durationMs,
          sparkUsage: refined.usage,
          imageUsage: result.usage,
        },
      };
      onDesign(next);
      setRecord(next);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="brief-panel card">
      <div className="panel-heading">
        <span className="icon-tile">
          <Sparkles size={19} />
        </span>
        <div>
          <h2>{tr("genTitle")}</h2>
          <p>{tr("genSub")}</p>
        </div>
      </div>
      <div className="assistant-note">
        <span className="ai-orb">
          <Sparkles size={16} />
        </span>
        <div>
          <strong>{tr("genHello")}</strong>
          <p>{tr("genHelloText")}</p>
        </div>
      </div>
      <label className="field-label" htmlFor="brief">
        {tr("briefLabel")}
      </label>
      <div className="prompt-box">
        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={tr("briefPlaceholder")}
          maxLength={1500}
          disabled={!!busy}
        />
        <div>
          <span>{tr("briefHint")}</span>
          <span>{brief.length}/1500</span>
        </div>
      </div>
      <button
        className="primary generate-button"
        disabled={!!busy}
        onClick={generate}
      >
        {busy ? (
          <LoaderCircle size={17} className="spinner" />
        ) : (
          <WandSparkles size={18} />
        )}{" "}
        {busy ? tr("generatingBtn") : tr("generateBtn")}{" "}
        {!busy && <ArrowRight size={17} />}
      </button>
      <p className="small-note center" role="status" aria-live="polite">
        {busy ||
          (demo ? tr("statusDemo") : tr("statusLive"))}
      </p>
      {error && (
        <div className="error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => {
              onDesign({ ...sampleBriefs[0], demo: true });
              setError("");
            }}
          >
            {tr("fallbackDesign")}
          </button>
        </div>
      )}
      <details className="connection-settings">
        <summary>{tr("connSettings")}</summary>
        <label>
          <input
            type="checkbox"
            checked={!demo}
            disabled={!liveReady || !!busy}
            onChange={(e) => {
              setDemo(!e.target.checked);
              onMode(e.target.checked ? "live" : "demo");
            }}
          />{" "}
          {tr("liveTest")}
        </label>
        <p>
          {liveReady ? tr("connReady") : tr("connNotReady")}
        </p>
      </details>
      {record && (
        <details className="trace">
          <summary>
            {record.demo ? tr("traceSampleReady") : tr("traceAiReady")} ·{" "}
            {tr("traceViewPrompt")}
          </summary>
          <p>{record.prompt}</p>
          <small>
            {record.demo
              ? tr("traceLocal")
              : `Spark ${record.trace.sparkMs} ms · Image ${record.trace.imageMs} ms`}
          </small>
          <button
            className="text-button"
            onClick={() => {
              const b = new Blob([JSON.stringify(record, null, 2)], {
                type: "application/json",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(b);
              a.download = "sablonai-log-desain.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }}
          >
            {tr("traceDownload")}
          </button>
        </details>
      )}
      <div className="divider-label">
        <span />
        {tr("orInspiration")}
        <span />
      </div>
      <div className="inspiration-list">
        {sampleBriefs.map((s, i) => (
          <button
            disabled={!!busy}
            key={s.id}
            className="inspiration"
            onClick={() => example(s)}
          >
            <span className={"inspiration-icon inspiration-" + i}>
              {i === 0 ? "↟" : i === 1 ? "☕" : "✦"}
            </span>
            <span>
              <strong>{s.title}</strong>
              <small>{s.category.toLowerCase()}</small>
            </span>
            <Plus size={15} />
          </button>
        ))}
      </div>
      <div className="pipeline">
        <span className="pipeline-dot" />
        <p>
          {tr("pipelineFor")} <strong>Meta AI</strong>
          <br />
          <span>Muse Spark → Muse Image → SAM 3.1</span>
        </p>
      </div>
    </section>
  );
}
