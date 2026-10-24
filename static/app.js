
const THREAD_KEY = 'cloudops_sentinel_thread_id';

// Generate a unique incident session ID
function newThreadId() {
  return 'incident-' + crypto.randomUUID();
}

let threadId = localStorage.getItem(THREAD_KEY) || newThreadId();
localStorage.setItem(THREAD_KEY, threadId);

// DOM Elements
const q = document.getElementById('question');
const send = document.getElementById('sendBtn');
const messages = document.getElementById('messages');

const upload = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const fileLabel = document.getElementById('fileLabel');

const starters = document.getElementById('starterPrompts');
const sessionId = document.getElementById('sessionId');
const newSessionBtn = document.getElementById('newSessionBtn');


// Display current session ID
function renderSession() {
    if (sessionId) {
        sessionId.textContent =
            'SESSION / ' + threadId.slice(-8).toUpperCase();
    }
}

renderSession();


// Escape HTML to prevent injected markup
function esc(value = '') {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char]);
}


// Convert Markdown responses into safely rendered HTML
function formatMarkdown(text = '') {
    const inline = (value) => {
        let result = esc(value);

        // Inline code
        result = result.replace(
            /`([^`]+)`/g,
            '<code>$1</code>'
        );

        // Bold text
        result = result.replace(
            /\*\*(.*?)\*\*/g,
            '<strong>$1</strong>'
        );

        // Italic text
        result = result.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            '<em>$1</em>'
        );

        return result;
    };

    const lines = String(text).replace(/\r\n/g, '\n').split('\n');

    let html = '';
    let inList = false;
    let listType = null;

    function closeList() {
        if (inList) {
            html += listType === 'ol' ? '</ol>' : '</ul>';
            inList = false;
            listType = null;
        }
    }

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            closeList();
            continue;
        }

        // Headings
        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);

        if (heading) {
            closeList();
            const level = heading[1].length;
            html += `<h${level}>${inline(heading[2])}</h${level}>`;
            continue;
        }

        // Numbered list
        const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);

        if (numbered) {
            if (!inList || listType !== 'ol') {
                closeList();
                html += '<ol>';
                inList = true;
                listType = 'ol';
            }

            html += `<li>${inline(numbered[1])}</li>`;
            continue;
        }

        // Bullet list
        const bullet = trimmed.match(/^[-*]\s+(.+)$/);

        if (bullet) {
            if (!inList || listType !== 'ul') {
                closeList();
                html += '<ul>';
                inList = true;
                listType = 'ul';
            }

            html += `<li>${inline(bullet[1])}</li>`;
            continue;
        }

        closeList();

        // Regular paragraph
        html += `<p>${inline(trimmed)}</p>`;
    }

    closeList();

    return html;
}



// Format metadata labels
function pretty(value = '') {
    return String(value)
        .replaceAll('_', ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}


// Add a message to the conversation
function addMessage(role, html, meta = '') {
    const element = document.createElement('div');

    element.className = `message ${role}`;

    const avatar = role === 'assistant'
        ? '<div class="avatar assistant-avatar">S</div>'
        : '';

    const label = role === 'assistant'
        ? 'CLOUDOPS SENTINEL'
        : 'YOU';

    element.innerHTML = `
        ${avatar}
        <div class="message-body">
            <div class="message-label">${label}</div>
            <div class="bubble">${html}</div>
            ${meta}
        </div>
    `;

    messages.appendChild(element);

    messages.scrollTop = messages.scrollHeight;

    return element;
}


// Loading animation
function loadingMarkup() {
    return `
        <span class="thinking">
            Reviewing incident evidence
            <i></i><i></i><i></i>
        </span>
    `;
}


// Generate response metadata
function buildMetadata(data) {
    let meta = `
        <div class="meta-card">
            <div class="verification">
    `;

    if (data.route) {
        meta += `
            <span class="tag">
                ROUTE · ${esc(data.route)}
            </span>
        `;
    }

    if (data.support_status) {
        meta += `
            <span class="tag ok">
                SUPPORT · ${esc(pretty(data.support_status))}
            </span>
        `;
    }

    if (data.usefulness) {
        meta += `
            <span class="tag ok">
                USEFULNESS · ${esc(pretty(data.usefulness))}
            </span>
        `;
    }

    if (data.used_web_search) {
        meta += `
            <span class="tag web">
                WEB SEARCH USED
            </span>
        `;
    }

    const memoryTurns = Number(data.memory_turns) || 0;

    meta += `
        <span class="tag memory">
            SESSION MEMORY · ${memoryTurns}
            TURN${memoryTurns === 1 ? '' : 'S'}
        </span>
    `;

    meta += '</div>';

    // Display retrieved sources
    if (Array.isArray(data.sources) && data.sources.length) {

        meta += '<div class="sources">';

        meta += data.sources.map(source => {

            const title = esc(
                source.title || source.source || 'Evidence'
            );

            const page = source.page
                ? ` · p. ${esc(source.page)}`
                : '';

            const link = source.url
                ? ` · <a target="_blank" rel="noopener noreferrer"
                     href="${esc(source.url)}">View source ↗</a>`
                : '';

            const icon = source.type === 'web'
                ? '⌁'
                : '▤';

            return `
                <div class="source">
                    <span class="source-icon">${icon}</span>
                    <span>
                        ${title}${page}${link}
                    </span>
                </div>
            `;

        }).join('');

        meta += '</div>';
    }


    // Display Self-RAG workflow trace
    if (Array.isArray(data.trace) && data.trace.length) {

        meta += `
            <div class="trace">
                <details>
                    <summary>View workflow trace</summary>
                    <ol>
                        ${data.trace.map(item =>
                            `<li>${esc(item)}</li>`
                        ).join('')}
                    </ol>
                </details>
            </div>
        `;
    }

    meta += '</div>';

    return meta;
}


// Main chat function
async function ask() {

    const question = q.value.trim();

    if (!question || send.disabled) return;

    // Hide suggested prompts after first question
    if (starters) {
        starters.style.display = 'none';
    }

    // Display user message
    addMessage('user', esc(question));

    q.value = '';

    send.disabled = true;

    // Show loading state
    const loading = addMessage(
        'assistant',
        loadingMarkup()
    );

    try {

        const response = await fetch('/api/chat', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                question: question,
                thread_id: threadId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || 'The request could not be completed'
            );
        }

        // Remove loading message
        loading.remove();

        // Display assistant response
        addMessage(
            'assistant',
            formatMarkdown(data.answer || 'No answer was returned.'),
            buildMetadata(data)
        );

    } catch (error) {

        loading.remove();

        addMessage(
            'assistant',
            `I couldn't process that request: ${esc(error.message)}`
        );

    } finally {

        send.disabled = false;

        q.focus();
    }
}


// Send button
send.addEventListener('click', ask);


// Enter to send, Shift + Enter for newline
q.addEventListener('keydown', event => {

    if (event.key === 'Enter' && !event.shiftKey) {

        event.preventDefault();

        ask();
    }

});


// Suggested starter questions
starters?.addEventListener('click', event => {

    const button = event.target.closest('button[data-q]');

    if (!button) return;

    q.value = button.dataset.q;

    q.focus();

});


// File selection
fileInput.addEventListener('change', () => {

    fileLabel.textContent =
        fileInput.files[0]?.name || 'Choose a file';

    uploadStatus.textContent = '';

});


// Upload runbook to Pinecone knowledge base
upload.addEventListener('click', async () => {

    const file = fileInput.files[0];

    if (!file) {

        uploadStatus.textContent =
            'Select a runbook before uploading.';

        return;
    }

    upload.disabled = true;

    uploadStatus.textContent =
        'Adding document to your private knowledge base…';

    try {

        const formData = new FormData();

        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || 'Upload failed'
            );
        }

        uploadStatus.textContent =
            `✓ ${data.chunks_indexed} chunks indexed · ${data.namespace}`;

        // Reset file input after successful upload
        fileInput.value = '';

        fileLabel.textContent = 'Choose a file';

    } catch (error) {

        uploadStatus.textContent =
            `Upload error: ${error.message}`;

    } finally {

        upload.disabled = false;
    }

});


// Start a fresh incident session
newSessionBtn?.addEventListener('click', () => {

    threadId = newThreadId();

    localStorage.setItem(THREAD_KEY, threadId);

    renderSession();

    messages.innerHTML = `
        <div class="message assistant">

            <div class="avatar assistant-avatar">
                S
            </div>

            <div class="message-body">

                <div class="message-label">
                    CLOUDOPS SENTINEL · NEW SESSION
                </div>

                <div class="bubble intro">
                    A fresh incident session is ready.
                    Describe the production issue and I'll
                    build context as we investigate.
                </div>

            </div>

        </div>
    `;

    if (starters) {
        starters.style.display = 'flex';
    }

    q.value = '';

    q.focus();

});
