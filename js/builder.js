if (!window.AI_CONFIG || !window.AI_CONFIG.GEMINI_API_KEY) {
    console.error("AI_CONFIG is not properly set. AI generation will be disabled.");
}

initAdvancedBuilder();

function initAdvancedBuilder() {
    const form = document.querySelector('form');
    const submitBtn = document.getElementById('submit-builder-btn');
    const generateBtn = document.getElementById('generate-btn');
    const previewFrame = document.getElementById('preview-frame');
    const bottomPanel = document.querySelector('.sticky.bottom-4');
    const bottomButtons = bottomPanel ? Array.from(bottomPanel.querySelectorAll('button[type="button"]')) : [];
    const resetBtn = bottomButtons[0] || null;
    const saveBtn = bottomButtons[1] || null;

     if (!form || !previewFrame) {
        console.error("Builder form or preview frame was not found.");
        return;
    }

    const STORAGE_KEY = 'advanced-builder-state';
    const LAST_PREVIEW_KEY = 'advanced-builder-last-preview-html';
    const SELECTED_OUTLINE = '0 0 0 3px rgba(99, 102, 241, 0.55)';

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
        mainColor: '#6366f1',
        subColor: '#8b5cf6',
        fontFamily: "'Inter', sans-serif",
        buttonRadius: '0.5rem',
        darkMode: false,
        additionalRequests: '',
        selectedElementId: 'page-root',
        elementStyles: {}
    };

    let state = loadState();
    let selectedPreviewElement = null;

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

    const layoutSection = form.querySelectorAll(':scope > section')[2];
    const infoSection = form.querySelectorAll(':scope > section')[3];
    const styleSection = form.querySelectorAll(':scope > section')[4];

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
    renderLivePreview();
    verifyControlCoverage();

    function bindAllControls() {
        fields.typeButtons.forEach(button => {
            button.addEventListener('click', () => {
                state.selectedType = button.dataset.value || button.innerText.trim();
                state.seed = Date.now();
                setActiveButton(fields.typeButtons, button);
                renderLivePreview();
            });
        });

        fields.componentCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                state.components = fields.componentCheckboxes
                    .filter(input => input.checked)
                    .map(input => input.value);
                renderLivePreview();
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
                renderLivePreview();
            });
        });

        headerStyleButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                state.headerStyle = headerStyleOptions[index] || 'classic';
                setActiveButton(headerStyleButtons, button);
                renderLivePreview();
            });
        });

        contentDisplayButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                state.contentDisplay = contentDisplayOptions[index] || 'grid';
                setActiveButton(contentDisplayButtons, button);
                renderLivePreview();
            });
        });

        if (sidebarCheckbox) {
            sidebarCheckbox.addEventListener('change', () => {
                state.sidebarEnabled = sidebarCheckbox.checked;
                renderLivePreview();
            });
        }

        if (gridRange) {
            gridRange.addEventListener('input', () => {
                state.gridColumns = Number(gridRange.value);
                updateGridRangeLabel();
                renderLivePreview();
            });
        }

        bindColorPair(fields.mainColorPicker, fields.mainColorText, 'mainColor', 'backgroundColor');
        bindColorPair(fields.subColorPicker, fields.subColorText, 'subColor', 'color');

        fontButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const fontFamily = fontOptions[index] || fontOptions[0];
                state.fontFamily = fontFamily;
                setActiveButton(fontButtons, button);
                applySelectedStyle('fontFamily', fontFamily);
            });
        });

        buttonStyleButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const radius = buttonRadiusOptions[index] || buttonRadiusOptions[0];
                state.buttonRadius = radius;
                setActiveButton(buttonStyleButtons, button);
                applySelectedStyle('borderRadius', radius);
            });
        });

        if (darkModeCheckbox) {
            darkModeCheckbox.addEventListener('change', () => {
                state.darkMode = darkModeCheckbox.checked;
                applyDarkModeToSelected(state.darkMode);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                state = structuredCloneSafe(defaults);
                localStorage.removeItem(STORAGE_KEY);
                hydrateControlsFromState();
                renderLivePreview();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                alert('프로젝트 설정이 저장되었습니다.');
            });
        }
        if (submitBtn) {
            submitBtn.addEventListener('click', handleGenerateRequest);
        }

        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerateRequest);
        }

        form.addEventListener('submit', handleGenerateRequest);
    }

    function bindInput(input, stateKey) {
        if (!input) return;
        input.addEventListener('input', () => {
            state[stateKey] = input.value;
            renderLivePreview();
        });
    }

    function bindColorPair(picker, text, stateKey, cssProperty) {
        if (!picker || !text) return;

        const updateColor = value => {
            if (!isValidHexColor(value)) return;
            picker.value = value;
            text.value = value;
            state[stateKey] = value;
            applySelectedStyle(cssProperty, value);
        };

        picker.addEventListener('input', event => updateColor(event.target.value));
        text.addEventListener('input', event => {
            const value = event.target.value.trim();
            text.value = value;
            if (isValidHexColor(value)) updateColor(value);
        });
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

    function renderLivePreview(options = {}) {
        const selectedId = options.keepSelection ? state.selectedElementId : state.selectedElementId || 'page-root';
        const previewHTML = buildPreviewHTML();
        previewFrame.addEventListener('load', () => {
            attachPreviewSelectionHandlers();
            selectPreviewElement(selectedId);
        }, { once: true });

        previewFrame.srcdoc = previewHTML;
        saveLatestPreviewHTML(previewHTML);
    }

    function buildPreviewHTML() {
        const pageBackground = '#f8fafc';
        const pageText = '#0f172a';
        const cardBackground = '#ffffff';
        const mutedText = '#475569';
        const siteName = escapeHtml(state.siteName || '나의 멋진 사이트');
        const companyName = escapeHtml(state.companyName || '회사 또는 브랜드 이름');
        const siteDesc = escapeHtml(state.siteDesc || '웹사이트 설명을 입력하면 이 영역에 실시간으로 반영됩니다.');
        const selectedComponents = state.components.length ? state.components : ['navigation', 'product-card', 'contact-form', 'footer'];
        const contentCards = selectedComponents.map(component => buildComponentCard(component, cardBackground, mutedText)).join('');
        const sidebar = state.sidebarEnabled ? buildSidebar(cardBackground, mutedText) : '';
        const contentLayout = state.sidebarEnabled ? 'grid-template-columns: 240px minmax(0, 1fr);' : 'grid-template-columns: minmax(0, 1fr);';
        const gridStyle = state.contentDisplay === 'grid'
            ? `display: grid; grid-template-columns: repeat(${state.gridColumns}, minmax(0, 1fr)); gap: 16px;`
            : 'display: flex; flex-direction: column; gap: 16px;';

        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteName}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            background: ${pageBackground};
            color: ${pageText};
            font-family: ${state.fontFamily};
        }
        a { color: inherit; text-decoration: none; }
        .builder-selectable {
            cursor: pointer;
            transition: box-shadow 120ms ease, transform 120ms ease;
        }
        .builder-selectable:hover {
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.24);
        }
        .builder-selected {
            box-shadow: ${SELECTED_OUTLINE} !important;
        }
        @media (max-width: 760px) {
            .preview-shell { padding: 18px !important; }
            .content-wrap { grid-template-columns: 1fr !important; }
            .content-grid { grid-template-columns: 1fr !important; }
            header { flex-direction: column; align-items: flex-start !important; }
        }
        </style>
</head>
<body>
    <main data-builder-id="page-root" class="preview-shell builder-selectable" style="min-height: 100vh; padding: 32px; background: ${pageBackground}; color: ${pageText}; ${styleFor('page-root')}">
        ${buildHeader(siteName, companyName, mutedText)}
        <section data-builder-id="hero" class="builder-selectable" style="margin: 24px 0; padding: 42px; border-radius: 18px; background: linear-gradient(135deg, ${state.mainColor}, ${state.subColor}); color: white; ${styleFor('hero')}">
            <p style="margin: 0 0 10px; opacity: 0.9;">${escapeHtml(typeLabel(state.selectedType))}</p>
            <h1 style="margin: 0 0 14px; font-size: clamp(32px, 6vw, 56px); line-height: 1.02;">${siteName}</h1>
            <p style="max-width: 720px; margin: 0 0 24px; font-size: 18px; opacity: 0.92;">${siteDesc}</p>
            <button data-builder-id="primary-button" class="builder-selectable" style="border: 0; padding: 13px 22px; border-radius: ${state.buttonRadius}; background: white; color: ${state.mainColor}; font: inherit; font-weight: 700; ${styleFor('primary-button')}">시작하기</button>
        </section>
        <section class="content-wrap" style="display: grid; ${contentLayout} gap: 20px; align-items: start;">
            ${sidebar}
            <div data-builder-id="content-grid" class="content-grid builder-selectable" style="${gridStyle} ${styleFor('content-grid')}">
                ${contentCards}
            </div>
        </section>
        ${buildContactFooter(cardBackground, mutedText)}
    </main>
</body>
</html>`;
    }
    function buildHeader(siteName, companyName, mutedText) {
        const shared = `data-builder-id="site-header" class="builder-selectable" style="display: flex; gap: 18px; padding: 18px 20px; border-radius: 14px; background: rgba(255,255,255,0.86); align-items: center; ${styleFor('site-header')}"`;
        const logo = `<div data-builder-id="site-logo" class="builder-selectable" style="width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: ${state.mainColor}; color: white; font-weight: 800; ${styleFor('site-logo')}">W</div>`;
        const nav = `<nav data-builder-id="site-nav" class="builder-selectable" style="display: flex; gap: 16px; color: ${mutedText}; font-size: 14px; ${styleFor('site-nav')}"><a href="#">Home</a><a href="#">Work</a><a href="#">Contact</a></nav>`;
        const brand = `<div><strong>${siteName}</strong><div style="font-size: 13px; color: ${mutedText};">${companyName}</div></div>`;

         if (state.headerStyle === 'centered') {
            return `<header ${shared.replace('align-items: center;', 'align-items: center; flex-direction: column; text-align: center;')}>${logo}${brand}${nav}</header>`;
        }
        if (state.headerStyle === 'minimal') {
            return `<header ${shared.replace('background: rgba(255,255,255,0.86);', 'background: transparent;').replace('padding: 18px 20px;', 'padding: 10px 0;')}>${logo}<strong>${siteName}</strong></header>`;
        }
                return `<header ${shared}>${logo}${brand}<div style="flex: 1;"></div>${nav}</header>`;
    }

    function buildComponentCard(component, cardBackground, mutedText) {
        const label = escapeHtml(componentLabel(component));
        const id = `component-${component}`;
        return `<article data-builder-id="${id}" class="builder-selectable" style="min-height: 128px; padding: 22px; border: 1px solid rgba(148, 163, 184, 0.35); border-radius: 14px; background: ${cardBackground}; ${styleFor(id)}">
            <div style="width: 38px; height: 38px; border-radius: ${state.buttonRadius}; background: ${state.mainColor}; opacity: 0.95; margin-bottom: 16px;"></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">${label}</h3>
            <p style="margin: 0; color: ${mutedText}; line-height: 1.55;">선택한 컴포넌트가 이 영역에 배치됩니다.</p>
        </article>`;
    }

    function buildSidebar(cardBackground, mutedText) {
        return `<aside data-builder-id="sidebar" class="builder-selectable" style="padding: 18px; border-radius: 14px; background: ${cardBackground}; border: 1px solid rgba(148, 163, 184, 0.35); ${styleFor('sidebar')}">
            <strong>Sidebar</strong>
            <p style="color: ${mutedText}; line-height: 1.5;">메뉴, 필터, 카테고리 또는 추가 정보를 표시합니다.</p>
        </aside>`;
    }

    function buildContactFooter(cardBackground, mutedText) {
        const contactLines = [
            state.contactEmail && `Email: ${escapeHtml(state.contactEmail)}`,
            state.contactPhone && `Phone: ${escapeHtml(state.contactPhone)}`,
            state.contactAddress && `Address: ${escapeHtml(state.contactAddress)}`
        ].filter(Boolean);

        const socialLines = Object.entries(state.socials)
            .filter(([, url]) => url)
            .map(([key, url]) => `<a href="${escapeAttribute(url)}" style="color: ${state.mainColor};">${escapeHtml(key)}</a>`)
            .join(' · ');

        return `<footer data-builder-id="site-footer" class="builder-selectable" style="margin-top: 24px; padding: 22px; border-radius: 14px; background: ${cardBackground}; color: ${mutedText}; border: 1px solid rgba(148, 163, 184, 0.35); ${styleFor('site-footer')}">
            <strong style="color: inherit;">${escapeHtml(state.companyName || state.siteName || 'Website Builder')}</strong>
            <div style="margin-top: 10px; line-height: 1.6;">${contactLines.join('<br>') || '연락처 정보가 여기에 표시됩니다.'}</div>
            <div style="margin-top: 10px;">${socialLines || '소셜 미디어 링크가 여기에 표시됩니다.'}</div>
        </footer>`;
    }

    function attachPreviewSelectionHandlers() {
        const doc = previewFrame.contentDocument;
        if (!doc) return;

        doc.querySelectorAll('[data-builder-id]').forEach(element => {
            element.classList.add('builder-selectable');
            element.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                selectPreviewElement(element.dataset.builderId);
            });
        });
    }

    function selectPreviewElement(id) {
        const doc = previewFrame.contentDocument;
        if (!doc) return;

        if (selectedPreviewElement) {
            selectedPreviewElement.classList.remove('builder-selected');
        }

        selectedPreviewElement = doc.querySelector(`[data-builder-id="${cssEscape(id)}"]`) || doc.querySelector('[data-builder-id="page-root"]');
        if (!selectedPreviewElement) return;

        state.selectedElementId = selectedPreviewElement.dataset.builderId;
        selectedPreviewElement.classList.add('builder-selected');
        syncStyleControlsFromSelected();
    }

    function syncStyleControlsFromSelected() {
        if (!selectedPreviewElement) return;

        const computed = selectedPreviewElement.ownerDocument.defaultView.getComputedStyle(selectedPreviewElement);
        const background = rgbToHex(computed.backgroundColor);
        const color = rgbToHex(computed.color);
        const radius = normalizeRadius(computed.borderRadius);
        const fontFamily = normalizeFontFamily(computed.fontFamily);
        if (background) {
            setValue(fields.mainColorPicker, background);
            setValue(fields.mainColorText, background);
        }
        if (color) {
            setValue(fields.subColorPicker, color);
            setValue(fields.subColorText, color);
        }

        setActiveButton(fontButtons, fontButtons[fontOptions.indexOf(fontFamily)] || null);

        setActiveButton(buttonStyleButtons, buttonStyleButtons[buttonRadiusOptions.indexOf(radius)] || null);
    }

    async function requestGeneratedWebsite() {
        const errors = [];

        for (const model of API_MODELS) {
            try {
                return await requestGeneratedWebsiteWithModel(model);
            } catch (error) {
                errors.push(`${model}: ${error.message}`);

                // A 404 usually means the model is not available for this API
                // key/version. Try the next candidate instead of failing fast.
                if (!/404|not found|not supported/i.test(error.message)) {
                    throw error;
                }
            }
        }

        throw new Error(`No configured Gemini model was available. ${errors.join(' | ')}`);
    }

    function applySelectedStyle(property, value) {
        const id = state.selectedElementId || 'page-root';
        state.elementStyles[id] = state.elementStyles[id] || {};
        state.elementStyles[id][property] = value;

        if (selectedPreviewElement) {
            selectedPreviewElement.style[property] = value;
        }
    }
  function applyDarkModeToSelected(enabled) {
        const background = enabled ? '#0f172a' : '#ffffff';
        const color = enabled ? '#f8fafc' : '#0f172a';
        applySelectedStyle('backgroundColor', background);
        applySelectedStyle('color', color);
        setValue(fields.mainColorPicker, background);
        setValue(fields.mainColorText, background);
        setValue(fields.subColorPicker, color);
        setValue(fields.subColorText, color);
    }

    function styleFor(id) {
        const styles = state.elementStyles[id] || {};
        return Object.entries(styles)
            .map(([property, value]) => `${camelToKebab(property)}: ${value};`)
            .join(' ');
    }

    async function handleGenerateRequest(event) {
        event.preventDefault();

        if (!window.AI_CONFIG || !window.AI_CONFIG.GEMINI_API_KEY) {
            alert('AI API 키가 설정되지 않았습니다. 실시간 미리보기는 계속 사용할 수 있습니다.');
            return;
        }

        const triggerButton = event.currentTarget && event.currentTarget.tagName === 'BUTTON'
            ? event.currentTarget
            : submitBtn;
        const originalText = triggerButton ? triggerButton.innerText : '';

        if (triggerButton) {
            triggerButton.innerText = '설정을 분석하여 사이트를 제작 중...';
            triggerButton.disabled = true;
        }

        const API_KEY = window.AI_CONFIG.GEMINI_API_KEY;
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: buildGeminiPrompt() }]
                    }]
                })
            });

            if (!response.ok) throw new Error('API 요청 실패: ' + response.statusText);

            const data = await response.json();
            let generatedHTML = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            generatedHTML = generatedHTML.replace(/```html/g, '').replace(/```/g, '').trim();

            if (!generatedHTML) throw new Error('AI 응답에 HTML 코드가 없습니다.');

            previewFrame.srcdoc = generatedHTML;
            saveLatestPreviewHTML(generatedHTML);
            previewFrame.addEventListener('load', () => {
                // Generated pages do not know about the builder, so every
                // visible body element is registered as a selectable element.
                registerGeneratedPageElements();
                selectPreviewElement('generated-body');
            }, { once: true });
        } catch (error) {
            console.error(error);
            alert('사이트 생성 중 오류가 발생했습니다. 실시간 미리보기는 계속 사용할 수 있습니다.');
        } finally {
            if (triggerButton) {
                triggerButton.innerText = originalText || '사이트 미리보기';
                triggerButton.disabled = false;
            }
        }
    }
    function registerGeneratedPageElements() {
        const doc = previewFrame.contentDocument;
        if (!doc || !doc.body) return;

        doc.body.dataset.builderId = 'generated-body';
        doc.body.classList.add('builder-selectable');

        const style = doc.createElement('style');
        style.textContent = `
            .builder-selectable { cursor: pointer; transition: box-shadow 120ms ease; }
            .builder-selectable:hover { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.24); }
            .builder-selected { box-shadow: ${SELECTED_OUTLINE} !important; }
        `;
        doc.head.appendChild(style);

        Array.from(doc.body.querySelectorAll('header, nav, main, section, article, aside, footer, div, button, a, h1, h2, h3, p, img, form'))
            .filter(element => element.offsetParent !== null || element === doc.body)
            .forEach((element, index) => {
                if (!element.dataset.builderId) element.dataset.builderId = `generated-${index}`;
                element.classList.add('builder-selectable');
            });

        attachPreviewSelectionHandlers();
    }
    
    function buildGeminiPrompt() {
        const selectedComponentLabels = fields.componentCheckboxes
            .filter(input => state.components.includes(input.value))
            .map(input => `${input.value} (${input.closest('label')?.querySelector('span')?.innerText.trim() || input.value})`);

        return `당신은 세계 최고의 웹 퍼블리셔입니다. 사용자가 선택한 모든 설정을 바탕으로 완성도 높은 웹사이트를 구현하세요.

[1. 웹사이트 기본 정보]
- 웹사이트 유형: ${state.selectedType}
- 웹사이트 이름: ${state.siteName || '나의 멋진 사이트'}
${state.companyName ? `- 회사명/브랜드명: ${state.companyName}` : ''}
- 서비스/사이트 설명: ${state.siteDesc || '이 사이트는 AI 웹사이트 빌더로 만들어졌습니다.'}

[2. 연락처, 푸터, 소셜 정보]
${state.contactEmail ? `- 이메일: ${state.contactEmail}` : ''}
${state.contactPhone ? `- 전화번호: ${state.contactPhone}` : ''}
${state.contactAddress ? `- 주소: ${state.contactAddress}` : ''}
${state.socials.facebook ? `- Facebook: ${state.socials.facebook}` : ''}
${state.socials.x ? `- X/Twitter: ${state.socials.x}` : ''}
${state.socials.instagram ? `- Instagram: ${state.socials.instagram}` : ''}
${state.socials.linkedin ? `- LinkedIn: ${state.socials.linkedin}` : ''}

[3. 레이아웃 및 기능 요구사항]
- 반드시 포함해야 할 컴포넌트 목록: ${selectedComponentLabels.join(', ') || '기본 랜딩페이지 구성'}
- 헤더 스타일: ${state.headerStyle}
- 콘텐츠 표시 방식: ${state.contentDisplay}
- 사이드바 사용 여부: ${state.sidebarEnabled ? '사용' : '사용 안 함'}
- 그리드 열 개수: ${state.gridColumns}

[4. 스타일 요구사항]
- 메인 컬러: ${state.mainColor}
- 서브 컬러: ${state.subColor}
- 기본 폰트: ${state.fontFamily}
- 버튼 모서리 스타일: ${state.buttonRadius}
- 다크 모드: ${state.darkMode ? '활성화' : '비활성화'}
- 선택 요소별 인라인 스타일 오버라이드: ${JSON.stringify(state.elementStyles)}

[5. 사용자의 추가 요청사항]
${state.additionalRequests || 'None'}

[제약조건 - STRICT]
- Tailwind CSS를 사용하여 스타일링할 것이므로, HTML <head> 내에 반드시 다음 CDN 스크립트를 포함하세요: <script src="https://cdn.tailwindcss.com"></script>
- 위의 모든 입력값, 체크박스, 레이아웃, 색상, 폰트, 버튼 스타일, 다크 모드, 소셜 링크, 연락처 정보를 결과물에 반영하세요.
- 결과물은 다른 설명 없이 오직 실행 가능한 하나의 HTML 파일 코드(<!DOCTYPE html>로 시작해서 </html>로 끝남) 형태로만 반환하세요.
- 마크다운 (\`\`\`html) 기호는 절대 붙이지 마세요.`;
    }

    function updateGridRangeLabel() {
        if (gridRangeValue) gridRangeValue.innerText = String(state.gridColumns);
        if (gridRangeDescription) {
             gridRangeDescription.innerText = `${state.gridColumns}열 - 그리드 뷰 선택 시 콘텐츠 영역에 적용됩니다.`;
        }
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

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return mergeState(defaults, saved || {});
        } catch {
                  return structuredCloneSafe(defaults);
        }
    }

    // preview.html reads this value. The try/catch keeps live preview working
    // even in browsers or privacy modes that block localStorage.
    function saveLatestPreviewHTML(html) {
        try {
            localStorage.setItem(LAST_PREVIEW_KEY, html);
        } catch (error) {
            console.warn('Could not save latest preview HTML:', error);
        }
    }

    function mergeState(base, saved) {
        return {
            ...structuredCloneSafe(base),
            ...saved,
            socials: {
                ...base.socials,
                ...(saved.socials || {})
            },
            elementStyles: saved.elementStyles || {}
        };
        }

    function structuredCloneSafe(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function isValidHexColor(value) {
        return /^#[0-9a-fA-F]{6}$/.test(value);
    }

    function rgbToHex(value) {
        if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '';
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return isValidHexColor(value) ? value : '';
        return `#${[match[1], match[2], match[3]].map(part => Number(part).toString(16).padStart(2, '0')).join('')}`;
    }

    function normalizeRadius(radius) {
        const value = parseFloat(radius || '0');
        if (value === 0) return '0';
        if (value >= 999) return '9999px';
        return '0.5rem';
    }

    function normalizeFontFamily(fontFamily) {
        const lowered = (fontFamily || '').toLowerCase();
        if (lowered.includes('roboto')) return "'Roboto', sans-serif";
        if (lowered.includes('poppins')) return "'Poppins', sans-serif";
        if (lowered.includes('playfair')) return "'Playfair Display', serif";
        return "'Inter', sans-serif";
    }

    function camelToKebab(value) {
        return value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    }

    function cssEscape(value) {
        if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
        return String(value).replace(/"/g, '\\"');
    }

     function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function cleanGeneratedHTML(text) {
        return text
            .replace(/```html/gi, '')
            .replace(/```/g, '')
            .trim();
    }
    
    function typeLabel(type) {
        const labels = {
            'online-store': 'Online Store',
            'streaming-platform': 'Streaming Platform',
            blog: 'Blog',
            portfolio: 'Portfolio',
            business: 'Business Site',
            custom: 'Custom Site'
        };
        return labels[type] || type;
    }

    function componentLabel(component) {
        const labels = {
            navigation: 'Navigation Bar',
            search: 'Search Bar',
            'category-menu': 'Category Menu',
            filter: 'Filters',
            'product-card': 'Product Cards',
            'video-player': 'Video Player',
            comments: 'Comment Section',
            'contact-form': 'Contact Form',
            footer: 'Footer'
        };
        return labels[component] || component;
    }
    // Gemini occasionally returns a short note before/after the HTML or omits
    // the outer document tags. Normalize that output so preview.html always
    // receives a complete document instead of an ambiguous text fragment.
    function normalizeGeneratedHTML(text) {
        if (!text) return '';

        const doctypeIndex = text.search(/<!doctype html>/i);
        if (doctypeIndex >= 0) {
            text = text.slice(doctypeIndex);
        } else {
            const htmlIndex = text.search(/<html[\s>]/i);
            if (htmlIndex >= 0) text = text.slice(htmlIndex);
        }

        const htmlCloseIndex = text.toLowerCase().lastIndexOf('</html>');
        if (htmlCloseIndex >= 0) {
            text = text.slice(0, htmlCloseIndex + '</html>'.length);
        }

        if (!/<body[\s>]/i.test(text) && /<section|<main|<div|<nav|<header/i.test(text)) {
            text = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>${text}</body>
</html>`;
        }

        if (!/<html[\s>]/i.test(text) || !/<body[\s>]/i.test(text)) {
            return '';
        }

        return text;
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
            saveBtn,
            submitBtn,
            generateBtn
        ].filter(Boolean));

        const missing = allControls.filter(control => !knownControls.has(control));
        if (missing.length) {
            console.warn('Builder controls without explicit handlers:', missing);
        }
    }
}
