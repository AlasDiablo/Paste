import './style.css';
import lz from 'lz-string';
import $ from 'jquery';
// eslint-disable-next-line import/no-unresolved
import Readme from '../readme.md?raw';

/**
 * Load Ace editor
 */
// eslint-disable-next-line no-undef
const editor = ace.edit('editor');

/**
 * Set Monokai as editor theme
 */
editor.setTheme('ace/theme/monokai');

/**
 * Load evey ace modes
 */
// eslint-disable-next-line no-undef
const modes = ace.require('ace/ext/modelist');

/**
 * Get mode selector element
 * @type {HTMLElement}
 */
const modeSelector = document.getElementById('mode');

/**
 * Get status box element
 * @type {HTMLElement}
 */
const status = document.getElementById('status');

/**
 * Get use https check box
 * @type {HTMLElement}
 */
const useHttps = document.getElementById('use-https');

/**
 * Set default host name
 * @type {string}
 */
let host = '';

/**
 * Create mode list and add it to 'modeSelector'
 * @type {string}
 */
let modeSelectorInnerHTML = '';
modes.modes.forEach((mode) => {
    if (mode.mode === 'ace/mode/markdown') modeSelectorInnerHTML += `<option value="${mode.mode}" selected>${mode.caption}</option>`;
    else modeSelectorInnerHTML += `<option value="${mode.mode}">${mode.caption}</option>`;
});
modeSelector.innerHTML = modeSelectorInnerHTML;

/**
 * Set editor default content
 */
const setDefaultContent = () => {
    editor.session.setMode('ace/mode/markdown');
    editor.session.setValue(Readme);
};

/**
 * Set an encoded content into the editor
 * @param data{string} an encoded string containing the mode use and the editor content
 */
const setContent = (data) => {
    const uncompressedData = lz.decompressFromEncodedURIComponent(data);
    const lines = uncompressedData.split('\n');
    const header = JSON.parse(lines.shift());
    editor.session.setMode(header.mode);
    editor.session.setValue(lines.join('\n'));
    modeSelector.value = header.mode;
};

/**
 * Get the editor content and selected mode then encoded it to be use in url paste or server paste
 * @returns {{compressedData: string, content: string}}
 */
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

/**
 * Update webpage url with the newly generated data
 */
const saveToUrl = () => {
    const { content, compressedData } = getCompressedData();
    window.history.pushState(content, '', `?d=${compressedData}`);
};

/**
 * Check the connection to a storage server
 */
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

/**
 * Get url parameter
 * @type {module:url.URLSearchParams}
 */
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

/**
 * Check if the page have parameter
 * - If 'd' is present then decode the value and apply it
 * - Else, if 'host' and 'id' is present ask the host for the value of id and apply it
 * - If an error is encounter then apply default content.
 */
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

/**
 * Update editor mode when the mode selector have change
 */
modeSelector.onchange = (event) => {
    editor.session.setMode(event.target.value);
    saveToUrl();
};

/**
 * Update url when the editor content have change
 */
editor.session.on('change', () => {
    saveToUrl();
});

/**
 * Add to clipboard when the user click on copy
 */
document.getElementById('copy').onclick = () => {
    navigator.clipboard.writeText(window.location.href).then();
};

/**
 * Load a user file and try yo found the file mode
 */
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

/**
 * Show the server storage panel and try to connect to a host if one have already been defined
 */
document.getElementById('share').onclick = () => {
    document.getElementById('share-panel').style.display = 'block';
    const savedHost = window.localStorage.getItem('host');
    if (savedHost) host = savedHost;
    if (host !== '') {
        document.getElementById('server-url').value = host;
        checkServer();
    }
};

/**
 * Close server storage panel
 */
document.getElementById('cancel-shared').onclick = () => {
    document.getElementById('share-panel').style.display = 'none';
};

/**
 * Create encoded data end send it to the server to get the associated id,
 * and then copy and close the server storage panel
 */
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

/**
 * Check the server when protocol have been change
 */
useHttps.addEventListener('change', () => {
    if (host !== '') checkServer();
});

/**
 * Check the server when the host have been change
 */
document.getElementById('server-url').addEventListener('change', (event) => {
    host = event.target.value;
    checkServer();
});
