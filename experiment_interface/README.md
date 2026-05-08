# Experiment Interface

로컬 멀티턴 상담 실험용 인터페이스입니다. 현재 버전은 `OpenAI`를 단일 스택으로 사용하며, Chat/STT/TTS를 모두 OpenAI API로 호출하도록 설계했습니다.

## 포함 기능

- 조건 선택:
  - `Neutral Direct`
  - `Relational-dominant`
  - `Reflective-dominant`
  - `Adaptive`
- 실험은 `9` interaction rounds로 고정
- 시나리오 선택
- OpenAI Chat API 호출
- 브라우저 `MediaRecorder` 기반 마이크 전용 입력
- OpenAI STT 호출
- STT 전사 결과 자동 제출
- OpenAI TTS 호출 및 브라우저 오디오 재생
- 응답 텍스트와 TTS는 `5초 minimum reveal latency` 이후 함께 시작
- 세션 로그 JSONL 저장
- 세션 상태 JSON을 서버 `sessions/` 디렉터리에 저장
- 종료 후 간단한 설문 저장 및 JSON 다운로드

## 실행

```bash
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
export EXPERIMENT_ACCESS_TOKEN="shared-lab-token"
python3 experiment_interface/server.py
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:8000
```

서버 포트를 외부에서 접근 가능하게 열어야 하면 서버에서 아래처럼 실행합니다.

```bash
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
export EXPERIMENT_ACCESS_TOKEN="shared-lab-token"
export EXPERIMENT_HOST="0.0.0.0"
export EXPERIMENT_PORT="8000"
python3 experiment_interface/server.py
```

`EXPERIMENT_ACCESS_TOKEN`을 설정하면 브라우저의 `Access Token` 입력값이 맞는 경우에만 Chat/STT/TTS/log/session 저장 API가 동작합니다. 토큰을 설정하지 않으면 로컬 개발용으로 인증 없이 동작합니다.

## 데이터 저장 위치

이벤트 로그는 아래 디렉터리에 JSONL로 저장됩니다.

```text
experiment_interface/logs/
```

세션 단위 결과 스냅샷은 아래 디렉터리에 JSON으로 저장됩니다. 같은 세션은 진행 단계마다 같은 파일에 덮어써지며, 최종 checkpoint 저장 후 `status: "completed"` 상태가 됩니다.

```text
experiment_interface/sessions/
```

## 현재 구현 가정

- 현재 인터페이스는 실험 통제를 위해 `9` interaction rounds로 고정되어 있습니다.
- 브라우저의 세션 JSON 다운로드는 보조 기능이며, 운영 중 원본 데이터는 서버의 `sessions/`와 `logs/`에 남깁니다.
- 참가자 발화는 마이크 녹음만 허용하며, 전사 결과 수정이나 직접 텍스트 입력은 제공하지 않습니다.
- 라운드 수를 다시 바꾸려면 phase checkpoint 구조와 측정 설계를 함께 다시 조정하는 편이 안전합니다.
- `Adaptive` 조건은 best-case baseline이 아니라, phase-sensitive prefacing 배치 조건으로 구현했습니다.
- `core response`를 완전히 동일하게 맞추는 것은 불가능하므로, 현재 구현은 `prefacing-centered manipulation`에 가깝습니다.
- 오디오 캡처는 브라우저 `MediaRecorder`에 의존하므로, Chrome 계열 브라우저에서 가장 안정적으로 동작합니다.

## 변경 포인트

- 기본 라운드 수:
  - [app.js](/Users/jaehyun_lab/Desktop/ICLab/experiment_interface/static/app.js) 의 `EXPERIMENT_CONFIG.fixedRounds`
- 조건 설명:
  - [app.js](/Users/jaehyun_lab/Desktop/ICLab/experiment_interface/static/app.js) 의 `EXPERIMENT_CONFIG.conditions`
- 시나리오:
  - [app.js](/Users/jaehyun_lab/Desktop/ICLab/experiment_interface/static/app.js) 의 `EXPERIMENT_CONFIG.scenarios`
- OpenAI chat 모델명 기본값:
  - 환경변수 `OPENAI_CHAT_MODEL`
  - 또는 UI의 model input
- OpenAI STT/TTS 모델:
  - 환경변수 `OPENAI_STT_MODEL`
  - 환경변수 `OPENAI_TTS_MODEL`
  - 환경변수 `OPENAI_TTS_VOICE`

## 검증 상태

- 로컬 정적 UI와 서버 코드는 구성 완료
- 이 환경에서는 외부 네트워크 호출을 실제로 검증하지 못했습니다
- 따라서 OpenAI Chat/STT/TTS 호출은 API 키가 있는 실제 로컬 실행 환경에서 확인해야 합니다
