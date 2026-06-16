import { auth } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

if (!window.AI_CONFIG || !window.AI_CONFIG.GEMINI_API_KEY) {
    console.error("AI_CONFIG is not properly set. AI generation will show an error in preview.html.");
}

initBuilderAuthNav();
initAdvancedBuilder();

function initBuilderAuthNav() {
    const authLink = document.getElementById('auth-nav-link');
    const authLabel = document.getElementById('auth-nav-label');

    if (!authLink || !authLabel) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            authLink.href = 'login.html';
            authLabel.textContent = '로그인';
            authLink.title = '로그인';
            return;
        }

        const label = user.displayName || user.email?.split('@')[0] || 'Profile';
        authLink.href = 'profile.html';
        authLabel.textContent = label;
        authLink.title = user.email || label;
    });
}

function initAdvancedBuilder() {
    const form = document.querySelector('form');
    const submitBtn = document.getElementById('submit-builder-btn');
    const generateBtn = document.getElementById('generate-btn');
    const bottomPanel = document.querySelector('.sticky.bottom-4');
    const bottomButtons = bottomPanel ? Array.from(bottomPanel.querySelectorAll('button[type="button"]')) : [];
    const resetBtn = bottomButtons[0] || null;

    if (!form) {
        console.error("Builder form was not found.");
        return;
    }

    const STATE_KEY = 'advanced-builder-state';
    const PREVIEW_JOB_KEY = 'advanced-builder-preview-job';
    const PREVIEW_URL = 'preview_demo.html';
    const API_MODEL = 'gemini-1.5-flash'; 
    const progressMessages = [
        'Analyzing requirements...',
        'Creating website structure...',
        'Generating pages...',
        'Designing interface...',
        'Applying styles...',
        'Finalizing website...'
    ];

    const defaults = {
        selectedType: 'custom',
        components: [],
        headerStyle: 'classic',
        contentDisplay: 'grid',
        sidebarEnabled: false,
        gridColumns: 3,
        siteName: '',
        companyName: '',
        siteDesc: '',
        contactEmail: '',
        contactPhone: '',
        contactAddress: '',
        socials: {
            facebook: '',
            x: '',
            instagram: '',
            linkedin: ''
        },
        mainColor: '#ffffff',
        subColor: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        buttonRadius: '0.5rem',
        darkMode: false,
        additionalRequests: '',
        seed: Date.now()
    };

    let state = loadState();
    let activeGenerationId = null;

    const fields = {
        typeButtons: Array.from(document.querySelectorAll('.type-btn')),
        componentCheckboxes: Array.from(document.querySelectorAll('input[name="components"]')),
        siteName: document.getElementById('site-name'),
        companyName: document.getElementById('company-name'),
        siteDesc: document.getElementById('site-desc'),
        contactEmail: document.getElementById('contact-email'),
        contactPhone: document.getElementById('contact-phone'),
        contactAddress: document.getElementById('contact-address'),
        additionalRequests: document.getElementById('additional-requests'),
        mainColorPicker: document.getElementById('main-color-picker'),
        mainColorText: document.getElementById('main-color-text'),
        subColorPicker: document.getElementById('sub-color-picker'),
        subColorText: document.getElementById('sub-color-text')
    };

    const sections = form.querySelectorAll(':scope > section');
    const layoutSection = sections[2];
    const infoSection = sections[3];
    const styleSection = sections[4];

    const layoutButtons = layoutSection ? Array.from(layoutSection.querySelectorAll('button[type="button"]')) : [];
    const headerStyleButtons = layoutButtons.slice(0, 3);
    const contentDisplayButtons = layoutButtons.slice(3, 5);
    const sidebarCheckbox = layoutSection ? layoutSection.querySelector('input[type="checkbox"]') : null;
    const gridRange = layoutSection ? layoutSection.querySelector('input[type="range"]') : null;
    const gridRangeValue = layoutSection ? layoutSection.querySelector('label span') : null;
    const gridRangeDescription = gridRange ? gridRange.closest('div').parentElement.querySelector('.mt-3') : null;

    const socialInputs = infoSection ? Array.from(infoSection.querySelectorAll('input[type="url"]')) : [];
    const styleButtons = styleSection ? Array.from(styleSection.querySelectorAll('button[type="button"]')) : [];
    const fontButtons = styleButtons.slice(0, 4);
    const buttonStyleButtons = styleButtons.slice(4, 7);
    const darkModeCheckbox = styleSection ? styleSection.querySelector('input[type="checkbox"]') : null;

    const headerStyleOptions = ['classic', 'centered', 'minimal'];
    const contentDisplayOptions = ['grid', 'list'];
    const fontOptions = [
        "'Inter', sans-serif",
        "'Roboto', sans-serif",
        "'Poppins', sans-serif",
        "'Playfair Display', serif"
    ];
    const buttonRadiusOptions = ['0.5rem', '0', '9999px'];

    hydrateControlsFromState();
    bindAllControls();
    saveState();
    verifyControlCoverage();

    function bindAllControls() {
        fields.typeButtons.forEach(button => {
            button.addEventListener('click', () => {
                state.selectedType = button.dataset.value || button.innerText.trim();
                state.seed = Date.now();
                setActiveButton(fields.typeButtons, button);
                saveState();
            });
        });

        fields.componentCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                state.components = fields.componentCheckboxes
                    .filter(input => input.checked)
                    .map(input => input.value);
                saveState();
            });
        });

        bindInput(fields.siteName, 'siteName');
        bindInput(fields.companyName, 'companyName');
        bindInput(fields.siteDesc, 'siteDesc');
        bindInput(fields.contactEmail, 'contactEmail');
        bindInput(fields.contactPhone, 'contactPhone');
        bindInput(fields.contactAddress, 'contactAddress');
        bindInput(fields.additionalRequests, 'additionalRequests');

        ['facebook', 'x', 'instagram', 'linkedin'].forEach((key, index) => {
            const input = socialInputs[index];
            if (!input) return;
            input.addEventListener('input', () => {
                state.socials[key] = input.value.trim();
                saveState();
            });
        });

        headerStyleButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                state.headerStyle = headerStyleOptions[index] || 'classic';
                setActiveButton(headerStyleButtons, button);
                saveState();
            });
        });

        contentDisplayButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                state.contentDisplay = contentDisplayOptions[index] || 'grid';
                setActiveButton(contentDisplayButtons, button);
                saveState();
            });
        });

        if (sidebarCheckbox) {
            sidebarCheckbox.addEventListener('change', () => {
                state.sidebarEnabled = sidebarCheckbox.checked;
                saveState();
            });
        }

        if (gridRange) {
            gridRange.addEventListener('input', () => {
                state.gridColumns = Number(gridRange.value);
                updateGridRangeLabel();
                saveState();
            });
        }

        bindColorPair(fields.mainColorPicker, fields.mainColorText, 'mainColor');
        bindColorPair(fields.subColorPicker, fields.subColorText, 'subColor');

        fontButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                state.fontFamily = fontOptions[index] || fontOptions[0];
                setActiveButton(fontButtons, button);
                saveState();
            });
        });

        buttonStyleButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                state.buttonRadius = buttonRadiusOptions[index] || buttonRadiusOptions[0];
                setActiveButton(buttonStyleButtons, button);
                saveState();
            });
        });

        if (darkModeCheckbox) {
            darkModeCheckbox.addEventListener('change', () => {
                state.darkMode = darkModeCheckbox.checked;
                saveState();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                state = clone(defaults);
                state.seed = Date.now();
                localStorage.removeItem(STATE_KEY);
                hydrateControlsFromState();
                saveState();
            });
        }

        if (submitBtn) submitBtn.addEventListener('click', startPreviewGeneration);
        if (generateBtn) generateBtn.addEventListener('click', startPreviewGeneration);
        form.addEventListener('submit', startPreviewGeneration);
    }

    function bindInput(input, stateKey) {
        if (!input) return;
        input.addEventListener('input', () => {
            state[stateKey] = input.value;
            saveState();
        });
    }

    function bindColorPair(picker, text, stateKey) {
        if (!picker || !text) return;

        const applyColor = value => {
            if (!isValidHexColor(value)) return;
            picker.value = value;
            text.value = value;
            state[stateKey] = value;
            saveState();
        };

        picker.addEventListener('input', event => applyColor(event.target.value));
        text.addEventListener('input', event => {
            const value = event.target.value.trim();
            text.value = value;
            if (isValidHexColor(value)) applyColor(value);
        });
    }

    async function startPreviewGeneration(event) {
        event.preventDefault();
        state.seed = Date.now() + Math.floor(Math.random() * 100000);
        saveState();

        const generationId = `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        activeGenerationId = generationId;

        writePreviewJob({
            id: generationId,
            status: 'loading',
            progress: 4,
            message: progressMessages[0],
            state,
            html: '',
            error: '',
            updatedAt: Date.now()
        });

        const previewWindow = window.open(`${PREVIEW_URL}?job=${encodeURIComponent(generationId)}`, '_blank');
        if (!previewWindow) {
            alert('미리보기 페이지가 새 탭에서 열릴 수 있도록 팝업을 허용해 주세요.');
        }

        const triggerButton = event.currentTarget && event.currentTarget.tagName === 'BUTTON'
            ? event.currentTarget
            : submitBtn;
        const originalText = triggerButton ? triggerButton.innerText : '';
        setGeneratingButton(triggerButton, true);

        const stopProgress = startProgressSimulation(generationId);

        try {
            if (!window.AI_CONFIG || !window.AI_CONFIG.GEMINI_API_KEY) {
                throw new Error('AI API key is not configured.');
            }

            const generatedHTML = await requestGeneratedWebsite();
            stopProgress();
            writePreviewJob({
                id: generationId,
                status: 'complete',
                progress: 100,
                message: 'Website ready.',
                state,
                html: generatedHTML,
                error: '',
                updatedAt: Date.now()
            });
        } catch (error) {
            stopProgress();
            console.error(error);
            writePreviewJob({
                id: generationId,
                status: 'failed',
                progress: 100,
                message: '웹사이트 생성에 실패했습니다.',
                state,
                html: '',
                error: error.message || '알 수 없는 생성 오류가 발생했습니다.',
                updatedAt: Date.now()
            });
        } finally {
            setGeneratingButton(triggerButton, false, originalText);
        }
    }

    function startProgressSimulation(generationId) {
        let step = 0;
        const timer = window.setInterval(() => {
            if (activeGenerationId !== generationId) {
                window.clearInterval(timer);
                return;
            }

            step += 1;
            const progress = Math.min(92, 8 + step * 9);
            const message = progressMessages[Math.min(progressMessages.length - 1, Math.floor(progress / 18))];
            const currentJob = readPreviewJob();
            if (!currentJob || currentJob.id !== generationId || currentJob.status !== 'loading') return;

            writePreviewJob({
                ...currentJob,
                progress,
                message,
                updatedAt: Date.now()
            });
        }, 900);

        return () => window.clearInterval(timer);
    }

    async function requestGeneratedWebsite() {
        const API_KEY = window.AI_CONFIG.GEMINI_API_KEY;
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;
        //gemini-3.1-flash-lite
        //https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?
        //https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: buildGeminiPrompt() }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    topP: 0.9,
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n') || '';
        const html = cleanGeneratedHTML(text);
        if (!html) throw new Error('AI response did not include usable HTML.');
        return html;
    }

   function buildGeminiPrompt() {
    const componentLabels = fields.componentCheckboxes
        .filter(input => state.components.includes(input.value))
        .map(input => `${input.value}: ${input.closest('label')?.querySelector('span')?.innerText.trim() || input.value}`);

    const isBothWhite = state.mainColor.toLowerCase() === '#ffffff' && state.subColor.toLowerCase() === '#ffffff';
    const mainColorValue = isBothWhite ? "RANDOM_PALETTE (Choose a vibrant, modern brand color palette dynamically, DO NOT use white)" : state.mainColor;
    const subColorValue = isBothWhite ? "RANDOM_PALETTE (Choose a matching secondary/accent color dynamically)" : state.subColor;

    return `당신은 세계 최고 수준의 UI/UX 디자이너이자 프론트엔드 개발자입니다.
사용자 데이터를 기반으로 하나의 완전한 HTML 웹사이트를 생성하세요.

[입력 정보]
- 웹사이트 타입: ${state.selectedType}
- 사이트 이름: ${state.siteName || '나의 멋진 사이트'}
- 브랜드: ${state.companyName || '회사 또는 브랜드 이름'}
- 설명: ${state.siteDesc || '웹사이트 설명을 입력하면 이 영역에 반영됩니다'}
- 연락처: 이메일(${state.contactEmail}) / 전화(${state.contactPhone}) / 주소(${state.contactAddress})
- 소셜: ${JSON.stringify(state.socials)}
- 디자인: 메인컬러(${mainColorValue}), 서브컬러(${subColorValue}), 폰트(${state.fontFamily}), 버튼 스타일(${state.buttonRadius}), 다크모드(${state.darkMode})
- 레이아웃: 헤더(${state.headerStyle}), 콘텐츠(${state.contentDisplay}), 그리드(${state.gridColumns}), 사이드바(${state.sidebarEnabled})
- 추가 요청: ${state.additionalRequests || '없음'}
- 시드: ${state.seed}

[요구사항]
1. 단일 HTML 파일로 생성 (<!DOCTYPE html> ~ </html>)
2. Tailwind CSS CDN 반드시 포함
3. 모바일·태블릿·데스크톱 완전 반응형
4. 실제 디자이너가 제작한 상용 웹사이트처럼 보여야 함
5. 섹션은 4~7개로 유동적으로 구성
6. 각 섹션은 의미 있는 실제 콘텐츠를 포함 (더미 금지)
7. 기본 랜딩페이지 반복 구조를 피하고 구조를 다양하게 설계

[인터랙션]
필요한 경우에만 JavaScript 사용:
- 모바일 메뉴
- 탭 UI
- 아코디언 FAQ
- 부드러운 스크롤

[출력 규칙]
- 설명, 주석, Markdown, 코드블록 금지
- HTML만 출력`;
}

    function hydrateControlsFromState() {
        setValue(fields.siteName, state.siteName);
        setValue(fields.companyName, state.companyName);
        setValue(fields.siteDesc, state.siteDesc);
        setValue(fields.contactEmail, state.contactEmail);
        setValue(fields.contactPhone, state.contactPhone);
        setValue(fields.contactAddress, state.contactAddress);
        setValue(fields.additionalRequests, state.additionalRequests);

        fields.componentCheckboxes.forEach(input => {
            input.checked = state.components.includes(input.value);
        });

        ['facebook', 'x', 'instagram', 'linkedin'].forEach((key, index) => {
            setValue(socialInputs[index], state.socials[key]);
        });

        if (fields.mainColorPicker) fields.mainColorPicker.value = state.mainColor;
        if (fields.mainColorText) fields.mainColorText.value = state.mainColor;
        if (fields.subColorPicker) fields.subColorPicker.value = state.subColor;
        if (fields.subColorText) fields.subColorText.value = state.subColor;

        if (sidebarCheckbox) sidebarCheckbox.checked = state.sidebarEnabled;
        if (gridRange) gridRange.value = state.gridColumns;
        if (darkModeCheckbox) darkModeCheckbox.checked = state.darkMode;

        setActiveButtonByValue(fields.typeButtons, state.selectedType, button => button.dataset.value);
        setActiveButton(headerStyleButtons, headerStyleButtons[headerStyleOptions.indexOf(state.headerStyle)] || headerStyleButtons[0]);
        setActiveButton(contentDisplayButtons, contentDisplayButtons[contentDisplayOptions.indexOf(state.contentDisplay)] || contentDisplayButtons[0]);
        setActiveButton(fontButtons, fontButtons[fontOptions.indexOf(state.fontFamily)] || fontButtons[0]);
        setActiveButton(buttonStyleButtons, buttonStyleButtons[buttonRadiusOptions.indexOf(state.buttonRadius)] || buttonStyleButtons[0]);
        updateGridRangeLabel();
    }

    function updateGridRangeLabel() {
        if (gridRangeValue) gridRangeValue.innerText = String(state.gridColumns);
        if (gridRangeDescription) {
            gridRangeDescription.innerText = `${state.gridColumns}열 - 그리드 뷰 선택 시 콘텐츠 영역에 적용됩니다.`;
        }
    }

    function setGeneratingButton(button, isGenerating, originalText = '') {
        if (!button) return;
        button.disabled = isGenerating;
        button.innerText = isGenerating ? '미리보기 열기 및 생성 중...' : originalText;
    }

    function setActiveButton(buttons, activeButton) {
        buttons.forEach(button => {
            button.classList.remove('border-indigo-600', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-900');
            button.classList.add('border-slate-200');
        });

        if (!activeButton) return;

        activeButton.classList.remove('border-slate-200');
        activeButton.classList.add('border-indigo-600', 'bg-indigo-50', 'text-indigo-900');
    }

    function setActiveButtonByValue(buttons, value, getValue) {
        const activeButton = buttons.find(button => getValue(button) === value) || buttons[buttons.length - 1];
        setActiveButton(buttons, activeButton);
    }

    function setValue(input, value) {
        if (input) input.value = value || '';
    }

    function saveState() {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    }

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STATE_KEY));
            return mergeState(defaults, saved || {});
        } catch {
            return clone(defaults);
        }
    }

    function mergeState(base, saved) {
        return {
            ...clone(base),
            ...saved,
            socials: {
                ...base.socials,
                ...(saved.socials || {})
            },
            seed: saved.seed || Date.now()
        };
    }

    function writePreviewJob(job) {
        localStorage.setItem(PREVIEW_JOB_KEY, JSON.stringify(job));
        window.dispatchEvent(new StorageEvent('storage', {
            key: PREVIEW_JOB_KEY,
            newValue: JSON.stringify(job)
        }));
    }

    function readPreviewJob() {
        try {
            return JSON.parse(localStorage.getItem(PREVIEW_JOB_KEY));
        } catch {
            return null;
        }
    }

    function cleanGeneratedHTML(text) {
        return text
            .replace(/```html/gi, '')
            .replace(/```/g, '')
            .trim();
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function isValidHexColor(value) {
        return /^#[0-9a-fA-F]{6}$/.test(value);
    }

    function verifyControlCoverage() {
        const allControls = Array.from(form.querySelectorAll('input, textarea, select, button'));
        const knownControls = new Set([
            ...fields.typeButtons,
            ...fields.componentCheckboxes,
            fields.siteName,
            fields.companyName,
            fields.siteDesc,
            fields.contactEmail,
            fields.contactPhone,
            fields.contactAddress,
            fields.additionalRequests,
            fields.mainColorPicker,
            fields.mainColorText,
            fields.subColorPicker,
            fields.subColorText,
            ...socialInputs,
            ...headerStyleButtons,
            ...contentDisplayButtons,
            sidebarCheckbox,
            gridRange,
            ...fontButtons,
            ...buttonStyleButtons,
            darkModeCheckbox,
            resetBtn,
            submitBtn,
            generateBtn
        ].filter(Boolean));

        const missing = allControls.filter(control => !knownControls.has(control));
        if (missing.length) {
            console.warn('Builder controls without explicit handlers:', missing);
        }
    }
}
