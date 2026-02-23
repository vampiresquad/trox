/* =========================================
   Trox - Premium Notepad Logic
========================================= */

// DOM Elements
const titleInput = document.getElementById('note-title');
const editorInput = document.getElementById('main-editor');
const wordsCount = document.getElementById('words');
const charsCount = document.getElementById('chars');

// Modal Elements
const modalOverlay = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');

// Sidebar Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

// --- Mobile Sidebar Toggle ---
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// --- Custom Premium Modal Logic ---
function showModal(title, message, showCancel = false, confirmCallback = null) {
    modalTitle.innerText = title;
    modalMessage.innerText = message;
    
    // Show/hide cancel button based on requirement
    modalCancel.style.display = showCancel ? 'inline-block' : 'none';
    
    // Show modal with animation
    modalOverlay.style.display = 'flex';
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);

    // Clone and replace buttons to remove previous event listeners (prevents multiple triggers)
    let newConfirm = modalConfirm.cloneNode(true);
    modalConfirm.parentNode.replaceChild(newConfirm, modalConfirm);
    
    let newCancel = modalCancel.cloneNode(true);
    modalCancel.parentNode.replaceChild(newCancel, modalCancel);

    // Re-select newly cloned buttons
    const currentConfirm = document.getElementById('modal-confirm');
    const currentCancel = document.getElementById('modal-cancel');

    // Add new event listeners
    currentConfirm.addEventListener('click', () => {
        closeModal();
        if (confirmCallback) confirmCallback();
    });

    currentCancel.addEventListener('click', closeModal);
}

function closeModal() {
    modalOverlay.classList.remove('active');
    setTimeout(() => {
        modalOverlay.style.display = 'none';
    }, 300); // Matches CSS transition time
}

// --- Live Counter ---
function updateCounters() {
    const text = editorInput.value;
    charsCount.innerText = text.length;
    // Count words accurately, ignoring empty spaces
    const wordsArray = text.trim().split(/\s+/);
    wordsCount.innerText = text.trim() === '' ? 0 : wordsArray.length;
}

// --- Real-time Auto Save (Local Storage) ---
function saveNote() {
    const noteData = {
        title: titleInput.value || '',
        content: editorInput.value,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('trox_active_note', JSON.stringify(noteData));
}

// Add event listeners for auto-save and counter
titleInput.addEventListener('input', saveNote);
editorInput.addEventListener('input', () => {
    updateCounters();
    saveNote();
});

// --- Load Saved Note on Startup ---
window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('trox_active_note');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        titleInput.value = parsedData.title;
        editorInput.value = parsedData.content;
        updateCounters();
    }
});

// --- Export Functionality with Warning ---
document.getElementById('export-note-btn').addEventListener('click', () => {
    const textContent = editorInput.value.trim();
    
    if (textContent === '') {
        showModal("Empty Note", "There is nothing to export. Please write something first.", false);
        return;
    }

    const warningMessage = "Since Trox uses Local Storage, your notes might be deleted if you clear your browser data. It is highly recommended to export your work. Do you want to download this note as a .txt file now?";
    
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

// --- PIN Lock Button (Placeholder for Next Step) ---
document.getElementById('lock-note-btn').addEventListener('click', () => {
    showModal(
        "Secure Lock", 
        "The advanced PIN lock and AES encryption system is being prepared. It will be integrated in the next update.", 
        false
    );
});
