document.addEventListener('DOMContentLoaded', () => {
    let scriptoriumData = null;
    let scriptoriumLoaded = false;
    let performanceLoaded = false;

    const views = {
        'tab-scriptorium': document.getElementById('view-scriptorium'),
        'tab-performance': document.getElementById('view-performance'),
        'tab-chat': document.getElementById('view-chat')
    };

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const viewId = `view-${tab.id.split('-')[1]}`;
            showView(viewId);
        });
    });

    document.getElementById('chat-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        if (!message) return;
        addMessageToChat(message, 'user');
        chatInput.value = '';
        try {
            const res = await fetch('http://5.150.124.88:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, userID: 'isma-eel' })
            });
            const data = await res.json();
            addMessageToChat(data.text || 'Error in response.', 'ai');
        } catch (error) {
            console.error("Chat API Error:", error);
            addMessageToChat('Could not connect to Alina.', 'ai');
        }
    });

    function showView(viewId) {
        tabs.forEach(tab => tab.classList.remove('active'));
        Object.values(views).forEach(view => view.classList.add('hidden'));

        document.getElementById(viewId).classList.remove('hidden');
        document.getElementById(`tab-${viewId.split('-')[1]}`).classList.add('active');

        if (viewId === 'view-scriptorium' && !scriptoriumLoaded) populateScriptorium();
        if (viewId === 'view-performance' && !performanceLoaded) populatePerformance();
    }

    function addMessageToChat(text, sender) {
        const chatHistory = document.getElementById('chat-history');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble chat-bubble-${sender}`;
        bubble.textContent = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async function populateScriptorium() {
        try {
            const res = await fetch('http://5.150.124.88:5000/api/scriptorium');
            scriptoriumData = await res.json();
            const indexContent = document.getElementById('project-index-content');
            indexContent.innerHTML = `
                <h2 class="text-xl font-semibold mb-4">Project Index</h2>
                <p><strong>Title:</strong> ${scriptoriumData.project_title}</p>
                <p><strong>Status:</strong> ${scriptoriumData.status}</p>
                <p><strong>Last Updated:</strong> ${new Date(scriptoriumData.last_updated).toLocaleString()}</p>
                <p><strong>Version:</strong> ${scriptoriumData.version}</p>
                <h3 class="text-lg font-semibold mt-4 mb-2">Table of Contents</h3>
                <ul id="toc-list" class="list-disc pl-5 space-y-2"></ul>`;
            
            const tocList = document.getElementById('toc-list');
            Object.keys(scriptoriumData.outline).forEach(partKey => {
                const part = scriptoriumData.outline[partKey];
                const partLi = document.createElement('li');
                partLi.innerHTML = `<strong>${part.title}</strong>`;
                const chapterUl = document.createElement('ul');
                chapterUl.className = 'list-disc pl-5 mt-1';
                Object.keys(part.chapters).forEach(chapterKey => {
                    const chapterLi = document.createElement('li');
                    chapterLi.className = 'cursor-pointer hover:text-indigo-400';
                    chapterLi.textContent = part.chapters[chapterKey];
                    chapterLi.addEventListener('click', () => loadChapter(chapterKey));
                    chapterUl.appendChild(chapterLi);
                });
                partLi.appendChild(chapterUl);
                tocList.appendChild(partLi);
            });

            const revisionNotesContent = document.getElementById('revision-notes-content');
            revisionNotesContent.innerHTML = `<h2 class="text-xl font-semibold mb-4">Alina's Revision Notes</h2>`;
            scriptoriumData.revision_notes_by_alina.forEach(note => {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'mb-4';
                noteDiv.innerHTML = `<p class="text-sm text-gray-400">${new Date(note.timestamp).toLocaleString()}</p><p>${note.note}</p>`;
                revisionNotesContent.appendChild(noteDiv);
            });

            const firstChapterKey = Object.keys(scriptoriumData.outline.part_1.chapters)[0];
            loadChapter(firstChapterKey);
            scriptoriumLoaded = true;
        } catch(err) { console.error("Error populating Scriptorium:", err); }
    }

    function loadChapter(chapterKey) {
        if (!scriptoriumData) return;
        const manuscriptContent = document.getElementById('manuscript-content');
        const chapterTitle = Object.values(scriptoriumData.outline).flatMap(p => Object.entries(p.chapters)).find(([k]) => k === chapterKey)[1];
        manuscriptContent.innerHTML = `<h2 class="text-xl font-semibold mb-4">${chapterTitle}</h2><div>${scriptoriumData.drafts[chapterKey] || '<p>Not yet drafted.</p>'}</div>`;
    }

    async function populatePerformance() {
        try {
            const res = await fetch('http://5.150.124.88:5000/api/performance');
            const data = await res.json();
            document.getElementById('kpi-active-testers').textContent = data.activeTesters;
            document.getElementById('kpi-total-conversations').textContent = data.totalConversations;
            document.getElementById('kpi-avg-session').textContent = `${Math.floor(data.avgSessionSeconds / 60)}m ${data.avgSessionSeconds % 60}s`;
            const tableBody = document.getElementById('conversations-table-body');
            tableBody.innerHTML = '';
            data.conversations.forEach(c => {
                const row = `<tr><td class="p-2">${c.id}</td><td class="p-2">${c.startTime}</td><td class="p-2">${c.duration}</td><td class="p-2">${c.messages}</td></tr>`;
                tableBody.innerHTML += row;
            });
            performanceLoaded = true;
        } catch(err) { console.error("Error populating Performance:", err); }
    }

    showView('view-chat'); // Default to Chat
});