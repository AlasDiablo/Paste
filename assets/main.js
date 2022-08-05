import './style.css';
import lz from 'lz-string';

// eslint-disable-next-line no-undef
const editor = ace.edit('editor');

editor.setTheme('ace/theme/monokai');

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

const setDefaultContent = () => {
    editor.session.setMode('ace/mode/markdown');
    editor.session.setValue(`# An url powered paste app

### What is that ?

This app store the text right here into the page url (no data is store server side)

### Software and library use to make this app:

+ [Ace](https://ace.c9.io), Web code editor.
+ [Bootstrap](https://getbootstrap.com), Css library.
+ [Vite](https://vitejs.dev), Front-end development kit.
+ [LZ-String](https://www.npmjs.com/package/lz-string), LZ compression algorithm use to encode data.
+ [ESLint](https://eslint.org), Code quality checking.
+ [Fira Code](https://github.com/tonsky/FiraCode), Monospace font use in the code editor with ligatures related to programming and math.
+ [Xolonium](https://fontlibrary.org/en/font/xolonium), Font use for the nav bar.

### Want more functionality or juste report issues ?

+ [GitHub](https://github.com/AlasDiablo/Paste)

### Changelog

+ 1.1.0
    + Add file loading option
    + Bad url give the value of the landing page
    + New open source ! (MIT)
+ 1.0.1
    + Fix syntax selector when opening a url with data
    + Add a link on the title to go on the landing page
+ 1.0.0
    + Initial version
`);
};

const data = params.d;
if (data !== null && data !== undefined) {
    try {
        const uncompressedData = lz.decompressFromEncodedURIComponent(data);
        const lines = uncompressedData.split('\n');
        const header = JSON.parse(lines.shift());
        editor.session.setMode(header.mode);
        editor.session.setValue(lines.join('\n'));
        modeSelector.value = header.mode;
    } catch (error) {
        setDefaultContent();
    }
} else {
    setDefaultContent();
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
    history.pushState(content, '', `?d=${compressedData}`);
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

document.getElementById('file-loader').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        editor.session.setValue(e.target.result);
    };
    reader.readAsText(file);
    editor.session.setMode('ace/mode/text');
    modeSelector.value = 'ace/mode/text';
    modes.modes.forEach((mode) => {
        if (mode.extRe.test(file.name)) {
            editor.session.setMode(mode.mode);
            modeSelector.value = mode.mode;
        }
    });
});
