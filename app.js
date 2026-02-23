/* =========================================
   Trox - Premium Notepad Logic (v2 - Secured)
========================================= */

// DOM Elements
const titleInput = document.getElementById('note-title');
const editorInput = document.getElementById('main-editor');
const wordsCount = document.getElementById('words');
const charsCount = document.getElementById('chars');
const lockBtn = document.getElementById('lock-note-btn');

// Modal Elements
const modalOverlay = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');

// Sidebar Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

// Security State
let isLocked = localStorage.getItem('trox_is_locked') === 'true';
let currentPin = localStorage.getItem('trox_pin') || null;

// --- Mobile Sidebar Toggle ---
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// --- Custom Premium Modal Logic (Updated for HTML Input) ---
function showModal(title, messageHTML, showCancel = false, confirmCallback = null) {
    modalTitle.innerText = title;
    modalMessage.innerHTML = messageHTML; // Updated to allow custom input fields
    
    modalCancel.style.display = showCancel ? 'inline-block' : 'none';
    
    modalOverlay.style.display = 'flex';
    setTimeout(() => { modalOverlay.classList.add('active'); }, 10);

    let newConfirm = modalConfirm.cloneNode(true);
    modalConfirm.parentNode.replaceChild(newConfirm, modalConfirm);
    
    let newCancel = modalCancel.cloneNode(true);
    modalCancel.parentNode.replaceChild(newCancel, modalCancel);

    const currentConfirm = document.getElementById('modal-confirm');
    const currentCancel = document.getElementById('modal-cancel');

    currentConfirm.addEventListener('click', () => {
        if (confirmCallback) {
            // If callback returns false, don't close modal (useful for wrong PIN)
            if(confirmCallback() !== false) closeModal();
        } else {
            closeModal();
        }
    });

    currentCancel.addEventListener('click', closeModal);
}

function closeModal() {
    modalOverlay.classList.remove('active');
    setTimeout(() => { modalOverlay.style.display = 'none'; }, 300);
}

// --- Live Counter ---
function updateCounters() {
    if(isLocked) return;
    const text = editorInput.value;
    charsCount.innerText = text.length;
    const wordsArray = text.trim().split(/\s+/);
    wordsCount.innerText = text.trim() === '' ? 0 : wordsArray.length;
}

// --- Real-time Auto Save (Base64 Encoded for Privacy) ---
function saveNote() {
    if(isLocked) return; // Don't save empty/blurred state
    const noteData = {
        title: titleInput.value || '',
        content: editorInput.value,
        lastUpdated: new Date().toISOString()
    };
    // Encoding to Base64 so casual users can't read it easily in DevTools
    const encodedData = btoa(encodeURIComponent(JSON.stringify(noteData)));
    localStorage.setItem('trox_active_note', encodedData);
}

titleInput.addEventListener('input', saveNote);
editorInput.addEventListener('input', () => {
    updateCounters();
    saveNote();
});

// --- Load Saved Note on Startup ---
window.addEventListener('DOMContentLoaded', () => {
    updateLockUI(); // Check lock status first
    
    const savedData = localStorage.getItem('trox_active_note');
    if (savedData && !isLocked) {
        try {
            const decodedData = JSON.parse(decodeURIComponent(atob(savedData)));
            titleInput.value = decodedData.title;
            editorInput.value = decodedData.content;
            updateCounters();
        } catch (e) {
            console.error("Data decoding failed.");
        }
    }
});

// --- Export Functionality ---
document.getElementById('export-note-btn').addEventListener('click', () => {
    if(isLocked) {
        showModal("Locked", "Please unlock the note first to export.", false);
        return;
    }
    const textContent = editorInput.value.trim();
    if (textContent === '') {
        showModal("Empty Note", "There is nothing to export. Please write something first.", false);
        return;
    }
    const warningMessage = "Since Trox uses Local Storage, your notes might be deleted if you clear your browser data. Do you want to download this note as a .txt file now?";
    showModal("Export & Backup", warningMessage, true, () => {
        downloadTxtFile();
    });
});

function downloadTxtFile() {
    const title = titleInput.value.trim() || 'Trox_Untitled';
    const text = `${title}\n\n${editorInput.value}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Advanced PIN Lock System ---
function updateLockUI() {
    if (isLocked) {
        editorInput.style.filter = 'blur(8px)';
        editorInput.style.userSelect = 'none';
        editorInput.disabled = true;
        titleInput.disabled = true;
        lockBtn.innerHTML = '<i class="ph ph-lock"></i>';
        lockBtn.style.color = 'var(--danger-color)';
        // Hide content temporarily from DOM
        editorInput.dataset.realValue = editorInput.value;
        editorInput.value = ""; 
    } else {
        editorInput.style.filter = 'none';
        editorInput.style.userSelect = 'auto';
        editorInput.disabled = false;
        titleInput.disabled = false;
        lockBtn.innerHTML = '<i class="ph ph-lock-key"></i>';
        lockBtn.style.color = 'var(--text-primary)';
        // Restore content
        if(editorInput.dataset.realValue) {
            editorInput.value = editorInput.dataset.realValue;
        }
    }
}

const pinInputStyle = "margin-top: 15px; padding: 12px; width: 100%; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.3); color: white; text-align: center; font-size: 24px; letter-spacing: 10px; outline: none;";

lockBtn.addEventListener('click', () => {
    if (!isLocked) {
        if (!currentPin) {
            // Set new PIN
            const msg = `<p>Set a 4-digit PIN to secure your notes.</p><input type="password" id="pin-input" maxlength="4" style="${pinInputStyle}" placeholder="****">`;
            showModal("Setup Security PIN", msg, true, () => {
                const pinVal = document.getElementById('pin-input').value;
                if (pinVal.length === 4 && !isNaN(pinVal)) {
                    currentPin = pinVal;
                    localStorage.setItem('trox_pin', currentPin);
                    isLocked = true;
                    localStorage.setItem('trox_is_locked', 'true');
                    saveNote(); // Save before locking
                    updateLockUI();
                } else {
                    document.getElementById('pin-input').style.borderColor = 'var(--danger-color)';
                    return false; // Prevents modal from closing
                }
            });
        } else {
            // Lock immediately
            isLocked = true;
            localStorage.setItem('trox_is_locked', 'true');
            saveNote();
            updateLockUI();
        }
    } else {
        // Unlock
        const msg = `<p>Enter your 4-digit PIN to unlock.</p><input type="password" id="pin-input" maxlength="4" style="${pinInputStyle}" placeholder="****">`;
        showModal("Unlock Note", msg, true, () => {
            const pinVal = document.getElementById('pin-input').value;
            if (pinVal === currentPin) {
                isLocked = false;
                localStorage.setItem('trox_is_locked', 'false');
                updateLockUI();
                
                // Reload data securely
                const savedData = localStorage.getItem('trox_active_note');
                if (savedData) {
                    const decodedData = JSON.parse(decodeURIComponent(atob(savedData)));
                    titleInput.value = decodedData.title;
                    editorInput.value = decodedData.content;
                    updateCounters();
                }
            } else {
                document.getElementById('pin-input').style.borderColor = 'var(--danger-color)';
                return false; // Prevents modal from closing
            }
        });
    }
});
