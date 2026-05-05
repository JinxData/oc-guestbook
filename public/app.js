// CYBERPUNK GUESTBOOK APP
// Frontend logic for loading, creating entries, and reactions

const API_URL = '/api';
const entriesContainer = document.getElementById('entriesContainer');
const guestbookForm = document.getElementById('guestbookForm');
const charCount = document.getElementById('charCount');
const messageInput = document.getElementById('message');

// Load entries on page load
document.addEventListener('DOMContentLoaded', () => {
  loadEntries();
  setupForm();
  setupCharCounter();
});

// Load all entries
async function loadEntries() {
  try {
    const response = await fetch(`${API_URL}/entries`);
    const entries = await response.json();
    renderEntries(entries);
  } catch (error) {
    console.error('Error loading entries:', error);
    entriesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">CONNECTION_LOST</p>
      </div>
    `;
  }
}

// Render entries
function renderEntries(entries) {
  if (entries.length === 0) {
    entriesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📡</div>
        <p class="empty-state-text">NO_TRANSMISSIONS_FOUND</p>
        <p style="color: var(--text-dim); margin-top: 10px; font-size: 0.9rem;">Be the first to transmit!</p>
      </div>
    `;
    return;
  }

  entriesContainer.innerHTML = entries.map(entry => `
    <div class="entry-card" data-id="${entry.id}">
      <div class="entry-header">
        <span class="entry-name">${escapeHtml(entry.name)}</span>
        <span class="entry-date">${formatDate(entry.created_at)}</span>
      </div>
      <div class="entry-message">${escapeHtml(entry.message)}</div>
      <div class="entry-actions">
        <button class="reaction-btn" onclick="addReaction(${entry.id}, '👍')" title="Like">
          👍 <span class="count">${entry.likes || 0}</span>
        </button>
        <button class="reaction-btn" onclick="addReaction(${entry.id}, '❤️')" title="Love">
          ❤️ <span class="count">${entry.hearts || 0}</span>
        </button>
        <button class="reaction-btn" onclick="addReaction(${entry.id}, '🔥')" title="Fire">
          🔥 <span class="count">${entry.fires || 0}</span>
        </button>
        <button class="reaction-btn" onclick="addReaction(${entry.id}, '😂')" title="Laugh">
          😂 <span class="count">${entry.laughs || 0}</span>
        </button>
      </div>
    </div>
  `).join('');
}

// Setup form submission
function setupForm() {
  guestbookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const message = messageInput.value.trim();
    
    if (!name || !message) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    // Disable submit button
    const submitBtn = guestbookForm.querySelector('.cyber-button');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">TRANSMITTING...</span>';
    
    try {
      const response = await fetch(`${API_URL}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transmission failed');
      }
      
      // Clear form
      guestbookForm.reset();
      charCount.textContent = '0';
      
      // Reload entries
      await loadEntries();
      
      showNotification('Transmission successful!', 'success');
    } catch (error) {
      console.error('Error creating entry:', error);
      showNotification(error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span class="btn-glitch"></span>
        <span class="btn-text">TRANSMIT</span>
        <span class="btn-icon">→</span>
      `;
    }
  });
}

// Add reaction
async function addReaction(entryId, emoji) {
  try {
    const response = await fetch(`${API_URL}/entries/${entryId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji })
    });
    
    if (!response.ok) {
      throw new Error('Reaction failed');
    }
    
    // Reload entries to show updated counts
    await loadEntries();
    
    // Visual feedback
    const card = document.querySelector(`[data-id="${entryId}"]`);
    if (card) {
      card.style.borderColor = 'var(--neon-pink)';
      setTimeout(() => {
        card.style.borderColor = '';
      }, 500);
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    showNotification('Reaction failed', 'error');
  }
}

// Character counter
function setupCharCounter() {
  messageInput.addEventListener('input', () => {
    const length = messageInput.value.length;
    charCount.textContent = length;
    
    if (length >= 450) {
      charCount.style.color = 'var(--neon-red)';
    } else if (length >= 400) {
      charCount.style.color = 'var(--neon-yellow)';
    } else {
      charCount.style.color = '';
    }
  });
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // Less than a minute
  if (diff < 60000) {
    return 'JUST_NOW';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}M_AGO`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}H_AGO`;
  }
  
  // Format date
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show notification
function showNotification(message, type) {
  // Remove existing notifications
  const existing = document.querySelector('.cyber-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'cyber-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === 'success' ? 'var(--neon-green)' : 'var(--neon-red)'};
    color: var(--dark-bg);
    font-family: var(--font-display);
    font-size: 0.85rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
