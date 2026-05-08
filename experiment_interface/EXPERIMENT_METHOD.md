# 실험 방법

## 목적

멀티턴 상담형 AI 대화에서 응답의 prefacing style이 참가자의 편안함, 수용감, 대화 지속 의향, 탐색 유도, 자연스러운 마무리 평가에 미치는 영향을 비교한다.

## 조건

- `Neutral Direct`: 공감형 또는 관계형 완충 표현을 최소화하고 바로 핵심 질문/진술로 진입한다.
- `Relational-dominant`: 인정, 지지, 정상화, 공감형 prefacing을 중심으로 응답을 시작한다.
- `Reflective-dominant`: 참가자 발화의 상태, 의미, 우려를 먼저 재진술하거나 반영한다.
- `Adaptive`: 초반에는 관계 형성, 중반에는 탐색/정리, 후반에는 통합/마무리 중심으로 prefacing 전략을 조절한다.

## 기본 설계

- 세션은 `9` interaction rounds로 고정한다.
- Checkpoint 평가는 `3`, `6`, `9`라운드 종료 시 실시한다.
- AI 응답 텍스트와 TTS는 최소 `5초` reveal latency 이후 함께 공개한다.
- Chat, STT, TTS는 OpenAI API를 사용한다.
- 현재 인터페이스는 실험자 설정, 참가자 발화, checkpoint 평가가 한 화면에 있는 단일 콘솔 구조다.
- 참가자 발화 입력은 마이크 녹음만 허용한다. STT 결과는 자동 제출되며, 참가자가 전사 결과를 수정하거나 텍스트를 직접 입력하지 않는다.

## 실행 준비

```bash
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
export EXPERIMENT_ACCESS_TOKEN="shared-lab-token"
python3 experiment_interface/server.py
```

실험 인터페이스:

```text
http://127.0.0.1:8000
```

동일한 화면에서 세션 설정, 대화 진행, checkpoint 평가를 모두 수행한다.
서버에서 `EXPERIMENT_ACCESS_TOKEN`을 설정한 경우, 실험자는 `Session Setup`의 `Access Token`에 같은 값을 입력해야 한다.

## 진행 절차

1. 실험자는 왼쪽 `Session Setup` 패널에서 `Participant ID`, `Scenario`, `Condition`, `OpenAI Model`을 설정한다.
2. `Start Session`을 눌러 세션을 시작한다.
3. 시스템은 선택된 시나리오의 초기 발화를 transcript에 추가하고 1라운드 입력을 활성화한다.
4. 참가자는 `Record` 버튼을 눌러 녹음을 시작하고, 발화가 끝나면 `Stop` 버튼을 눌러 녹음을 종료한다.
5. 시스템은 녹음된 음성을 STT로 전사하고, 전사 결과를 수정 없이 자동 제출한다.
6. 시스템은 지정 조건의 system instruction으로 AI 응답을 생성한다.
7. 응답 생성과 TTS 준비가 완료되더라도 최소 5초가 지나기 전에는 응답을 공개하지 않는다.
8. 세션 시작, 라운드 완료, checkpoint 개방/저장, 세션 완료 시점에 현재 세션 스냅샷을 서버 JSON 파일로 저장한다.
9. 3라운드와 6라운드 종료 후 checkpoint 설문을 저장하면 다음 라운드로 진행된다.
10. 9라운드 종료 후 최종 checkpoint 설문을 저장하면 세션이 완료된다.
11. 필요하면 `세션 JSON 다운로드` 버튼으로 현재 브라우저 상태의 세션 데이터를 추가로 내려받는다.

## Checkpoint 측정

- 3라운드: 초기 라포 평가
  - 편안함
  - 수용감
  - 이후 대화 지속 의향
- 6라운드: 중반 탐색 평가
  - 맥락을 더 자세히 설명하게 되었는지
  - 직전 발화와 응답의 연결성
  - 대화 흐름의 자연스러움
- 9라운드: 세션 마무리 평가
  - 자연스러운 종료감
  - 다음 단계 또는 정리감
  - 전체 상호작용 적합성
  - 참가자가 지각한 두드러진 응답 스타일

## 데이터 저장

이벤트 로그는 아래 위치에 JSONL 형식으로 저장된다.

```text
experiment_interface/logs/
```

세션 단위 결과 스냅샷은 아래 위치에 JSON 형식으로 저장된다.

```text
experiment_interface/sessions/
```

주요 이벤트:

- `session_started`
- `stt_result`
- `chat_completion`
- `tts_result`
- `response_revealed`
- `audio_playback_started`
- `session_snapshot_saved`
- `checkpoint_submitted`
- `session_completed`

## 운영 메모

- 참가자 ID는 로그 파일명에 들어가므로 개인 식별 정보 대신 익명 코드를 사용한다.
- 연구실 포트로 외부 접속을 열 때는 `EXPERIMENT_ACCESS_TOKEN`을 설정하고, 토큰을 실험 참여자 또는 실험자에게만 공유한다.
- 조건 배정은 실험자가 별도 randomization sheet에서 관리하는 것을 권장한다.
- API 오류 또는 네트워크 오류가 발생한 세션은 로그의 이벤트 누락 여부를 확인한 뒤 제외 여부를 결정한다.
- 마이크 녹음은 브라우저 `MediaRecorder`에 의존하므로 Chrome 계열 브라우저에서 먼저 확인한다.
