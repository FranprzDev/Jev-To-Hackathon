"use client";

import { useEffect, useRef, useState } from "react";
import { challenges } from "../data/challenges";
const defaultCriteria = [
  {
    key: "earth",
    type: "boolean",
    label: "Ciencia de la Tierra",
    icon: "🌍",
    instructions: "¿La idea aborda ciencia de la Tierra o sistemas terrestres?",
  },
  {
    key: "space",
    type: "boolean",
    label: "Espacio",
    icon: "🚀",
    instructions:
      "¿La idea aborda exploración espacial, astronomía o ciencia planetaria?",
  },
  {
    key: "data",
    type: "boolean",
    label: "Datos NASA",
    icon: "🛰️",
    instructions:
      "¿La idea usa o propone usar datos abiertos de NASA o sus socios?",
  },
  {
    key: "feasible",
    type: "boolean",
    label: "Viable para hackathon",
    icon: "⚡",
    instructions:
      "¿Un equipo pequeño podría construir un prototipo convincente?",
  },
];
const criteriaFor = (selectedChallenge) =>
  challenges.find((item) => item.title === selectedChallenge)?.criteria ||
  defaultCriteria;
const challengeUrl = (title) =>
  `https://www.spaceappschallenge.org/2026/challenges/${challenges.find((item) => item.title === title)?.slug || ""}/`;
const CRITERIA_STORAGE_KEY = "jev-evaluation-criteria";

function readCriteriaByChallenge() {
  try {
    const saved = JSON.parse(localStorage.getItem(CRITERIA_STORAGE_KEY));
    return Array.isArray(saved)
      ? { [challenges[0].title]: saved }
      : saved || {};
  } catch {
    return {};
  }
}

export default function Home() {
  const [language, setLanguage] = useState("es");
  const [mode, setMode] = useState("evaluate");
  const [idea, setIdea] = useState("");
  const [challenge, setChallenge] = useState(challenges[0].title);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [criteriaByChallenge, setCriteriaByChallenge] = useState({});
  const criteriaByChallengeRef = useRef({});
  const [editing, setEditing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate browser-only criteria once before persisting edits.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    const saved = readCriteriaByChallenge();
    criteriaByChallengeRef.current = saved;
    setCriteriaByChallenge(saved);
    setCriteria(saved[challenge] || criteriaFor(challenge));
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!hydrated) return;
    const next = { ...criteriaByChallengeRef.current, [challenge]: criteria };
    criteriaByChallengeRef.current = next;
    setCriteriaByChallenge(next);
    localStorage.setItem(CRITERIA_STORAGE_KEY, JSON.stringify(next));
  }, [criteria, hydrated, challenge]);

  useEffect(() => {
    if (!idea.trim()) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setError("");
        setLoading(true);
        const response = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            challenge,
            idea,
            language,
            criteria,
            mode,
            challengeOptions: challenges.map((item) => item.title),
          }),
        });
        const raw = await response.text();
        const body = raw ? JSON.parse(raw) : {};
        if (!response.ok) throw new Error(body.error || "Evaluation failed");
        setEvaluation(body);
      } catch (caught) {
        setError(caught.message);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [challenge, idea, language, criteria, mode]);

  const es = language === "es";
  const scored =
    evaluation?.matches?.filter(
      (match) => typeof match.probability === "number",
    ) || [];
  const overall = scored.length
    ? Math.round(
        (scored.reduce(
          (sum, match) => sum + match.probability * (match.weight || 1),
          0,
        ) /
          scored.reduce((sum, match) => sum + (match.weight || 1), 0)) *
          100,
      )
    : null;
  const sortedCriteria = [...scored].sort(
    (a, b) => b.probability - a.probability,
  );
  const strongestCriteria = sortedCriteria.slice(0, 2);
  const criteriaToStrengthen = sortedCriteria
    .filter((match) => match.probability < 0.6)
    .slice(-2)
    .reverse();
  const updateCriterion = (index, field, value) =>
    setCriteria((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  const addCriterion = () =>
    setCriteria((current) => [
      ...current,
      {
        key: `custom_${Date.now()}`,
        type: "boolean",
        label: "Nuevo criterio",
        icon: "🔎",
        weight: 1,
        instructions: "¿Qué querés evaluar?",
        options: [],
      },
    ]);
  const setCriterionType = (index, type) =>
    updateCriterion(index, "type", type);
  const displayedEvaluation = idea.trim() ? evaluation : null;

  return (
    <main>
      <header>
        <p className="eyebrow">JEV · NASA SPACE APPS</p>
        <h1>
          {es
            ? "Encontrá el desafío correcto para tu idea."
            : "Find the right challenge for your idea."}
        </h1>
        <p className="intro">
          {es
            ? "Describí tu proyecto y recibí una orientación rápida. No es una nota oficial: es una primera brújula."
            : "Describe your project and get quick guidance. This is not an official score: it is a first compass."}
        </p>
      </header>
      <div className="language" aria-label={es ? "Idioma" : "Language"}>
        <button
          type="button"
          className={es ? "active" : ""}
          onClick={() => setLanguage("es")}
        >
          ES
        </button>
        <button
          type="button"
          className={!es ? "active" : ""}
          onClick={() => setLanguage("en")}
        >
          EN
        </button>
      </div>
      <div className="mode-switch" role="tablist">
        <button
          type="button"
          className={mode === "evaluate" ? "active" : ""}
          onClick={() => setMode("evaluate")}
        >
          {es ? "Evaluar mi idea" : "Evaluate my idea"}
        </button>
        <button
          type="button"
          className={mode === "match" ? "active" : ""}
          onClick={() => setMode("match")}
        >
          {es ? "Encontrar mi desafío" : "Find my challenge"}
        </button>
      </div>
      <div className="field">
        {mode === "evaluate" && (
          <label htmlFor="challenge">
            {es ? "1. Elegí un desafío" : "1. Choose a challenge"}
          </label>
        )}
        {mode === "evaluate" && (
          <select
            id="challenge"
            value={challenge}
            onChange={(event) => {
              const selectedChallenge = event.target.value;
              setChallenge(selectedChallenge);
              const selectedCriteria =
                criteriaByChallengeRef.current[selectedChallenge] ||
                criteriaFor(selectedChallenge);
              setCriteria(selectedCriteria);
            }}
          >
            {challenges.map((item) => (
              <option key={item.title}>{item.title}</option>
            ))}
          </select>
        )}
      </div>
      <div className="field">
        <label htmlFor="idea">
          {mode === "evaluate"
            ? es
              ? "2. Describí tu idea"
              : "2. Describe your idea"
            : es
              ? "Describí tu idea"
              : "Describe your idea"}
        </label>
        <textarea
          id="idea"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder={
            es
              ? "Ejemplo: una app que ayuda a agricultores a detectar cambios en la salud del suelo usando datos de NASA"
              : "Example: an app that helps farmers detect changes in soil health using NASA data"
          }
        />
      </div>
      {loading && (
        <p className="muted status">
          {es ? "Jev está analizando tu idea…" : "Jev is analyzing your idea…"}
        </p>
      )}
      {error && <p className="error">{error}</p>}
      {mode === "evaluate" && (
        <>
          <button
            className="edit-toggle"
            type="button"
            onClick={() => setEditing(!editing)}
          >
            {editing
              ? es
                ? "Cerrar configuración"
                : "Close settings"
              : es
                ? "⚙ Configurar evaluación"
                : "⚙ Configure evaluation"}
          </button>
          {editing && (
            <section className="editor">
              <p className="eyebrow">
                {es ? "CRITERIOS PERSONALIZABLES" : "CUSTOM CRITERIA"}
              </p>
              <p className="muted">
                {es
                  ? "Usá sí/no para medir una dimensión o opción múltiple para clasificar la idea. Se guarda solamente en este navegador."
                  : "Use yes/no to measure a dimension or choice to classify the idea. It is saved only in this browser."}
              </p>
              {criteria.map((criterion, index) => (
                <fieldset key={criterion.key}>
                  <legend>
                    {criterion.icon} {criterion.label}
                  </legend>
                  <div className="editor-grid">
                    <input
                      aria-label="Emoji"
                      value={criterion.icon}
                      onChange={(event) =>
                        updateCriterion(index, "icon", event.target.value)
                      }
                    />
                    <input
                      aria-label="Nombre del criterio"
                      value={criterion.label}
                      onChange={(event) =>
                        updateCriterion(index, "label", event.target.value)
                      }
                    />
                    <input
                      aria-label="Ponderación"
                      type="number"
                      min="1"
                      max="10"
                      value={criterion.weight || 1}
                      onChange={(event) =>
                        updateCriterion(
                          index,
                          "weight",
                          Math.max(
                            1,
                            Math.min(10, Number(event.target.value) || 1),
                          ),
                        )
                      }
                    />
                    <select
                      aria-label="Tipo"
                      value={criterion.type || "boolean"}
                      onChange={(event) =>
                        setCriterionType(index, event.target.value)
                      }
                    >
                      <option value="boolean">Sí / No</option>
                      <option value="choice">Elegir una opción</option>
                    </select>
                    <input
                      aria-label="Pregunta de evaluación"
                      value={criterion.instructions}
                      onChange={(event) =>
                        updateCriterion(
                          index,
                          "instructions",
                          event.target.value,
                        )
                      }
                    />
                    {criterion.type === "choice" && (
                      <textarea
                        aria-label="Opciones"
                        placeholder="Una opción por línea"
                        value={(criterion.options || []).join("\n")}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "options",
                            event.target.value
                              .split("\n")
                              .map((option) => option.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    )}
                  </div>
                </fieldset>
              ))}
              <button type="button" onClick={addCriterion}>
                {es ? "+ Agregar criterio" : "+ Add criterion"}
              </button>
            </section>
          )}
        </>
      )}
      {displayedEvaluation?.matches && mode === "evaluate" && (
        <section aria-live="polite">
          <div className="result-heading">
            <div>
              <p className="eyebrow">
                {es ? "ORIENTACIÓN INICIAL" : "INITIAL GUIDANCE"}
              </p>
              {overall === null ? (
                <h2>✓</h2>
              ) : (
                <>
                  <h2>{overall}%</h2>
                  <p className="muted">
                    {es
                      ? "alineación promedio con este desafío"
                      : "average alignment with this challenge"}
                  </p>
                </>
              )}
            </div>
            <span className="result-icon">
              {overall === null || overall >= 60 ? "✦" : "↗"}
            </span>
          </div>
          <p className="explanation">
            {es
              ? "Pasá el cursor por cada emoji para ver la pregunta evaluada."
              : "Hover over each emoji to see the evaluation question."}
          </p>
          <div className="matches">
            {displayedEvaluation.matches.map((match) => (
              <div className="match" key={match.key}>
                <div className="match-top">
                  <span title={`${match.label}: ${match.instructions}`}>
                    {match.icon}
                  </span>
                  <strong>{match.label}</strong>
                  <b>
                    {match.choice || `${Math.round(match.probability * 100)}%`}
                  </b>
                </div>
                {match.choice ? (
                  <small>
                    {es ? "Opción elegida por Jev." : "Option selected by Jev."}
                  </small>
                ) : (
                  <>
                    <div className="bar">
                      <i style={{ width: `${match.probability * 100}%` }} />
                    </div>
                    <small>{match.instructions}</small>
                  </>
                )}
              </div>
            ))}
          </div>
          {scored.length > 1 && (
            <div className="insight-grid">
              <div>
                <h3>{es ? "Lo que ya encaja" : "What already fits"}</h3>
                {strongestCriteria.map((match) => (
                  <p key={match.key}>
                    <span>{match.icon}</span> {match.label} ·{" "}
                    {Math.round(match.probability * 100)}%
                  </p>
                ))}
              </div>
              <div>
                <h3>{es ? "Qué podrías reforzar" : "What to strengthen"}</h3>
                {criteriaToStrengthen.length ? (
                  criteriaToStrengthen.map((match) => (
                    <p key={match.key}>
                      <span>{match.icon}</span> {match.label} ·{" "}
                      {Math.round(match.probability * 100)}%
                    </p>
                  ))
                ) : (
                  <p>
                    {es
                      ? "No hay criterios bajos en esta evaluación."
                      : "No low-scoring criteria in this evaluation."}
                  </p>
                )}
              </div>
              <p className="insight-note">
                {es
                  ? "Estas pistas resumen los criterios evaluados; no son una explicación textual generada por Jev."
                  : "These signals summarize the evaluated criteria; they are not a text explanation generated by Jev."}
              </p>
            </div>
          )}
        </section>
      )}
      {displayedEvaluation && mode === "match" && (
        <section aria-live="polite">
          <p className="eyebrow">
            {es ? "DESAFÍO SUGERIDO" : "SUGGESTED CHALLENGE"}
          </p>
          <h2 className="match-result">
            {displayedEvaluation.match ||
              (es ? "No se encontró un desafío" : "No challenge found")}
          </h2>
          {displayedEvaluation.match && (
            <a
              className="challenge-link"
              href={challengeUrl(displayedEvaluation.match)}
              target="_blank"
              rel="noreferrer"
            >
              {es
                ? "Ver desafío oficial en NASA Space Apps ↗"
                : "View official NASA Space Apps challenge ↗"}
            </a>
          )}
        </section>
      )}
    </main>
  );
}
