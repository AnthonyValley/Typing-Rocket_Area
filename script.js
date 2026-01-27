// --- FUNZIONE OCCHIO PASSWORD ---
function togglePassword() {
    var passwordInput = document.getElementById('password');
    var toggleBtn = document.querySelector('.password-toggle');
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleBtn.innerText = "🙈"; 
    } else {
        passwordInput.type = "password";
        toggleBtn.innerText = "👁️"; 
    }
}

// --- LOGICA MENU A TENDINA PERSONALIZZATO ---
function toggleCustomSelect() {
    document.querySelector('.custom-select-wrapper').classList.toggle('open');
}

function selectOption(value, text) {
    document.getElementById('custom-select-text').innerText = text;
    document.querySelector('.custom-select-wrapper').classList.remove('open');
    var realSelect = document.getElementById('difficulty-select');
    realSelect.value = value;
    checkCustomMode(); 
    document.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
}

window.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.custom-select-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
    }
});
// ---------------------------------------------


function createStars() {
    const container = document.getElementById('stars-container');
    for(let i=0; i<150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        const size = Math.random() * 3; 
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.animationDuration = (Math.random() * 3 + 1) + 's';
        star.style.animationDelay = Math.random() + 's';
        container.appendChild(star);
    }
}
createStars();

var SUPABASE_URL = 'https://ukmwguhqvjfomwbevdaa.supabase.co'; 
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbXdndWhxdmpmb213YmV2ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTA4MjcsImV4cCI6MjA4NDMyNjgyN30.6suoez0xLoAJ_VjNdz63xVMikH9n7lUvSx0BvQWFM68'; 
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const alfabeto = ["A","B","C","D","E","F","G","H","I","L","M","N","O","P","Q","R","S","T","U","V","Z"];
const elem_words = ["CASA","SOLE","LUNA","MARE","PANE","ERBA","LUCE","PERA","MELA","FIORE","GATTO","CANE","LUPO","ORSO","RANA","VITA","AUTO","BICI","NUBI","CIELO","ORO","BLU","ROSA","VIOLA","NERO","ALTO","PURO","RISO","OLIO","SALE","PEPE","UVA"];
const med_words = ["SCUOLA","AMICO","TEMPO","GIOCO","STUDIO","LIBRO","PENNA","BANCO","PRATO","FIUME","MONTE","CARTA","MATITA","COLORE","ALBERO","FOGLIA","RADICE","STORIA","CALCIO","SPORT","NUOTO","PIANO","FORTE","DOLCE","AMARO","ESTATE","INVERNO","AUTUNNO","STRADA","PIAZZA","NONNO","PADRE","MADRE","CUGINO","SORELLA","REGINA","CASTELLO"];
const sup_words = ["INFORMATICA","LETTERATURA","MATEMATICA","GEOGRAFIA","FILOSOFIA","TECNOLOGIA","PROGRAMMA","SISTEMA","INTERNET","CONNESSIONE","ALGORITMO","VARIABILE","FUNZIONE","DATABASE","SICUREZZA","SVILUPPO","PROGETTO","RELAZIONE","DOCUMENTO","SCRITTURA","TASTIERA","SCHERMO","MEMORIA","DIGITALE","VIRTUALE","SOCIALE","UNIVERSO","GALASSIA","ELETTRICITA","MAGNETISMO","GRAVITA","BIOLOGIA","CHIMICA","MOLECOLA","CELLULA","ENERGIA","AMBIENTE","FUTURO"];

var dbContenuti = { 
    livello1: [...alfabeto, ...elem_words], 
    livello2: [...alfabeto, ...med_words], 
    livello3: [...alfabeto, ...sup_words] 
};

var currentUser = null;
var gameState = { active: false, paused: false, score: 0, missed: 0, level: 'livello1', rockets: [], spawnRate: 2000, riseSpeed: 1, currentInput: "", spawnTimer: null, timeLeft: 90, timerInterval: null, lastWords: [], customWords: [], customMode: false, zenMode: false };

function showAlert(title, msg) { document.getElementById('alert-title').innerText = title; document.getElementById('alert-msg').innerText = msg; document.getElementById('alert-overlay').style.display = 'flex'; }
function closeAlert() { document.getElementById('alert-overlay').style.display = 'none'; }
function openTutorial() { document.getElementById('tutorial-overlay').style.display = 'flex'; }
function closeTutorial() { document.getElementById('tutorial-overlay').style.display = 'none'; }

async function doLogin() {
    var u = document.getElementById('username').value.trim();
    var p = document.getElementById('password').value.trim();
    var msg = document.getElementById('login-msg');
    if(!u || !p) { showAlert("ERRORE", "Inserisci Username e Password"); return; }
    msg.innerText = "Connessione...";
    var { data: users, error } = await supabase.from('utenti').select('*').eq('username', u);
    if (error) { showAlert("ERRORE DI RETE", "Controlla la connessione"); msg.innerText = ""; return; }
    if (users.length > 0) {
        if (users[0].password === p) proceedToMenu(u);
        else { msg.innerText = ""; showAlert("ACCESSO NEGATO", "Password errata."); }
    } else {
        var { error: insertError } = await supabase.from('utenti').insert([{ username: u, password: p }]);
        if(!insertError) proceedToMenu(u);
        else { msg.innerText = ""; showAlert("ERRORE", "Impossibile creare utente."); }
    }
}
function proceedToMenu(u) { 
    currentUser = u; 
    document.getElementById('display-user').innerText = u; 
    document.getElementById('login-msg').innerText = ""; 
    updateSliderFill(document.getElementById('cust-speed'));
    showScreen('menu-screen'); 
}

function updateSliderFill(el) {
    var val = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.backgroundSize = val + '% 100%';
    document.getElementById('speed-val').innerText = el.value;
}

async function saveScore() { 
    if(!currentUser || gameState.score === 0 || gameState.customMode) return; 
    await supabase.from('partite').insert([{ username: currentUser, score: gameState.score, livello: gameState.level }]); 
}

function showHistory(fromGame=false) { 
    showScreen('history-screen');
    if(fromGame) {
        document.getElementById('history-subtitle').innerText = "PARTITA TERMINATA - PUNTI: " + gameState.score;
    } else {
        document.getElementById('history-subtitle').innerText = "";
    }
    var cat = (fromGame && !gameState.customMode) ? gameState.level : 'livello1';
    fetchLeaderboard(cat); 
}

async function fetchLeaderboard(category) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(category==='livello1') document.getElementById('btn-elem').classList.add('active');
    if(category==='livello2') document.getElementById('btn-med').classList.add('active');
    if(category==='livello3') document.getElementById('btn-sup').classList.add('active');
    var list = document.getElementById('history-list'); list.innerHTML = "Caricamento...";
    var { data: scores } = await supabase.from('partite').select('*').eq('livello', category).order('score', { ascending: false }).limit(10);
    list.innerHTML = "";
    if (!scores || scores.length === 0) list.innerHTML = "<li>Nessun record.</li>";
    else scores.forEach((row, i) => { 
        var rank = (i===0) ? '🥇' : (i===1) ? '🥈' : (i===2) ? '🥉' : (i+1) + '°';
        var li = document.createElement('li'); 
        li.innerHTML = `<span>${rank} <b>${row.username}</b></span> <span style="color:var(--gold);">${row.score}</span>`; 
        list.appendChild(li); 
    });
}

// FUNZIONE SPECIFICA PER GAME OVER: SOLO TOP 3
async function fetchGameOverLeaderboard() {
    var list = document.getElementById('gameover-leaderboard');
    list.innerHTML = "<li>Caricamento...</li>";
    
    if(gameState.customMode) {
        list.innerHTML = "<li>Classifica non disponibile in modalità personalizzata</li>";
        return;
    }

    var { data: scores } = await supabase.from('partite').select('*').eq('livello', gameState.level).order('score', { ascending: false }).limit(3); 
    list.innerHTML = "";
    if (!scores || scores.length === 0) list.innerHTML = "<li>Nessun record.</li>";
    else scores.forEach((row, i) => { 
        var isMe = row.username === currentUser && row.score === gameState.score ? "color:var(--accent-color)" : "";
        var rank = (i===0) ? '🥇' : (i===1) ? '🥈' : '🥉'; 
        var li = document.createElement('li'); 
        li.innerHTML = `<span style="${isMe}">${rank} <b>${row.username}</b></span> <span style="color:var(--gold);">${row.score}</span>`; 
        list.appendChild(li); 
    });
}

function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.style.display = 'none'); document.getElementById('game-interface').style.display = 'none'; document.getElementById('alert-overlay').style.display = 'none'; document.getElementById('tutorial-overlay').style.display = 'none'; document.getElementById(id).style.display = 'flex'; }
function logout() { currentUser = null; document.getElementById('username').value=""; document.getElementById('password').value=""; showScreen('login-screen'); }
function backToMenu() { showScreen('menu-screen'); }

function checkCustomMode() {
    var val = document.getElementById('difficulty-select').value;
    if(val === 'custom') document.getElementById('custom-panel').style.display = 'block';
    else document.getElementById('custom-panel').style.display = 'none';
}

function startGame() {
    gameState.level = document.getElementById('difficulty-select').value;
    gameState.customMode = (gameState.level === 'custom');
    gameState.missed = 0; 
    
    if(gameState.customMode) {
        var useLetters = document.getElementById('cust-letters').checked;
        var useWords = document.getElementById('cust-words').checked;
        var speedVal = parseInt(document.getElementById('cust-speed').value);
        var mode = document.getElementById('cust-mode').value;
        if(!useLetters && !useWords) { showAlert("ERRORE", "Seleziona almeno lettere o parole!"); return; }

        gameState.customWords = [];
        if(useLetters) gameState.customWords = [...gameState.customWords, ...alfabeto];
        if(useWords) gameState.customWords = [...gameState.customWords, ...elem_words, ...med_words, ...sup_words]; 

        gameState.riseSpeed = 0.5 + (speedVal * 0.2); 
        gameState.spawnRate = 3500 - (speedVal * 250); 
        if(gameState.spawnRate < 800) gameState.spawnRate = 800; 
        document.getElementById('level-label').innerText = "CUSTOM";
        gameState.zenMode = (mode === 'zen');
    } else {
        if(gameState.level === 'livello1') { gameState.riseSpeed = 0.7; gameState.spawnRate = 2800; document.getElementById('level-label').innerText = "LIVELLO 1"; }
        if(gameState.level === 'livello2') { gameState.riseSpeed = 1.1; gameState.spawnRate = 2300; document.getElementById('level-label').innerText = "LIVELLO 2"; }
        if(gameState.level === 'livello3') { gameState.riseSpeed = 1.3; gameState.spawnRate = 2100; document.getElementById('level-label').innerText = "LIVELLO 3"; }
        gameState.zenMode = false;
    }
    
    updateHudLayout(); 
    showScreen('game-interface'); document.getElementById('game-interface').style.display = 'block';
    document.getElementById('pause-overlay').style.display = 'none'; 
    document.getElementById('gameover-overlay').style.display = 'none';
    
    gameState.active = true; gameState.paused = false; gameState.score = 0; gameState.rockets = []; gameState.currentInput = ""; gameState.lastWords = [];
    document.querySelectorAll('.rocket-container').forEach(el => el.remove());
    document.getElementById('score').innerText = "0"; document.getElementById('input-display').innerText = "";
    document.getElementById('input-display').style.borderColor = "var(--accent-color)";
    
    // TIMER COUNTDOWN DA 90 SECONDI
    gameState.timeLeft = 90;
    clearInterval(gameState.timerInterval); 
    gameState.timerInterval = setInterval(updateTimerUI, 1000); 
    updateTimerUI(); 
    
    loop(); scheduleSpawn();
}

function updateHudLayout() {
    var scoreContainer = document.getElementById('score-container');
    if (gameState.zenMode) {
        scoreContainer.innerHTML = `PUNTI: <span id="score" style="color:var(--gold)">0</span> | <span style="color:var(--danger-color)">PERSI: <span id="missed-count">0</span></span>`;
    } else {
        scoreContainer.innerHTML = `PUNTI: <span id="score" style="color:var(--gold)">0</span>`;
    }
}

function updateTimerUI() { 
    if(!gameState.paused) {
        gameState.timeLeft--;
        document.getElementById('timer').innerText = gameState.timeLeft;
        if(gameState.timeLeft <= 0 && !gameState.zenMode) {
            gameOver(true); // Tempo scaduto = Vittoria
        }
    } 
}

function togglePause() { 
    gameState.paused = !gameState.paused; 
    document.getElementById('pause-overlay').style.display = gameState.paused ? 'flex' : 'none'; 
    if(gameState.paused) {
        var statsText = `PUNTI: <b style="color:var(--gold)">${gameState.score}</b>`;
        if(gameState.zenMode) statsText += `<br>PERSI: <b style="color:var(--danger-color)">${gameState.missed}</b>`;
        document.getElementById('pause-stats').innerHTML = statsText;
        clearTimeout(gameState.spawnTimer);
    } else { 
        loop(); scheduleSpawn(); 
    }
}

function quitGame() { gameState.active = false; clearInterval(gameState.timerInterval); saveScore(); backToMenu(); }

function scheduleSpawn() { if(gameState.active && !gameState.paused) gameState.spawnTimer = setTimeout(() => { spawnRocket(); scheduleSpawn(); }, gameState.spawnRate); }

function spawnRocket() {
    if(gameState.paused) return;
    var contentList = gameState.customMode ? gameState.customWords : dbContenuti[gameState.level];
    
    var text;
    var attempts = 0;
    do {
        text = contentList[Math.floor(Math.random() * contentList.length)];
        attempts++;
    } while (gameState.lastWords.includes(text) && attempts < 10);
    gameState.lastWords.push(text); if(gameState.lastWords.length > 5) gameState.lastWords.shift();

    text = text.toUpperCase();

    var container = document.createElement('div');
    container.className = 'rocket-container';
    container.innerHTML = `<div class="rocket-icon">🚀</div><div class="rocket-text">${text}</div>`;
    
    var safe = false, posAttempts = 0, finalX = 0, startY = window.innerHeight + 50;
    var maxWidth = window.innerWidth > 600 ? window.innerWidth - 300 : window.innerWidth - 180;
    if (maxWidth < 50) maxWidth = 50;

    while(!safe && posAttempts < 15) {
        finalX = Math.floor(Math.random() * maxWidth) + 25; 
        safe = true;
        for(var r of gameState.rockets) {
            if (r.y > window.innerHeight - 300) { if (Math.abs(r.x - finalX) < 160) { safe = false; break; } }
        }
        posAttempts++;
    }
    if(!safe) return; 

    container.style.left = finalX + "px"; container.style.top = startY + "px";
    document.getElementById('game-interface').appendChild(container);
    gameState.rockets.push({ element: container, text: text, y: startY, x: finalX });
}

function loop() {
    if(!gameState.active || gameState.paused) return;
    gameState.rockets.forEach((r) => {
        r.y -= gameState.riseSpeed; 
        r.element.style.top = r.y + "px";
        if(r.y < -150) {
            if (gameState.zenMode) {
                r.element.remove(); r.y = -9999; 
                gameState.missed++;
                document.getElementById('missed-count').innerText = gameState.missed;
            } else {
                document.getElementById('gameover-overlay').style.display = 'flex';
                gameOver(false); // Game Over per morte
            }
        }
    });
    gameState.rockets = gameState.rockets.filter(r => r.y > -200);
    if(gameState.active) requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
    if(!gameState.active || gameState.paused) return;

    if(e.key === 'Backspace') {
        gameState.currentInput = gameState.currentInput.slice(0, -1);
    }
    else if(e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        var inputChar = e.key.toUpperCase();
        var temp = gameState.currentInput + inputChar;
        
        if(gameState.rockets.some(r => r.text.startsWith(temp))) {
            gameState.currentInput += inputChar;
        } else { 
            var d = document.getElementById('input-display'); 
            d.style.borderColor = "var(--danger-color)"; 
            setTimeout(()=>d.style.borderColor="var(--accent-color)", 200); 
            gameState.currentInput = ""; 
        }
    }
    document.getElementById('input-display').innerText = gameState.currentInput;
    
    var matchIdx = gameState.rockets.findIndex(r => r.text === gameState.currentInput);
    if(matchIdx !== -1) {
        var hit = gameState.rockets[matchIdx].element;
        hit.style.transform = "scale(1.5) rotate(360deg)"; hit.style.opacity = "0";
        setTimeout(() => hit.remove(), 300); 
        gameState.rockets.splice(matchIdx, 1);
        var pts = 10;
        if(gameState.level === 'livello2') pts = 20; if(gameState.level === 'livello3') pts = 30; if(gameState.customMode) pts = 5;
        gameState.score += pts;
        gameState.currentInput = ""; 
        document.getElementById('input-display').innerText = ""; 
        document.getElementById('score').innerText = gameState.score;
    }
});

async function gameOver(victory) { 
    gameState.active = false; 
    clearInterval(gameState.timerInterval); 
    
    // Imposta testi
    var title = document.getElementById('end-title');
    var reason = document.getElementById('end-reason');
    
    if (victory) {
        title.innerText = "MISSIONE COMPLETATA! 🏆";
        title.style.color = "var(--gold)";
        reason.innerText = "Tempo scaduto. Ottimo lavoro!";
    } else {
        title.innerText = "MISSIONE FALLITA! 💥";
        title.style.color = "var(--danger-color)";
        reason.innerText = "Un razzo è scappato!";
    }
    document.getElementById('final-score').innerText = gameState.score;
    
    await saveScore();
    await fetchGameOverLeaderboard();
    
    document.getElementById('gameover-overlay').style.display = 'flex';
}