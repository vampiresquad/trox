/* =========================================
   Trox - Premium Notepad Master Logic (v3 - Flawless & Secured)
========================================= */

// DOM Elements
const titleInput = document.getElementById('note-title');
const editorInput = document.getElementById('main-editor');
const wordsCount = document.getElementById('words');
const charsCount = document.getElementById('chars');
const saveStatus = document.getElementById('save-status');
const noteListContainer = document.getElementById('note-list');

// Buttons
const lockBtn = document.getElementById('lock-note-btn');
const colorBtn = document.getElementById('color-btn');
const deleteBtn = document.getElementById('delete-btn');
const newNoteBtn = document.getElementById('new-note-btn');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

// Modal Elements
const modalOverlay = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalIconContainer = document.getElementById('modal-icon-container');
// Note: modalConfirm & modalCancel are dynamically fetched inside showModal to prevent crash

// App Data State
let notes = [];
let currentNoteId = null;
const premiumColors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9', '#94a3b8'];

// --- Mobile Sidebar Overlay Setup (Flawless Fix) ---
const sidebarOverlay = document.createElement('div');
sidebarOverlay.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:90; display:none; opacity:0; transition:all 0.3s ease; backdrop-filter:blur(5px);";

const appContainer = document.querySelector('.app-container');
appContainer.style.position = 'relative'; // Stacking context fix
appContainer.appendChild(sidebarOverlay);


menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    sidebarOverlay.style.display = 'block';
    setTimeout(() => sidebarOverlay.style.opacity = '1', 10);
});

sidebarOverlay.addEventListener('click', closeSidebar);

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.style.opacity = '0';
    setTimeout(() => sidebarOverlay.style.display = 'none', 300);
}

// --- Custom Modal System (Fixed Node Cloning Crash Bug) ---
function showModal(title, messageHTML, iconClass, showCancel = false, confirmText = "Confirm", confirmCallback = null) {
    modalTitle.innerText = title;
    modalMessage.innerHTML = messageHTML;
    modalIconContainer.innerHTML = `<i class="${iconClass}"></i>`;
    
    let currentConfirm = document.getElementById('modal-confirm');
    let currentCancel = document.getElementById('modal-cancel');
    
    currentConfirm.innerText = confirmText;
    currentCancel.style.display = showCancel ? 'inline-block' : 'none';
    modalOverlay.style.display = 'flex';
    
    setTimeout(() => {
        modalOverlay.classList.add('active');
        // Auto-focus input and bind show password if exists
        const passInput = document.getElementById('pass-input');
        const showPassCb = document.getElementById('show-pass-cb');
        if(passInput) passInput.focus();
        
        if(passInput && showPassCb) {
            showPassCb.addEventListener('change', (e) => {
                passInput.type = e.target.checked ? 'text' : 'password';
            });
        }
    }, 10);

    // Flawless Event Listener reset without causing DOM crash
    let newConfirm = currentConfirm.cloneNode(true);
    currentConfirm.parentNode.replaceChild(newConfirm, currentConfirm);
    
    let newCancel = currentCancel.cloneNode(true);
    currentCancel.parentNode.replaceChild(newCancel, currentCancel);

    document.getElementById('modal-confirm').addEventListener('click', () => {
        if (confirmCallback) {
            if(confirmCallback() !== false) closeModal();
        } else closeModal();
    });
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
}

function closeModal() {
    modalOverlay.classList.remove('active');
    setTimeout(() => modalOverlay.style.display = 'none', 300);
}

// --- Data Management (Base64 Array & Debounced Save) ---
function loadData() {
    const data = localStorage.getItem('trox_database');
    if (data) {
        try {
            notes = JSON.parse(decodeURIComponent(atob(data)));
        } catch (e) { notes = []; }
    }
    
    if (notes.length === 0) {
        createNewNote(false);
    } else {
        renderSidebar();
        switchNote(notes[0].id);
    }
}

let typingSaveTimeout; // পারফরম্যান্স ল্যাগ ঠেকানোর জন্য
function saveCurrentNoteState() {
    if (!currentNoteId) return;
    const note = notes.find(n => n.id === currentNoteId);
    if (note && !note.isLocked) {
        note.title = titleInput.value;
        note.content = editorInput.value;
        note.lastUpdated = new Date().toISOString();
        
        // UI Status update instantly
        saveStatus.innerText = "Saving...";
        
        // Debouncing logic: 500ms পর সেভ হবে
        clearTimeout(typingSaveTimeout);
        typingSaveTimeout = setTimeout(() => {
            saveData(); 
        }, 500); 
    }
}


// --- Note Operations ---
function createNewNote(switchImmediately = true) {
    const newNote = {
        id: Date.now().toString(),
        title: '',
        content: '',
        color: premiumColors[0],
        password: null,
        isLocked: false,
        lastUpdated: new Date().toISOString()
    };
    notes.unshift(newNote);
    saveData();
    renderSidebar();
    if(switchImmediately) switchNote(newNote.id);
}

function switchNote(id) {
    saveCurrentNoteState(); // Save previous note first
    currentNoteId = id;
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    titleInput.value = note.title;
    
    // UI Update
    document.querySelectorAll('.note-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`note-${id}`);
    if(activeEl) activeEl.classList.add('active');
    
    // Close sidebar automatically on mobile when a note is selected
    if (window.innerWidth <= 768) closeSidebar(); 

    updateLockUI(note);
    if (!note.isLocked) {
        editorInput.value = note.content;
        updateCounters();
    }
}

function saveCurrentNoteState() {
    if (!currentNoteId) return;
    const note = notes.find(n => n.id === currentNoteId);
    if (note && !note.isLocked) {
        note.title = titleInput.value;
        note.content = editorInput.value;
        note.lastUpdated = new Date().toISOString();
        saveData();
    }
}

// --- Sidebar Render ---
function renderSidebar() {
    noteListContainer.innerHTML = '';
    notes.forEach(note => {
        const dateStr = new Date(note.lastUpdated).toLocaleDateString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
        const displayTitle = note.title.trim() === '' ? 'Untitled Note' : note.title;
        
        const noteEl = document.createElement('div');
        noteEl.className = `note-item ${note.id === currentNoteId ? 'active' : ''}`;
        noteEl.id = `note-${note.id}`;
        noteEl.onclick = () => { if(note.id !== currentNoteId) switchNote(note.id); };
        
        noteEl.innerHTML = `
            <div class="note-color-indicator" style="background-color: ${note.color}"></div>
            <div class="note-item-info">
                <div class="note-item-title">${note.isLocked ? 'Locked Note' : displayTitle}</div>
                <div class="note-item-date">${dateStr}</div>
            </div>
            ${note.isLocked ? '<div class="note-item-lock"><i class="ph ph-lock-key"></i></div>' : ''}
        `;
        noteListContainer.appendChild(noteEl);
    });
}

// --- Real-time Listeners ---
titleInput.addEventListener('input', () => {
    saveCurrentNoteState();
    renderSidebar(); // Update title live in sidebar
});
editorInput.addEventListener('input', () => {
    updateCounters();
    saveCurrentNoteState();
});

function updateCounters() {
    const text = editorInput.value;
    charsCount.innerText = text.length;
    wordsCount.innerText = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

// --- Advanced Password & Lock System (Secured & Upgraded) ---
function updateLockUI(note) {
    if (note.isLocked) {
        editorInput.style.filter = 'blur(10px)';
        editorInput.disabled = true;
        titleInput.disabled = true;
        editorInput.value = ""; // Hide content
        lockBtn.innerHTML = '<i class="ph ph-lock"></i>';
        lockBtn.style.color = 'var(--danger-color)';
    } else {
        editorInput.style.filter = 'none';
        editorInput.disabled = false;
        titleInput.disabled = false;
        lockBtn.innerHTML = '<i class="ph ph-lock-key-open"></i>';
        lockBtn.style.color = 'var(--text-primary)';
    }
}

const inputStyle = "margin-top:15px; padding:12px; width:100%; border-radius:8px; border:1px solid #ccc; font-size:16px; outline:none; font-family: 'Poppins', sans-serif; box-sizing: border-box;";

lockBtn.addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    
    if (!note.isLocked) {
        if (!note.password) {
            const msg = `<p style="font-size:14px; color:#555;">Set a strong password (Letters, Numbers, Symbols) to lock this note.</p>
                         <input type="password" id="pass-input" style="${inputStyle}" placeholder="Create password (min 4 chars)">
                         <div style="text-align: right; margin-top: 8px;">
                             <label style="font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                 <input type="checkbox" id="show-pass-cb"> Show Password
                             </label>
                         </div>`;
            showModal("Secure Note", msg, "ph ph-shield-check", true, "Lock Note", () => {
                const passVal = document.getElementById('pass-input').value.trim();
                if (passVal.length >= 4) { // Allows any character: numbers, alphabets, specials
                    saveCurrentNoteState(); // FIX: Save content BEFORE locking
                    note.password = passVal;
                    note.isLocked = true;
                    saveData();
                    updateLockUI(note);
                    renderSidebar();
                } else {
                    const inputField = document.getElementById('pass-input');
                    inputField.style.borderColor = 'var(--danger-color)';
                    inputField.value = "";
                    inputField.placeholder = "Minimum 4 characters required!";
                    return false; // Prevents modal from closing
                }
            });
        } else {
            saveCurrentNoteState(); // FIX: Save content BEFORE locking
            note.isLocked = true;
            saveData();
            updateLockUI(note);
            renderSidebar();
        }
    } else {
        const msg = `<p style="font-size:14px; color:#555;">This note is protected. Please enter your password.</p>
                     <input type="password" id="pass-input" style="${inputStyle}" placeholder="Enter password">
                     <div style="text-align: right; margin-top: 8px;">
                         <label style="font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                             <input type="checkbox" id="show-pass-cb"> Show Password
                         </label>
                     </div>`;
        showModal("Unlock Note", msg, "ph ph-lock", true, "Unlock", () => {
            const passVal = document.getElementById('pass-input').value;
            if (passVal === note.password) {
                note.isLocked = false;
                saveData();
                updateLockUI(note);
                editorInput.value = note.content; // Restore content
                updateCounters();
                renderSidebar();
            } else {
                const inputField = document.getElementById('pass-input');
                inputField.style.borderColor = 'var(--danger-color)';
                inputField.value = "";
                inputField.placeholder = "Wrong Password!";
                return false;
            }
        });
    }
});

// --- Note Color Setter (Fixed Cancel Bug) ---
colorBtn.addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if(note.isLocked) {
        showModal("Access Denied", "Unlock the note first to change its color.", "ph ph-lock", false, "OK");
        return;
    }
    
    let tempSelectedColor = note.color; // FIX: Temporary variable
    let colorHTML = '<div class="color-options" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:15px;">';
    premiumColors.forEach(color => {
        const isSelected = note.color === color ? 'border: 3px solid #333;' : 'border: 2px solid transparent;';
        colorHTML += `<div class="color-circle" style="background-color: ${color}; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; transition: 0.3s; ${isSelected}" data-color="${color}"></div>`;
    });
    colorHTML += '</div>';

    showModal("Set Note Color", colorHTML, "ph ph-palette", true, "Save", () => {
        note.color = tempSelectedColor; // Apply only on save
        saveData();
        renderSidebar();
    });

    setTimeout(() => {
        document.querySelectorAll('.color-circle').forEach(circle => {
            circle.addEventListener('click', (e) => {
                document.querySelectorAll('.color-circle').forEach(c => c.style.border = '2px solid transparent');
                e.target.style.border = '3px solid #333';
                tempSelectedColor = e.target.getAttribute('data-color');
            });
        });
    }, 50);
});

// --- Delete Note (Secured) ---
deleteBtn.addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (note.isLocked) { // FIX: Prevent deleting locked notes
        showModal("Action Denied", "You cannot delete a locked note. Please unlock it first.", "ph ph-shield-warning", false, "OK");
        return;
    }

    showModal("Delete Note?", "Are you sure you want to delete this note? This action cannot be undone.", "ph ph-trash", true, "Delete", () => {
        notes = notes.filter(n => n.id !== currentNoteId);
        saveData();
        if (notes.length === 0) createNewNote(true);
        else switchNote(notes[0].id);
    });
});

// --- Export Note ---
document.getElementById('export-note-btn').addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if(note.isLocked) {
        showModal("Access Denied", "Please unlock the note first to export.", "ph ph-lock", false, "OK");
        return;
    }
    if (editorInput.value.trim() === '') {
        showModal("Empty Note", "There is nothing to export.", "ph ph-warning-circle", false, "OK");
        return;
    }
    showModal("Export & Backup", "Do you want to download this note as a .txt file now?", "ph ph-download-simple", true, "Download", () => {
        const title = titleInput.value.trim() || 'Trox_Untitled';
        const blob = new Blob([`${title}\n\n${editorInput.value}`], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}.txt`;
        link.click();
    });
});

// --- Buttons Setup ---
newNoteBtn.addEventListener('click', () => createNewNote(true));

// Initialize
window.addEventListener('DOMContentLoaded', loadData);
