const EXPERIMENT_CONFIG = {
  fixedRounds: 9,
  scenarios: [
    {
      id: "career_uncertainty",
      label: "진로 불확실성",
      intro:
        "참가자는 진로 선택과 실패에 대한 불안으로 상담형 AI와 대화를 시작합니다. 첫 메시지는 이미 입력되어 있고, 이후 9회 왕복 내에서 라포, 탐색, 심화, 마무리 흐름을 관찰합니다.",
      opener:
        "요즘 진로 때문에 머리가 너무 복잡해요. 뭘 선택해도 후회할 것 같고, 제가 뭘 원하는지도 잘 모르겠어요.",
    },
    {
      id: "social_anxiety",
      label: "대인관계 불안",
      intro:
        "참가자는 사람들과 가까워지고 싶지만 거절이나 오해가 두려운 상황을 공유합니다.",
      opener:
        "사람들이랑 친해지고 싶은데 먼저 다가가는 게 너무 부담돼요. 말 걸었다가 어색해질까 봐 자꾸 피하게 돼요.",
    },
    {
      id: "exam_burnout",
      label: "시험 준비 번아웃",
      intro:
        "참가자는 장기간 시험 준비로 지치고 자기효능감이 떨어진 상태를 이야기합니다.",
      opener:
        "시험 준비를 오래 했는데 요즘은 책상에 앉아도 아무것도 안 들어와요. 계속 해도 될지 자신이 없어졌어요.",
    },
  ],
  conditions: {
    neutral_direct: {
      label: "Neutral Direct",
      summary:
        "Prefacing cue를 최소화하고, 중립적이면서 direct한 질문/진술로 대화를 이어갑니다.",
    },
    relational_dominant: {
      label: "Relational-dominant",
      summary:
        "인정, 지지, 정상화, 공감형 prefacing을 중심적으로 배치합니다.",
    },
    reflective_dominant: {
      label: "Reflective-dominant",
      summary:
        "재진술과 반영을 중심으로 사용자의 상태와 의미를 되비춥니다.",
    },
    adaptive: {
      label: "Adaptive",
      summary:
        "단계에 따라 prefacing 전략을 바꿉니다. 초반 관계 형성, 중반 탐색/정리, 후반 마무리/연결의 흐름을 따릅니다.",
    },
  },
  phaseMap(totalRounds) {
    if (totalRounds <= 6) {
      return [
        { start: 1, end: 2, key: "opening", label: "Opening / Rapport" },
        { start: 3, end: 4, key: "exploration", label: "Exploration / Clarification" },
        { start: 5, end: totalRounds, key: "closing", label: "Closing / Integration" },
      ];
    }
    return [
      { start: 1, end: 3, key: "opening", label: "Opening / Rapport" },
      { start: 4, end: 6, key: "exploration", label: "Exploration / Clarification" },
      { start: 7, end: totalRounds, key: "closing", label: "Closing / Integration" },
    ];
  },
  evaluationSchemas: {
    opening: {
      title: "초기 라포 평가",
      prompt:
        "3턴까지의 대화를 기준으로 응답해 주세요. 대화 초반에 AI의 반응 방식이 편안함, 수용감, 그리고 대화를 이어가고 싶은 마음에 어떤 영향을 주었는지 평가합니다.",
      metrics: [
        {
          key: "comfort",
          label: "3턴까지의 대화는 전반적으로 부담스럽기보다 편안하게 느껴졌다.",
          hint: "1점은 전혀 아니다, 7점은 매우 그렇다",
        },
        {
          key: "felt_accepted",
          label: "AI는 내 말을 성급히 판단하기보다 우선 받아들이려는 느낌을 주었다.",
          hint: "1점은 전혀 아니다, 7점은 매우 그렇다",
        },
        {
          key: "willingness_to_open_up",
          label: "이후에도 내 이야기를 더 이어서 말하고 싶었다.",
          hint: "1점은 전혀 아니다, 7점은 매우 그렇다",
        },
      ],
    },
    exploration: {
      title: "중반 탐색 평가",
      prompt:
        "6턴까지의 대화를 기준으로 응답해 주세요. 이 시점까지 AI의 질문과 반응이 내 상황의 맥락을 더 풀어내게 했는지, 그리고 대화 흐름을 자연스럽게 이어 갔는지 평가합니다.",
      metrics: [
        {
          key: "context_elaboration",
          label: "AI의 질문이나 응답 때문에 내 상황의 맥락을 더 자세히 설명하게 되었다.",
          hint: "1점은 전혀 아니다, 7점은 매우 그렇다",
        },
        {
          key: "response_contingency",
          label: "AI의 질문과 반응은 내가 방금 한 말의 핵심을 잘 짚고 있다고 느껴졌다.",
          hint: "1점은 전혀 아니다, 7점은 매우 그렇다",
        },
        {
          key: "conversational_naturalness",
          label: "이 시점의 대화 흐름은 전반적으로 자연스럽게 이어졌다.",
          hint: "1점은 매우 부자연스럽다, 7점은 매우 자연스럽다",
        },
      ],
    },
    closing: {
      title: "세션 마무리 평가",
      prompt:
        "9턴 전체 대화를 기준으로 응답해 주세요. 대화가 자연스럽게 마무리되었는지, 마지막까지 상호작용이 일관되고 적절하게 이어졌는지 평가합니다.",
      metrics: [
        {
          key: "closure_naturalness",
          label: "이번 대화는 갑자기 끊긴 느낌보다 자연스럽게 마무리되었다.",
          hint: "1점은 전혀 아니다, 7점은 매우 그렇다",
        },
        {
          key: "next_step_clarity",
          label: "대화가 끝날 무렵, 지금까지의 이야기를 어떻게 정리해야 할지 조금 더 분명해졌다.",
          hint: "1점은 전혀 아니다, 7점은 매우 그렇다",
        },
        {
          key: "interaction_fit",
          label: "전반적으로 이번 AI의 대화 방식은 마지막까지 상호작용을 이어 가기에 적절했다.",
          hint: "1점은 전혀 아니다, 7점은 매우 그렇다",
        },
      ],
    },
  },
};

const state = {
  sessionId: null,
  participantId: "",
  condition: "",
  scenarioId: "",
  rounds: 9,
  currentRound: 0,
  model: "gpt-4o-mini",
  accessToken: "",
  messages: [],
  transcript: [],
  evaluations: [],
  checkpointRounds: [],
  pendingCheckpoint: null,
  phase: "Idle",
  serverOk: false,
  accessTokenRequired: false,
  inputLocked: true,
  sessionCompleted: false,
};

const REVEAL_LATENCY_MS = 5000;

const els = {
  participantId: document.getElementById("participantId"),
  scenarioSelect: document.getElementById("scenarioSelect"),
  conditionSelect: document.getElementById("conditionSelect"),
  modelName: document.getElementById("modelName"),
  accessToken: document.getElementById("accessToken"),
  startButton: document.getElementById("startButton"),
  setupWarning: document.getElementById("setupWarning"),
  conditionSummary: document.getElementById("conditionSummary"),
  roundStatus: document.getElementById("roundStatus"),
  connectionBadge: document.getElementById("connectionBadge"),
  chatTitle: document.getElementById("chatTitle"),
  scenarioIntro: document.getElementById("scenarioIntro"),
  messageList: document.getElementById("messageList"),
  chatForm: document.getElementById("chatForm"),
  userInput: document.getElementById("userInput"),
  sendButton: document.getElementById("sendButton"),
  phaseLabel: document.getElementById("phaseLabel"),
  surveyForm: document.getElementById("surveyForm"),
  saveSurveyButton: document.getElementById("saveSurveyButton"),
  downloadButton: document.getElementById("downloadButton"),
  evaluationStep: document.getElementById("evaluationStep"),
  evaluationPrompt: document.getElementById("evaluationPrompt"),
  styleRecognitionSection: document.getElementById("styleRecognitionSection"),
  ratingSectionPrompt: document.getElementById("ratingSectionPrompt"),
  metricLabel1: document.getElementById("metricLabel1"),
  metricLabel2: document.getElementById("metricLabel2"),
  metricLabel3: document.getElementById("metricLabel3"),
  metricHint1: document.getElementById("metricHint1"),
  metricHint2: document.getElementById("metricHint2"),
  metricHint3: document.getElementById("metricHint3"),
  metricGroup1: document.getElementById("metricGroup1"),
  metricGroup2: document.getElementById("metricGroup2"),
  metricGroup3: document.getElementById("metricGroup3"),
  recordButton: document.getElementById("recordButton"),
  voiceStatus: document.getElementById("voiceStatus"),
  presenceStage: document.getElementById("presenceStage"),
  presenceTitle: document.getElementById("presenceTitle"),
  presenceCaption: document.getElementById("presenceCaption"),
  presenceRound: document.getElementById("presenceRound"),
  presenceMode: document.getElementById("presenceMode"),
};

let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let isRecording = false;
let audioCaptureReady = false;

function setVoiceStatus(message, tone = "neutral") {
  els.voiceStatus.textContent = message;
  els.voiceStatus.dataset.tone = tone;
}

function init() {
  renderScenarioOptions();
  renderConditionOptions();
  renderConditionSummary();
  renderRoundStatus();
  renderEvaluationState();
  renderPresence({
    mode: "idle",
    title: "세션 대기 중",
    caption:
      "참가자 ID를 입력한 뒤 세션을 시작하면\n이 패널이 응답 상태를 시각적으로 보여줍니다.",
  });
  setSurveyEnabled(false);
  bindEvents();
  setupAudioCapture();
  pingServer();
}

function renderScenarioOptions() {
  EXPERIMENT_CONFIG.scenarios.forEach((scenario) => {
    const option = document.createElement("option");
    option.value = scenario.id;
    option.textContent = scenario.label;
    els.scenarioSelect.appendChild(option);
  });
}

function renderConditionOptions() {
  Object.entries(EXPERIMENT_CONFIG.conditions).forEach(([value, meta]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = meta.label;
    els.conditionSelect.appendChild(option);
  });
}

function bindEvents() {
  els.conditionSelect.addEventListener("change", renderConditionSummary);
  els.startButton.addEventListener("click", startSession);
  els.chatForm.addEventListener("submit", handleSubmit);
  els.surveyForm.addEventListener("submit", saveSurvey);
  els.downloadButton.addEventListener("click", downloadSession);
  els.recordButton.addEventListener("click", toggleRecording);
}

async function pingServer() {
  try {
    const resp = await fetch("/api/health");
    const data = await resp.json();
    state.serverOk = Boolean(data.ok);
    state.accessTokenRequired = Boolean(data.requires_access_token);
    els.connectionBadge.textContent = state.serverOk
      ? `Server ready · ${data.model}${state.accessTokenRequired ? " · token required" : ""}`
      : "Server unavailable";
    if (!data.has_openai_key) {
      els.setupWarning.textContent = "OPENAI_API_KEY 가 설정되지 않았습니다. API 요청이 실패합니다.";
    } else if (state.accessTokenRequired) {
      els.setupWarning.textContent = "서버 접근 토큰이 활성화되어 있습니다. Access Token을 입력하세요.";
    }
  } catch (err) {
    els.connectionBadge.textContent = "Server unavailable";
    els.setupWarning.textContent = "로컬 서버에 연결할 수 없습니다. server.py를 먼저 실행하세요.";
  }
}

function getAccessToken() {
  state.accessToken = els.accessToken.value.trim();
  return state.accessToken;
}

function jsonHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) {
    headers["X-Experiment-Token"] = token;
  }
  return headers;
}

function renderConditionSummary() {
  const meta = EXPERIMENT_CONFIG.conditions[els.conditionSelect.value];
  els.conditionSummary.textContent = meta ? meta.summary : "";
}

function renderRoundStatus() {
  const total = EXPERIMENT_CONFIG.fixedRounds;
  const phases = EXPERIMENT_CONFIG.phaseMap(total);
  els.roundStatus.innerHTML = "";
  phases.forEach((phase) => {
    const row = document.createElement("div");
    row.className = "status-row";
    row.innerHTML = `<span>${phase.label}</span><strong>${phase.start}-${phase.end}</strong>`;
    els.roundStatus.appendChild(row);
  });
}

function getCheckpointRounds(totalRounds) {
  return [...new Set(EXPERIMENT_CONFIG.phaseMap(totalRounds).map((phase) => phase.end))];
}

function renderEvaluationState() {
  if (!state.sessionId) {
    els.evaluationStep.textContent = "평가 대기 중";
    els.evaluationPrompt.textContent = "라운드가 진행되면 checkpoint마다 평가가 활성화됩니다.";
    els.ratingSectionPrompt.textContent =
      "각 문항은 해당 checkpoint까지의 대화만 기준으로, 1점에서 7점 사이로 응답해 주세요.";
    els.saveSurveyButton.textContent = "평가 저장";
    els.styleRecognitionSection.classList.add("hidden");
    renderMetricSchema(null);
    return;
  }

  if (!state.pendingCheckpoint) {
    const nextCheckpoint = state.checkpointRounds.find((round) => round >= state.currentRound);
    els.evaluationStep.textContent = state.sessionCompleted
      ? "세션 완료"
      : "다음 평가 대기 중";
    els.evaluationPrompt.textContent = state.sessionCompleted
      ? "최종 평가가 저장되었습니다. 세션 JSON을 내려받을 수 있습니다."
      : `다음 평가는 round ${nextCheckpoint ?? state.rounds} 종료 후 활성화됩니다.`;
    els.ratingSectionPrompt.textContent =
      "checkpoint가 열리면 해당 단계에 맞는 3개 문항이 표시됩니다.";
    els.saveSurveyButton.textContent = "평가 저장";
    els.styleRecognitionSection.classList.add("hidden");
    renderMetricSchema(null);
    return;
  }

  const schema = getEvaluationSchema(state.pendingCheckpoint.phaseKey);
  const label = state.pendingCheckpoint.isFinal ? "최종 평가" : "평가 가능";
  els.evaluationStep.textContent = `${label} · Round ${state.pendingCheckpoint.round}`;
  els.evaluationPrompt.textContent = state.pendingCheckpoint.isFinal
    ? `${state.pendingCheckpoint.phaseLabel} 단계가 종료되었습니다. 최종 평가를 저장하면 세션이 완료됩니다.`
    : `${state.pendingCheckpoint.phaseLabel} 단계가 종료되었습니다. 평가를 저장하면 다음 라운드로 진행합니다.`;
  els.ratingSectionPrompt.textContent = schema.prompt;
  els.saveSurveyButton.textContent = state.pendingCheckpoint.isFinal
    ? "최종 평가 저장"
    : "평가 저장";
  els.styleRecognitionSection.classList.toggle("hidden", !state.pendingCheckpoint.isFinal);
  renderMetricSchema(schema);
}

function getEvaluationSchema(phaseKey) {
  return EXPERIMENT_CONFIG.evaluationSchemas[phaseKey] || EXPERIMENT_CONFIG.evaluationSchemas.closing;
}

function renderMetricSchema(schema) {
  const fallback = [
    { label: "평가 문항 1", hint: "1점은 전혀 아니다, 7점은 매우 그렇다", key: "metric_1" },
    { label: "평가 문항 2", hint: "1점은 전혀 아니다, 7점은 매우 그렇다", key: "metric_2" },
    { label: "평가 문항 3", hint: "1점은 전혀 아니다, 7점은 매우 그렇다", key: "metric_3" },
  ];
  const metrics = schema?.metrics || fallback;
  [1, 2, 3].forEach((index) => {
    const metric = metrics[index - 1];
    els[`metricLabel${index}`].textContent = metric.label;
    els[`metricHint${index}`].textContent = metric.hint;
    els[`metricGroup${index}`].dataset.metricKey = metric.key;
  });
}

function setSurveyEnabled(enabled) {
  const fields = Array.from(els.surveyForm.elements).filter(
    (element) => element !== els.downloadButton
  );
  fields.forEach((element) => {
    if (element.name === "dominant_style_noticed" && !state.pendingCheckpoint?.isFinal) {
      element.disabled = true;
      return;
    }
    element.disabled = !enabled;
  });
  els.saveSurveyButton.disabled = !enabled;
}

function resetSurveyForm() {
  els.surveyForm.reset();
}

function renderPresence({ mode = "idle", title, caption } = {}) {
  const roundValue = state.sessionId ? Math.min(state.currentRound, state.rounds) : 0;
  const modeLabels = {
    idle: "Idle",
    ready: "Ready",
    recording: "Recording",
    processing: "Processing",
    checkpoint: "Checkpoint",
    completed: "Completed",
    error: "Error",
  };

  els.presenceStage.dataset.mode = mode;
  els.presenceTitle.textContent = title;
  els.presenceCaption.textContent = caption;
  els.presenceRound.textContent = `Round ${roundValue}/${state.rounds}`;
  els.presenceMode.textContent = modeLabels[mode] || mode;
}

function syncPresenceToState() {
  if (!state.sessionId) {
    renderPresence({
      mode: "idle",
      title: "세션 대기 중",
      caption:
        "참가자 ID를 입력한 뒤 세션을 시작하면\n이 패널이 응답 상태를 시각적으로 보여줍니다.",
    });
    return;
  }

  if (state.sessionCompleted) {
    renderPresence({
      mode: "completed",
      title: "세션 완료",
      caption: "최종 checkpoint가 저장되었습니다. 세션 JSON을 내려받아 결과를 정리할 수 있습니다.",
    });
    return;
  }

  if (state.pendingCheckpoint) {
    renderPresence({
      mode: "checkpoint",
      title: `${state.pendingCheckpoint.round}턴 체크포인트`,
      caption: state.pendingCheckpoint.isFinal
        ? "최종 평가를 저장하면 세션이 종료됩니다."
        : "현재 checkpoint 평가를 저장하면 다음 라운드로 이동합니다.",
    });
    return;
  }

  renderPresence({
    mode: "ready",
    title: `${state.currentRound}턴 입력 대기`,
    caption: "Record를 누르고 발화한 뒤 Stop을 누르면 전사 후 자동으로 제출됩니다.",
  });
}

function setConversationEnabled(enabled) {
  state.inputLocked = !enabled;
  els.userInput.disabled = false;
  if (els.sendButton) {
    els.sendButton.disabled = !enabled;
  }
  syncRecordButton();
  if (!isRecording) {
    syncPresenceToState();
  }
}

function openCheckpoint(round) {
  const phase = getPhase(round);
  state.pendingCheckpoint = {
    round,
    phaseKey: phase.key,
    phaseLabel: phase.label,
    isFinal: round >= state.rounds,
  };
  renderEvaluationState();
  setSurveyEnabled(true);
  setConversationEnabled(false);
  syncPresenceToState();
  addMessage(
    "meta",
    state.pendingCheckpoint.isFinal
      ? `Final checkpoint ready after round ${round}. Save the evaluation to finish the session.`
      : `Checkpoint ready after round ${round}. Save the evaluation to continue.`
  );
  saveSessionSnapshot("checkpoint_opened", {
    extra: { checkpoint: state.pendingCheckpoint },
  });
}

function advanceRound() {
  state.currentRound += 1;
  updatePhase();
}

async function completeSession() {
  state.sessionCompleted = true;
  state.pendingCheckpoint = null;
  setConversationEnabled(false);
  setSurveyEnabled(false);
  renderEvaluationState();
  syncPresenceToState();
  addMessage("meta", "Configured rounds complete. Final checkpoint saved.");
  await postLog({
    event: "session_completed",
    session_id: state.sessionId,
    participant_id: state.participantId,
    condition: state.condition,
    evaluations: state.evaluations,
  });
  await saveSessionSnapshot("session_completed", { status: "completed", reportError: true });
}

function buildSessionPayload(saveReason, { status = "in_progress", extra = {} } = {}) {
  const scenario = getScenario();
  const conditionMeta = EXPERIMENT_CONFIG.conditions[state.condition];
  return {
    session_id: state.sessionId,
    participant_id: state.participantId,
    condition: state.condition,
    condition_label: conditionMeta?.label || state.condition,
    scenario_id: state.scenarioId,
    scenario_label: scenario?.label || state.scenarioId,
    rounds: state.rounds,
    current_round: state.currentRound,
    phase: state.phase,
    model: state.model,
    status,
    save_reason: saveReason,
    client_saved_at: new Date().toISOString(),
    checkpoint_rounds: state.checkpointRounds,
    pending_checkpoint: state.pendingCheckpoint,
    session_completed: state.sessionCompleted,
    transcript: state.transcript,
    evaluations: state.evaluations,
    ...extra,
  };
}

async function saveSessionSnapshot(saveReason, { status, extra, reportError = false } = {}) {
  if (!state.sessionId) {
    return null;
  }
  try {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(buildSessionPayload(saveReason, { status, extra })),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Unknown session save error");
    }
    return data;
  } catch (err) {
    if (reportError) {
      addMessage("meta", `Server session save failed: ${err.message}`);
    }
    return null;
  }
}

async function postLog(payload) {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (_err) {
    // Best-effort local logging.
  }
}

async function setupAudioCapture() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    setVoiceStatus("이 브라우저에서는 마이크 녹음을 지원하지 않아 세션 입력을 진행할 수 없습니다.", "error");
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCaptureReady = true;
    syncRecordButton();
    setVoiceStatus("마이크 사용 가능. Record를 눌러 녹음을 시작하고 Stop을 눌러 전사를 시작합니다.", "active");
  } catch (err) {
    setVoiceStatus(
      "마이크 권한을 가져오지 못했습니다. 브라우저 권한을 확인한 뒤 다시 시도해 주세요.",
      "error"
    );
  }
}

function syncRecordButton() {
  if (!audioCaptureReady) {
    els.recordButton.disabled = true;
    els.recordButton.textContent = "Mic Unavailable";
    return;
  }
  els.recordButton.disabled = !state.sessionId || (!isRecording && state.inputLocked);
  els.recordButton.textContent = isRecording ? "Stop" : "Record";
}

function startSession() {
  const participantId = els.participantId.value.trim();
  if (!participantId) {
    els.setupWarning.textContent = "Participant ID를 입력하세요.";
    return;
  }
  if (state.accessTokenRequired && !getAccessToken()) {
    els.setupWarning.textContent = "서버 접근 토큰을 입력하세요.";
    return;
  }

  state.sessionId = `${participantId}_${Date.now()}`;
  state.participantId = participantId;
  state.scenarioId = els.scenarioSelect.value;
  state.condition = els.conditionSelect.value;
  state.rounds = EXPERIMENT_CONFIG.fixedRounds;
  state.currentRound = 0;
  state.model = els.modelName.value.trim() || "gpt-4o-mini";
  state.messages = [];
  state.transcript = [];
  state.evaluations = [];
  state.pendingCheckpoint = null;
  state.checkpointRounds = getCheckpointRounds(state.rounds);
  state.sessionCompleted = false;
  state.inputLocked = false;
  els.setupWarning.textContent = "";
  resetSurveyForm();

  const scenario = getScenario();
  els.chatTitle.textContent = `${participantId} · ${EXPERIMENT_CONFIG.conditions[state.condition].label}`;
  els.scenarioIntro.textContent = scenario.intro;
  els.messageList.innerHTML = "";
  addMessage("meta", `Session started · ${state.rounds} rounds`);
  addMessage("user", scenario.opener);
  state.messages.push({ role: "user", content: scenario.opener });
  state.transcript.push({ role: "user", content: scenario.opener, round: 0 });

  state.currentRound = 1;
  updatePhase();
  renderEvaluationState();
  setConversationEnabled(true);
  setSurveyEnabled(false);
  syncRecordButton();
  syncPresenceToState();
  els.downloadButton.disabled = false;

  postLog({
    event: "session_started",
    session_id: state.sessionId,
    participant_id: state.participantId,
    condition: state.condition,
    rounds: state.rounds,
    scenario_id: state.scenarioId,
    model: state.model,
  });
  saveSessionSnapshot("session_started");
}

function getScenario() {
  return EXPERIMENT_CONFIG.scenarios.find((item) => item.id === state.scenarioId);
}

function getPhase(roundIndex) {
  const phases = EXPERIMENT_CONFIG.phaseMap(state.rounds);
  return phases.find((phase) => roundIndex >= phase.start && roundIndex <= phase.end) || phases[0];
}

function updatePhase() {
  const phase = getPhase(state.currentRound);
  state.phase = phase.label;
  els.phaseLabel.textContent = `Round ${state.currentRound}/${state.rounds} · ${phase.label}`;
  if (!isRecording) {
    syncPresenceToState();
  }
}

function addMessage(role, content) {
  const item = document.createElement("div");
  item.className = `message ${role}`;
  item.textContent = content;
  els.messageList.appendChild(item);
  els.messageList.scrollTop = els.messageList.scrollHeight;
}

function buildConditionInstruction() {
  const phase = getPhase(state.currentRound);
  const universal = [
    "You are a Korean counseling-style assistant for a controlled multi-turn user study.",
    "Respond in Korean.",
    "Keep each reply to 2-4 sentences.",
    "Do not mention conditions, experiments, or response strategies.",
    "Maintain a warm but non-clinical tone. Do not diagnose.",
    "The study manipulates response prefacing style. Keep the core counseling content plausible while making the opening style salient.",
  ];

  const byCondition = {
    neutral_direct: [
      "Use a direct onset in the sense of entering the substantive response immediately without a stronger prefacing cue.",
      "Allowed opening forms are a direct statement, a direct reflection, or a question-like reformulation tied to the user's last message.",
      "Prefer concrete observations, questions, or decision frames over supportive framing.",
      "Avoid empathic prefacing, partnership framing, reassurance, gratitude, encouragement, and normalizing statements anywhere in the reply.",
      "Do not use phrases that say the feeling is natural, understandable, common, or shared by many people.",
      "Do not add a relational buffer before the main response.",
      "Avoid reflective or supportive Korean openings such as '-것 같네요', '-군요', '이해가 돼요', '자연스러운 일이에요', '많은 사람들이', '함께 이야기해봐요'.",
    ],
    relational_dominant: [
      "Start most replies with supportive, affirming, or normalizing prefacing.",
      "Emphasize safety, understanding, and encouragement before moving to the main response.",
      "Do not become overly verbose.",
    ],
    reflective_dominant: [
      "Start most replies by reflecting or reformulating the user's state, concern, or meaning.",
      "Reflect before asking or suggesting.",
      "Keep reflections natural rather than mechanical repetition.",
    ],
    adaptive: [
      "Adapt the prefacing style to the dialogue phase.",
      "In Opening/Rapport, prefer relational-supportive prefacing.",
      "In Exploration, prefer exploratory or lightly structuring prefacing.",
      "In Closing, prefer reflective or collaborative prefacing that helps the user leave with a coherent next step.",
    ],
  };

  const phaseHint =
    phase.key === "opening"
      ? "The current phase is opening/rapport. Prioritize trust and approachability."
      : phase.key === "exploration"
        ? "The current phase is exploration. Help the user elaborate on context and perspective."
        : "The current phase is closing/integration. Support reflection and a coherent next-step feeling.";

  return [...universal, ...byCondition[state.condition], phaseHint].join("\n");
}

function toggleRecording(event) {
  event.preventDefault();
  if (isRecording) {
    stopRecording(event);
    return;
  }
  beginRecording(event);
}

function beginRecording(event) {
  event.preventDefault();
  if (!audioCaptureReady || !state.sessionId || state.inputLocked || isRecording) {
    return;
  }

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "audio/webm" });
  mediaRecorder.ondataavailable = (recEvent) => {
    if (recEvent.data.size > 0) {
      recordedChunks.push(recEvent.data);
    }
  };
  mediaRecorder.onstop = async () => {
    isRecording = false;
    syncRecordButton();
    if (!recordedChunks.length) {
      setVoiceStatus("녹음된 오디오가 없습니다. 다시 시도해 주세요.", "error");
      syncPresenceToState();
      return;
    }

    state.inputLocked = true;
    syncRecordButton();
    setVoiceStatus("음성 전사 처리 중입니다…", "active");
    renderPresence({
      mode: "processing",
      title: "음성 전사 중",
      caption: "녹음한 발화를 텍스트로 변환하고 있습니다.",
    });
    const blob = new Blob(recordedChunks, { type: "audio/webm" });
    const buffer = await blob.arrayBuffer();
    const audioBase64 = arrayBufferToBase64(buffer);

    try {
      const response = await fetch("/api/stt", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          audio_base64: audioBase64,
          mime_type: "audio/webm",
          session_id: state.sessionId,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setVoiceStatus("음성 전사 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", "error");
        renderPresence({
          mode: "error",
          title: "STT 오류",
          caption: data.error || "음성 전사 중 오류가 발생했습니다.",
        });
        setConversationEnabled(true);
        return;
      }
      els.userInput.value = data.text;
      setVoiceStatus("음성 입력이 텍스트로 변환되었습니다. 자동으로 전송합니다.", "active");
      await submitCurrentInput();
    } catch (err) {
      setVoiceStatus("음성 전사 요청에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.", "error");
      renderPresence({
        mode: "error",
        title: "STT 요청 실패",
        caption: err.message,
      });
      setConversationEnabled(true);
    }
  };
  mediaRecorder.start();
  isRecording = true;
  syncRecordButton();
  setVoiceStatus("녹음 중입니다. 말을 마친 뒤 Stop을 누르세요.", "active");
  renderPresence({
    mode: "recording",
    title: "음성 입력 수집 중",
    caption: "Stop을 누르면 전사와 응답 준비가 시작됩니다.",
  });
}

function stopRecording(event) {
  if (event) {
    event.preventDefault();
  }
  if (!mediaRecorder || !isRecording) {
    return;
  }
  mediaRecorder.stop();
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function prepareAssistantAudio(text) {
  const ttsRequestedAt = performance.now();
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ text, session_id: state.sessionId }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Unknown TTS error");
  }
  const audioSrc = `data:${data.content_type};base64,${data.audio_base64}`;
  const audio = new Audio(audioSrc);
  audio.preload = "auto";
  return {
    audio,
    ttsReadyLatencyMs: Math.round(performance.now() - ttsRequestedAt),
    contentType: data.content_type,
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  await submitCurrentInput();
}

async function submitCurrentInput() {
  const text = els.userInput.value.trim();
  if (!text || !state.sessionId || state.pendingCheckpoint || state.sessionCompleted) {
    return;
  }
  if (state.currentRound > state.rounds) {
    addMessage("meta", "Configured rounds are complete. Save the checkpoint or start a new session.");
    return;
  }

  els.userInput.value = "";
  setConversationEnabled(false);
  renderPresence({
    mode: "processing",
    title: "AI가 응답을 준비 중",
    caption: "생성 결과와 오디오를 맞춘 뒤, 최소 5초 지연 규칙에 맞춰 응답을 공개합니다.",
  });

  addMessage("user", text);
  state.messages.push({ role: "user", content: text });
  state.transcript.push({ role: "user", content: text, round: state.currentRound });
  addMessage("meta", "Assistant is generating a reply…");
  const submitStartedAt = performance.now();
  const submitStartedAtIso = new Date().toISOString();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        session_id: state.sessionId,
        participant_id: state.participantId,
        condition: state.condition,
        round_index: state.currentRound,
        model: state.model,
        system_instruction: buildConditionInstruction(),
        history: state.messages,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      els.messageList.removeChild(els.messageList.lastChild);
      addMessage("meta", `Error: ${data.error || "Unknown error"}`);
      renderPresence({
        mode: "error",
        title: "응답 생성 실패",
        caption: data.error || "알 수 없는 오류가 발생했습니다.",
      });
      return;
    }
    const modelReadyAt = performance.now();
    const modelLatencyMs = Math.round(modelReadyAt - submitStartedAt);
    let preparedAudio = null;
    let ttsReadyLatencyMs = null;

    try {
      preparedAudio = await prepareAssistantAudio(data.text);
      ttsReadyLatencyMs = preparedAudio.ttsReadyLatencyMs;
    } catch (err) {
      setVoiceStatus("음성 출력 준비에 실패했습니다. 텍스트 응답은 그대로 진행됩니다.", "error");
    }

    const readyLatencyMs = Math.max(modelLatencyMs, ttsReadyLatencyMs ?? 0);
    const revealDelayMs = Math.max(0, REVEAL_LATENCY_MS - readyLatencyMs);
    if (revealDelayMs > 0) {
      await delay(revealDelayMs);
    }
    const revealAt = performance.now();
    const revealLatencyMs = Math.round(revealAt - submitStartedAt);
    const latencyOverrunMs = Math.max(0, revealLatencyMs - REVEAL_LATENCY_MS);

    els.messageList.removeChild(els.messageList.lastChild);
    addMessage("assistant", data.text);
    renderPresence({
      mode: "ready",
      title: "응답 도착",
      caption: "응답이 공개되었습니다. 다음 입력을 이어서 제출하거나 checkpoint를 진행하세요.",
    });
    postLog({
      event: "response_revealed",
      session_id: state.sessionId,
      participant_id: state.participantId,
      condition: state.condition,
      round_index: state.currentRound,
      latency_target_ms: REVEAL_LATENCY_MS,
      submit_time: submitStartedAtIso,
      model_ready_latency_ms: modelLatencyMs,
      tts_ready_latency_ms: ttsReadyLatencyMs,
      reveal_ready_latency_ms: readyLatencyMs,
      reveal_latency_ms: revealLatencyMs,
      reveal_delay_applied_ms: revealDelayMs,
      latency_overrun_ms: latencyOverrunMs,
      audio_synced_to_reveal: Boolean(preparedAudio),
    });
    let audioPlayStartedLatencyMs = null;
    if (preparedAudio?.audio) {
      try {
        await preparedAudio.audio.play();
        audioPlayStartedLatencyMs = Math.round(performance.now() - submitStartedAt);
      } catch (err) {
        setVoiceStatus("음성 출력 재생에 실패했습니다. 텍스트 응답을 계속 확인해 주세요.", "error");
      }
    }
    postLog({
      event: "audio_playback_started",
      session_id: state.sessionId,
      participant_id: state.participantId,
      condition: state.condition,
      round_index: state.currentRound,
      latency_target_ms: REVEAL_LATENCY_MS,
      audio_play_started_latency_ms: audioPlayStartedLatencyMs,
      audio_started_after_reveal_ms:
        audioPlayStartedLatencyMs === null ? null : Math.max(0, audioPlayStartedLatencyMs - revealLatencyMs),
      had_prepared_audio: Boolean(preparedAudio),
    });
    state.messages.push({ role: "assistant", content: data.text });
    state.transcript.push({ role: "assistant", content: data.text, round: state.currentRound });

    const completedRound = state.currentRound;

    if (state.checkpointRounds.includes(completedRound)) {
      openCheckpoint(completedRound);
      return;
    }

    if (completedRound >= state.rounds) {
      await completeSession();
      return;
    }

    advanceRound();
    await saveSessionSnapshot("round_completed", {
      extra: { completed_round: completedRound },
    });
  } catch (err) {
    if (els.messageList.lastChild?.classList.contains("meta")) {
      els.messageList.removeChild(els.messageList.lastChild);
    }
    addMessage("meta", `Request failed: ${err.message}`);
    renderPresence({
      mode: "error",
      title: "요청 실패",
      caption: err.message,
    });
  } finally {
    if (!state.pendingCheckpoint && !state.sessionCompleted && state.currentRound <= state.rounds) {
      setConversationEnabled(true);
      syncRecordButton();
    }
  }
}

async function saveSurvey(event) {
  event.preventDefault();
  if (!state.sessionId || !state.pendingCheckpoint) {
    return;
  }
  const schema = getEvaluationSchema(state.pendingCheckpoint.phaseKey);
  const metricGroups = [els.metricGroup1, els.metricGroup2, els.metricGroup3];
  const selectedMetrics = metricGroups.map((group) =>
    group.querySelector('input[type="radio"]:checked')
  );
  if (selectedMetrics.some((input) => !input)) {
    els.evaluationPrompt.textContent = "현재 checkpoint의 3개 평가 항목을 모두 입력한 뒤 저장하세요.";
    return;
  }
  if (
    state.pendingCheckpoint.isFinal &&
    !String(els.surveyForm.elements.dominant_style_noticed.value).trim()
  ) {
    els.evaluationPrompt.textContent = "최종 checkpoint에서는 Dominant Style Noticed를 선택하세요.";
    return;
  }
  const metricPayload = {};
  selectedMetrics.forEach((input, index) => {
    const metricKey = metricGroups[index].dataset.metricKey || `metric_${index + 1}`;
    metricPayload[metricKey] = input.value;
  });
  const payload = {
    metrics: metricPayload,
    notes: els.surveyForm.elements.notes.value,
  };
  if (state.pendingCheckpoint.isFinal) {
    payload.dominant_style_noticed = els.surveyForm.elements.dominant_style_noticed.value;
  }
  const checkpointEntry = {
    round: state.pendingCheckpoint.round,
    phase: state.pendingCheckpoint.phaseLabel,
    phase_key: state.pendingCheckpoint.phaseKey,
    schema_title: schema.title,
    is_final: state.pendingCheckpoint.isFinal,
    survey: payload,
  };
  state.evaluations.push(checkpointEntry);
  await postLog({
    event: "checkpoint_submitted",
    session_id: state.sessionId,
    participant_id: state.participantId,
    condition: state.condition,
    checkpoint: checkpointEntry,
  });
  await saveSessionSnapshot("checkpoint_submitted", {
    extra: { checkpoint: checkpointEntry },
    reportError: true,
  });
  addMessage("meta", `Checkpoint saved locally · Round ${state.pendingCheckpoint.round}`);

  if (state.pendingCheckpoint.isFinal) {
    await completeSession();
    return;
  }

  state.pendingCheckpoint = null;
  resetSurveyForm();
  setSurveyEnabled(false);
  advanceRound();
  renderEvaluationState();
  setConversationEnabled(true);
  syncPresenceToState();
  await saveSessionSnapshot("checkpoint_released", {
    extra: { checkpoint: checkpointEntry },
  });
}

async function downloadSession() {
  if (!state.sessionId) {
    return;
  }
  const status = state.sessionCompleted ? "completed" : "in_progress";
  const payload = buildSessionPayload("download_requested", { status });
  await saveSessionSnapshot("download_requested", { status, reportError: true });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.sessionId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

init();
