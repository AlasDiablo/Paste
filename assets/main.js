import './style.css';
import lz from 'lz-string';
import $ from 'jquery';
// eslint-disable-next-line import/no-unresolved
import Readme from '../readme.md?raw';

// eslint-disable-next-line no-undef
const editor = ace.edit('editor');

editor.setTheme('ace/theme/monokai');

// eslint-disable-next-line no-undef
const modes = ace.require('ace/ext/modelist');
const modeSelector = document.getElementById('mode');
const status = document.getElementById('status');
const useHttps = document.getElementById('use-https');
let host = '';

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
    editor.session.setValue(Readme);
};

const setContent = (data) => {
    const uncompressedData = lz.decompressFromEncodedURIComponent(data);
    const lines = uncompressedData.split('\n');
    const header = JSON.parse(lines.shift());
    editor.session.setMode(header.mode);
    editor.session.setValue(lines.join('\n'));
    modeSelector.value = header.mode;
};

const data = params.d;
if (data !== null && data !== undefined) {
    try {
        setContent(data);
    } catch (error) {
        setDefaultContent();
    }
} else if ((params.host !== null && params.host !== undefined)
    && (params.id !== null && params.id !== undefined)) {
    $.ajax({
        type: 'GET',
        crossOrigin: true,
        data: {
            id: params.id,
        },
        url: `${params.host}/load`,
        success: (result) => {
            try {
                setContent(result.content);
            } catch (error) {
                setDefaultContent();
            }
        },
        error: () => {
            status.innerText = 'Fail to check server...';
        },
    });
} else {
    setDefaultContent();
}

const getCompressedData = () => {
    const doc = editor.session.getDocument().getAllLines();
    let content = JSON.stringify({
        mode: editor.session.$modeId,
        lastEdit: new Date(),
    });
    while (doc.length > 0) {
        content += `\n${doc.shift()}`;
    }
    const compressedData = lz.compressToEncodedURIComponent(content);
    return {
        content,
        compressedData,
    };
};

const saveToUrl = () => {
    const { content, compressedData } = getCompressedData();
    window.history.pushState(content, '', `?d=${compressedData}`);
};

const checkServer = () => {
    const url = `${useHttps.checked ? 'https://' : 'http://'}${host}/`;
    status.innerText = `Checking server[${url}]...`;
    $.ajax({
        type: 'GET',
        crossOrigin: true,
        url,
        success: (result) => {
            status.innerText = `Success, quota left : ${result.quota}`;
            window.localStorage.setItem('host', host);
        },
        error: () => {
            status.innerText = 'Fail to check server...';
        },
    });
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

document.getElementById('share').onclick = () => {
    document.getElementById('share-panel').style.display = 'block';
    const savedHost = window.localStorage.getItem('host');
    if (savedHost) host = savedHost;
    if (host !== '') {
        document.getElementById('server-url').value = host;
        checkServer();
    }
};

document.getElementById('cancel-shared').onclick = () => {
    document.getElementById('share-panel').style.display = 'none';
};

document.getElementById('copy-shared').onclick = () => {
    const sharedUrl = document.getElementById('shared-url');
    const baseUrl = `${useHttps.checked ? 'https://' : 'http://'}${host}`;
    const url = `${baseUrl}/save`;
    const { content, compressedData } = getCompressedData();
    $.ajax({
        type: 'POST',
        data: {
            content: compressedData,
        },
        crossOrigin: true,
        url,
        success: (result) => {
            status.innerText = `Success, paste id : ${result.id}`;
            window.history.pushState(content, '', `?host=${baseUrl}&id=${result.id}`);
            sharedUrl.value = window.location.href;
            navigator.clipboard.writeText(
                sharedUrl.value,
            ).then(() => {
                document.getElementById('share-panel').style.display = 'none';
            });
        },
        error: () => {
            status.innerText = 'Fail to save data into the server...';
        },
    });
};

useHttps.addEventListener('change', () => {
    if (host !== '') checkServer();
});

document.getElementById('server-url').addEventListener('change', (event) => {
    host = event.target.value;
    checkServer();
});
