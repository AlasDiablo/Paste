import './style.css';
import lz from 'lz-string';

// eslint-disable-next-line no-undef
const editor = ace.edit('editor');

editor.setTheme('ace/theme/monokai');
editor.session.setMode('ace/mode/markdown');

// eslint-disable-next-line no-undef
const modes = ace.require('ace/ext/modelist');
const modeSelector = document.getElementById('mode');

let modeSelectorInnerHTML = '';

modes.modes.forEach((mode) => {
    if (mode.mode === 'ace/mode/markdown') modeSelectorInnerHTML += `<option value="${mode.mode}" selected>${mode.caption}</option>`;
    else modeSelectorInnerHTML += `<option value="${mode.mode}">${mode.caption}</option>`;
});

modeSelector.innerHTML = modeSelectorInnerHTML;

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

const data = params.d;
if (data !== null && data !== undefined) {
    try {
        const uncompressedData = lz.decompressFromEncodedURIComponent(data);
        const lines = uncompressedData.split('\n');
        const header = JSON.parse(lines.shift());
        editor.session.setMode(header.mode);
        editor.session.setValue(lines.join('\n'));
        modeSelector.value = header.mode;
        // eslint-disable-next-line no-empty
    } catch (ignored) {}
}

const saveToUrl = () => {
    const doc = editor.session.getDocument().getAllLines();
    let content = JSON.stringify({
        mode: editor.session.$modeId,
        lastEdit: new Date(),
    });
    while (doc.length > 0) {
        content += `\n${doc.shift()}`;
    }
    const compressedData = lz.compressToEncodedURIComponent(content);
    // eslint-disable-next-line no-restricted-globals
    history.pushState(content, 'AlasDiablo Path', `?d=${compressedData}`);
};

modeSelector.onchange = (event) => {
    editor.session.setMode(event.target.value);
    saveToUrl();
};

editor.session.on('change', () => {
    saveToUrl();
});

document.getElementById('copy').onclick = () => {
    navigator.clipboard.writeText(window.location.href).then();
};
