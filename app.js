document.addEventListener('DOMContentLoaded', () => {

    // ─── STATE
    let userData = { name: '', firstName: '', age: 0, constituency: '' };
    let powerIndex = 0; // Start at 0 for animation
    const CIRCUMFERENCE = 163.4; // Updated from style.css stroke-dasharray

    const constituencyData = {
        'Indore': { margin: 1200, percentage: '0.08%', fullLabel: 'Indore-1' },
        'Bhopal': { margin: 2500, percentage: '0.04%', fullLabel: 'Bhopal Central' },
        'Khargone': { margin: 1200, percentage: '0.08%', fullLabel: 'Khargone' }
    };

    const STEPS = [
        { id: 1, label: 'Eligibility', boost: 12, msg: (n) => `Great start, ${n}! ✅ Your eligibility is confirmed. You're officially on the path to making your vote count.` },
        { id: 2, label: 'Form 6', boost: 10, msg: (n) => `Great job, ${n}! 📝 Completing Form 6 is the single most important step in the democratic process. Your voting power has increased!` },
        { id: 3, label: 'Verification', boost: 8, msg: (n) => `Excellent, ${n}! 🔍 Your voter details are now under verification. One step away from being election-ready!` },
        { id: 4, label: 'e-EPIC', boost: 10, msg: (n) => `🎉 Congratulations, ${n}! Your e-EPIC voter ID is secured. You are now 100% election-ready. Go vote!` },
    ];
    let completedSteps = new Set();

    // ─── DOM REFS
    const onboardingForm = document.getElementById('onboarding-form');
    const onboardingScreen = document.getElementById('onboarding-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const displayName = document.getElementById('display-name');
    const displayAge = document.getElementById('display-age');
    const displayConstituency = document.getElementById('display-constituency');
    const displayEligibility = document.getElementById('display-eligibility');
    const impactConst = document.getElementById('impact-constituency');
    const chatArea = document.getElementById('chat-area');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const actionTiles = document.querySelectorAll('.action-tile');
    const powerRingFill = document.getElementById('power-ring-fill');
    const powerScoreEl = document.getElementById('power-score');
    const sidebar = document.getElementById('dashboard-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // ─── INITIALIZATION
    const savedUser = localStorage.getItem('voteSmartUser');
    if (savedUser) {
        userData = JSON.parse(savedUser);
        // Using a slight delay to ensure DOM is ready for transition
        setTimeout(() => initUser(true), 10);
    }

    function initUser(skipOnboarding = false) {
        updateUIFromData();
        if (skipOnboarding) {
            onboardingScreen.classList.remove('active');
            onboardingScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            dashboardScreen.classList.add('active');
            sendWelcomeMessage();
        } else {
            transitionToDashboard();
        }
    }

    function updateUIFromData() {
        const nameEls = document.querySelectorAll('#display-name, .display-name');
        const constEls = document.querySelectorAll('#display-constituency, .display-constituency');
        
        nameEls.forEach(el => el.textContent = userData.firstName || userData.name);
        constEls.forEach(el => el.textContent = userData.constituency);
        
        if (displayAge) displayAge.textContent = `${userData.age} yrs`;
        if (impactConst) impactConst.textContent = userData.constituency;

        // Update Impact Calculator Text
        const impactText = document.querySelector('.impact-text');
        if (impactText) {
            const data = constituencyData[userData.constituency] || { margin: 1200, percentage: '0.08%', fullLabel: userData.constituency };
            if (userData.constituency === 'Indore') {
                impactText.innerHTML = `<strong>${data.fullLabel}:</strong> Pichli baar sirf 1,200 votes ka margin tha. Aapka vote total margin ka 0.08% hai!`;
            } else {
                impactText.innerHTML = `<strong>${data.fullLabel}:</strong> Last election was decided by only ${data.margin.toLocaleString()} votes. Your 1 vote represents <strong>${data.percentage}</strong> of the winning margin!`;
            }
        }

        if (userData.age >= 18) {
            displayEligibility.textContent = '✓ Eligible';
            displayEligibility.className = 'badge-eligible';
        } else {
            displayEligibility.textContent = '✗ Not Eligible';
            displayEligibility.className = 'badge-ineligible';
        }
        
        // Initial ring state (0%)
        powerRingFill.style.strokeDashoffset = CIRCUMFERENCE;
    }

    // ─── ONBOARDING SUBMIT
    onboardingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('userName').value.trim();
        const age = parseInt(document.getElementById('userAge').value, 10);
        const sel = document.getElementById('userConstituency');
        const constituencyText = sel.options[sel.selectedIndex].text;
        
        // Validation check
        if (!name || isNaN(age) || age < 18 || !sel.value) {
            alert('Please fill all required fields correctly (Age must be 18+).');
            return;
        }
        
        userData = { name, firstName: name.split(' ')[0], age, constituency: constituencyText };
        localStorage.setItem('voteSmartUser', JSON.stringify(userData));
        initUser();
    });

    // ─── RESET SESSION
    const resetBtn = document.getElementById('reset-onboarding');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset your session? All progress will be cleared.')) {
                localStorage.removeItem('voteSmartUser');
                window.location.reload();
            }
        });
    }

    // ─── TRANSITION
    function transitionToDashboard() {
        onboardingScreen.classList.remove('active');
        onboardingScreen.classList.add('fade-out');
        setTimeout(() => {
            onboardingScreen.classList.add('hidden');
            onboardingScreen.classList.remove('fade-out');
            dashboardScreen.classList.remove('hidden');
            setTimeout(() => {
                dashboardScreen.classList.add('active');
                sendWelcomeMessage();
            }, 50);
        }, 600);
    }

    function sendWelcomeMessage() {
        setTimeout(() => {
            const welcome = `Namaste <strong>${userData.name}</strong>! Welcome to the <strong>${userData.constituency}</strong> hub. Aapka voting power abhi 60% hai, chaliye isse 100% karte hain!`;
            appendMessage('bot', welcome);
            setTimeout(() => setPowerRing(60, true), 800);
        }, 600);
    }

    // ─── POWER INDEX
    function setPowerRing(percent, animate) {
        powerIndex = Math.min(100, percent);
        const offset = CIRCUMFERENCE - (powerIndex / 100) * CIRCUMFERENCE;
        if (!animate) {
            powerRingFill.style.transition = 'none';
            powerRingFill.style.strokeDasharray = CIRCUMFERENCE;
            powerRingFill.style.strokeDashoffset = CIRCUMFERENCE;
        } else {
            powerRingFill.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.2,0.8,0.2,1)';
            powerRingFill.style.strokeDasharray = CIRCUMFERENCE;
            powerRingFill.style.strokeDashoffset = offset;
            animateScore(powerIndex);
        }
    }

    function animatePowerIncrease(newPercent) {
        const oldPercent = powerIndex;
        powerIndex = Math.min(100, newPercent);
        const offset = CIRCUMFERENCE - (powerIndex / 100) * CIRCUMFERENCE;
        powerRingFill.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.2,0.8,0.2,1)';
        powerRingFill.style.strokeDashoffset = offset;
        animateScore(powerIndex, oldPercent);
        const widget = document.querySelector('.vote-impact-widget');
        widget.classList.add('power-flash');
        setTimeout(() => widget.classList.remove('power-flash'), 1000);
        
        if (powerIndex >= 100) {
            triggerCelebration();
        }
    }

    function triggerCelebration() {
        const widget = document.querySelector('.vote-impact-widget');
        if (widget) widget.classList.add('golden-glow');
        
        // Confetti Burst
        const colors = ['#FFD700', '#00d2ff', '#28a745', '#ff3333', '#ffffff'];
        for (let i = 0; i < 120; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-particle';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            confetti.style.animationDelay = (Math.random() * 1) + 's';
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = confetti.style.width;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
        
        setTimeout(() => {
            appendMessage('bot', `Mubarak ho <strong>${userData.name}</strong>! Aap ab <strong>${userData.constituency}</strong> ke 100% Empowered Citizen ban chuke hain! 🇮🇳 Khargone ke youth voters is baar decider role mein hain, and you are leading the way! <span class="verified-badge" title="Verified Voter">🛡️</span>`);
        }, 1200);
    }

    function animateScore(target, from = null) {
        const start = from !== null ? from : parseInt(powerScoreEl.textContent, 10);
        const duration = 1400;
        const startTime = performance.now();
        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.round(start + (target - start) * progress);
            powerScoreEl.textContent = value + '%';
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ─── INTERACTIVE STEPPER
    const stepItems = document.querySelectorAll('.step');
    const stepResponses = [
        "Are you 18+ and an Indian citizen? (Yes/No)",
        "Have you applied for Form 6 on voters.eci.gov.in?",
        "Verification is done by your local BLO. Have you received a visit?",
        "Congratulations! You can now download your e-EPIC."
    ];

    stepItems.forEach((step, index) => {
        step.addEventListener('click', () => {
            appendMessage('bot', stepResponses[index]);
            
            // Optional: Visually mark as active/visited
            stepItems.forEach(s => s.classList.remove('current-focus'));
            step.classList.add('current-focus');
            
            // Existing completion logic if needed
            const dot = step.querySelector('.step-dot');
            if (dot && !dot.classList.contains('green')) {
                dot.classList.add('green');
                step.classList.add('completed');
                const newPower = Math.min(100, powerIndex + 2);
                animatePowerIncrease(newPower);
            }
        });
    });

    // ─── SIDEBAR COLLAPSE
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const icon = sidebarToggle.querySelector('svg polyline');
        if (sidebar.classList.contains('collapsed')) {
            icon.setAttribute('points', '9 18 15 12 9 6');
            sidebarToggle.title = 'Expand sidebar';
        } else {
            icon.setAttribute('points', '15 18 9 12 15 6');
            sidebarToggle.title = 'Collapse sidebar';
        }
    });

    // ─── MOBILE DRAWER
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    });
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    // ─── SHARE IMPACT
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareText = `Main ${userData.constituency || 'MP'} ka ek ${powerIndex}% Empowered Voter ban gaya hoon! Aapka Power Index kya hai? Check out VoteSmart AI.`;
            const shareData = {
                title: 'VoteSmart AI - Empowered Voter',
                text: shareText,
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
                    showToast('Link & Message Copied!');
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Error sharing:', err);
            }
        });
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ─── QUICK ACTIONS
    actionTiles.forEach(tile => {
        tile.addEventListener('click', () => {
            const action = tile.dataset.action;
            handleAction(action, tile.textContent.trim());
        });
    });

    function handleAction(action, label) {
        appendMessage('user', label);
        showBotThinking(() => {
            switch (action) {
                case 'register': handleRegister(); break;
                case 'compare': handleCompare(); break;
                case 'timeline': handleTimeline(); break;
                case 'why-vote': handleWhyVote(); break;
                case 'candidate-a': handleCandidateA(); break;
                case 'candidate-b': handleCandidateB(); break;
                case 'help-decide': handleHelpMeDecide(); break;
                case 'priority-roads': handlePrioritySelection('roads'); break;
                case 'priority-edu': handlePrioritySelection('edu'); break;
                case 'speak': speakText("I am VoteSmart AI, your guide to MP Elections. I can help you with registration, candidate comparisons, and more."); break;
                default: appendMessage('bot', 'I can help with that! Ask me anything about the upcoming MP Elections.');
            }
        });
    }

    // ─── SEND
    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;
        typingIndicator.classList.add('hidden');
        chatInput.value = '';
        appendMessage('user', text);
        const lower = text.toLowerCase();
        showBotThinking(() => {
            if (lower.includes('register') || lower.includes('form 6') || lower.includes('registration')) handleRegister();
            else if (lower.includes('compare') || lower.includes('candidate')) handleCompare();
            else if (lower.includes('timeline') || lower.includes('date') || lower.includes('schedule')) handleTimeline();
            else if (lower.includes('why vote') || lower.includes('importance')) handleWhyVote();
            else if (lower.includes('candidate a') || lower.includes('representative')) handleCandidateA();
            else if (lower.includes('candidate b') || lower.includes('challenger')) handleCandidateB();
            else appendMessage('bot', `Good question, ${userData.firstName || 'voter'}! I can help you explore voter registration, candidate comparisons, election timelines, or why your vote matters in ${userData.constituency || 'your constituency'}.`);
        });
    }
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } });
    
    // Add backup Speak button to quick actions bar
    const quickActions = document.getElementById('quick-actions');
    if (quickActions) {
        const speakBtn = document.createElement('button');
        speakBtn.className = 'action-tile';
        speakBtn.dataset.action = 'speak';
        speakBtn.innerHTML = '🔊 Speak';
        speakBtn.addEventListener('click', () => handleAction('speak', '🔊 Speak'));
        quickActions.appendChild(speakBtn);
    }

    chatInput.addEventListener('input', () => {
        if (chatInput.value.length > 0) { typingIndicator.classList.remove('hidden'); chatArea.appendChild(typingIndicator); scrollToBottom(); }
        else typingIndicator.classList.add('hidden');
    });

    // ─── HANDLERS
    function handleRegister() { 
        completeStep(1); 
        appendMessage('bot', "Registration process bahut simple hai! Aapko bas ye documents ready rakhne honge:");
        appendChecklistComponent();
    }
    function handleCompare() {
        chatArea.innerHTML = ''; // Clear chat area as requested
        appendMessage('bot', `Ye raha <strong>${userData.constituency}</strong> ka head-to-head comparison. Candidate details check kijiye aur apna decision lijiye! 👇`);
        appendComparisonComponent();
    }
    function handleTimeline() {
        appendMessage('bot', `📅 <strong>MP Election Timeline</strong><br><br>• <strong>Phase 1:</strong> Voter list publication — next week<br>• <strong>Phase 2:</strong> Nomination filing — 3 weeks away<br>• <strong>Voting Day:</strong> 45 days away<br>• <strong>Results:</strong> 2 days after voting<br><br>Ye saari dates maine aapke blueprint mein update kar di hain!`);
    }
    function handleWhyVote() {
        appendMessage('bot', `🗳️ Aapka vote hi aapki <strong>superpower</strong> hai, ${userData.firstName || 'voter'}! In <strong>${userData.constituency}</strong>, last election sirf <strong>1,200 votes</strong> se decide hua tha. Khargone ke youth voters is baar decider role mein hain. So, don't miss out!`);
    }
    function handleCandidateA() {
        appendMessage('bot', `🔵 You selected <strong>Representative (Candidate A)</strong>. They have served 2 terms and focus on <strong>Infrastructure & Health</strong>. Their promise completion rate stands at <strong>68%</strong> — above the state average.<br><br>Would you like to <em>compare their promise completion rate with Challenger B?</em>`);
        appendFollowUpBtn('⚖️ Compare Both Candidates', 'compare');
    }
    function handleCandidateB() {
        appendMessage('bot', `🔴 You selected <strong>Challenger (Candidate B)</strong>. They are focusing on <strong>Education Reform & Youth Employment</strong>. Their primary campaign promise: <em>"500 new schools in 2 years."</em><br><br>Want to compare their promise completion rate with Representative A?`);
        appendFollowUpBtn('⚖️ Compare Both Candidates', 'compare');
    }

    function handleHelpMeDecide() {
        appendMessage('bot', `Har voter ki priority alag hoti hai. Aapke liye <strong>${userData.constituency}</strong> mein kya zyada zaroori hai? (Click one):`);
        appendFollowUpBtn('A. Roads & Infrastructure', 'priority-roads');
        appendFollowUpBtn('B. Education & Clean Image', 'priority-edu');
    }

    function handlePrioritySelection(priority) {
        showBotThinking(() => {
            if (priority === 'roads') {
                appendMessage('bot', "Candidate B has allocated 40% more funds to local road repairs in their manifesto. This matches your priority.");
            } else {
                appendMessage('bot', "Candidate A has a PG degree and 0 criminal records, aligning with your preference for clean governance.");
            }
        });
    }

    // ─── STEP COMPLETION
    function completeStep(stepId) {
        if (completedSteps.has(stepId)) {
            appendMessage('bot', `You've already completed <strong>${STEPS[stepId - 1].label}</strong>! Move to the next step to increase your Power Index further.`);
            return;
        }
        completedSteps.add(stepId);
        const step = STEPS[stepId - 1];
        const dot = document.getElementById(`step-dot-${stepId}`);
        if (dot) dot.classList.add('green');
        const stepEl = document.querySelector(`.step[data-step="${stepId}"]`);
        if (stepEl) stepEl.classList.add('active', 'completed');
        const nextStepEl = document.querySelector(`.step[data-step="${stepId + 1}"]`);
        if (nextStepEl) nextStepEl.classList.add('active');
        const newPower = Math.min(100, powerIndex + step.boost);
        animatePowerIncrease(newPower);
        appendMessage('bot', step.msg(userData.firstName || 'voter'));
        if (stepId < 4) {
            const nextStep = STEPS[stepId];
            setTimeout(() => { appendFollowUpBtn(`➡️ Continue to ${nextStep.label}`, `step-${stepId + 1}`); }, 600);
        }
    }

    // ─── UTILS
    function showBotThinking(callback) {
        typingIndicator.classList.remove('hidden');
        chatArea.appendChild(typingIndicator);
        scrollToBottom();
        setTimeout(() => { typingIndicator.classList.add('hidden'); callback(); }, 1100);
    }
    function appendMessage(sender, html) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        
        if (sender === 'bot') {
            msgDiv.innerHTML = `
                <div class="avatar">🤖</div>
                <div class="message-bubble"></div>
                <span class="speaker-icon" style="cursor:pointer; margin-left:8px; opacity:0;" title="Listen">🔊</span>
            `;
            const bubble = msgDiv.querySelector('.message-bubble');
            const icon = msgDiv.querySelector('.speaker-icon');
            chatArea.appendChild(msgDiv);
            chatArea.appendChild(typingIndicator);
            
            typeWriter(bubble, html, () => {
                icon.style.opacity = "1";
                icon.addEventListener('click', () => {
                    const textContent = bubble.innerText;
                    speakText(textContent);
                });
                scrollToBottom();
            });
        } else {
            msgDiv.innerHTML = `<div class="message-bubble">${html}</div>`;
            chatArea.appendChild(msgDiv);
            chatArea.appendChild(typingIndicator);
            scrollToBottom();
        }
    }

    function typeWriter(element, html, callback) {
        let i = 0;
        const interval = setInterval(() => {
            if (html[i] === '<') {
                const endTag = html.indexOf('>', i);
                element.innerHTML += html.substring(i, endTag + 1);
                i = endTag + 1;
            } else {
                element.innerHTML += html[i];
                i++;
            }
            scrollToBottom();
            if (i >= html.length) {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 20);
    }

    function speakText(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop current
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a Hindi voice if available, otherwise default
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(v => v.lang.includes('hi')) || voices.find(v => v.lang.includes('en'));
        if (hindiVoice) utterance.voice = hindiVoice;
        
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
    function appendFollowUpBtn(label, action) {
        const wrap = document.createElement('div');
        wrap.className = 'followup-btn-wrap';
        wrap.innerHTML = `<button class="followup-btn">${label}</button>`;
        wrap.querySelector('button').addEventListener('click', () => {
            wrap.remove();
            if (action.startsWith('step-')) {
                const stepId = parseInt(action.split('-')[1], 10);
                appendMessage('user', label);
                showBotThinking(() => completeStep(stepId));
            } else {
                handleAction(action, label);
            }
        });
        chatArea.appendChild(wrap);
        chatArea.appendChild(typingIndicator);
        scrollToBottom();
    }
    function scrollToBottom() { requestAnimationFrame(() => { chatArea.scrollTop = chatArea.scrollHeight; }); }

    // ─── COMPARISON
    function appendComparisonComponent() {
        const compDiv = document.createElement('div');
        compDiv.className = 'comparison-component';
        compDiv.innerHTML = `
            <div class="candidates-wrapper">
                <div class="candidate-card green-glow" id="card-a">
                    <h4>Candidate A</h4>
                    <p>Current Representative</p>
                    <div class="stat"><span>Education:</span><strong>PG</strong></div>
                    <div class="stat"><span>Criminal Cases:</span><strong>0</strong></div>
                    <button class="followup-btn check-details" style="margin-top:10px; width:100%;">Check Details</button>
                </div>
                <div class="vs-badge">VS</div>
                <div class="candidate-card pulse-red-glow" id="card-b">
                    <h4>Candidate B</h4>
                    <p>Challenger</p>
                    <div class="stat"><span>Education:</span><strong>Graduate</strong></div>
                    <div class="stat"><span>Criminal Cases:</span><strong style="color:#dc3545;">3</strong></div>
                    <button class="followup-btn check-details" style="margin-top:10px; width:100%;">Check Details</button>
                </div>
            </div>
            <div class="impact-calculator">
                <p>📊 <strong>MP Avg Margin:</strong> 500 votes.</p>
                <p>⚡ Your vote represents <strong>0.2%</strong> of the decision in <strong>${userData.constituency || 'your constituency'}</strong>!</p>
                <p class="accessibility-notice">Voice support available for visually impaired & elderly voters. 🔊</p>
            </div>`;
        chatArea.appendChild(compDiv);
        chatArea.appendChild(typingIndicator);
        scrollToBottom();
        
        compDiv.querySelectorAll('.check-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                appendMessage('user', 'Check Details');
                showBotThinking(() => {
                    appendMessage('bot', 'Transparency in leadership is the cornerstone of democracy. A clean record ensures that your representative focuses on public service rather than legal battles. Always verify candidate backgrounds on the ECI website before voting!');
                });
            });
        });
        setTimeout(() => {
            const counters = compDiv.querySelectorAll('.count-up.pending');
            counters.forEach(counter => {
                counter.classList.remove('pending');
                const target = +counter.getAttribute('data-count');
                const suffix = counter.getAttribute('data-suffix');
                if (target === 0) {
                    counter.textContent = '0' + suffix;
                    const sibling = counter.nextElementSibling;
                    if (sibling && sibling.classList.contains('clean-icon')) sibling.classList.remove('hidden');
                    return;
                }
                let current = 0;
                const inc = target / 40;
                const timer = setInterval(() => {
                    current += inc;
                    if (current >= target) {
                        counter.textContent = target + suffix;
                        clearInterval(timer);
                        if (counter.classList.contains('red-count')) {
                            const card = document.getElementById('card-b');
                            if (card) card.classList.add('criminal-pulse-active');
                        }
                    } else { counter.textContent = Math.floor(current) + suffix; }
                }, 1200 / 40);
            });
        }, 300);
        compDiv.querySelector('#card-a').addEventListener('click', () => handleAction('candidate-a', '🔵 Candidate A'));
        compDiv.querySelector('#card-b').addEventListener('click', () => handleAction('candidate-b', '🔴 Candidate B'));
        
        // Inject "Help Me Decide" button
        setTimeout(() => {
            appendFollowUpBtn('🤔 Help Me Decide', 'help-decide');
        }, 800);
    }

    function appendChecklistComponent() {
        const checkDiv = document.createElement('div');
        checkDiv.className = 'checklist-card';
        checkDiv.innerHTML = `
            <h4>Required Documents</h4>
            <div class="checklist-item" data-item="photo">
                <div class="checkbox-dummy"></div>
                <span>Passport Size Photo (Digital)</span>
            </div>
            <div class="checklist-item" data-item="age">
                <div class="checkbox-dummy"></div>
                <span>Age Proof (Aadhar/10th Marksheet)</span>
            </div>
            <div class="checklist-item" data-item="address">
                <div class="checkbox-dummy"></div>
                <span>Address Proof (Electricity Bill/Voter ID)</span>
            </div>
        `;
        
        checkDiv.querySelectorAll('.checklist-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('checked');
            });
        });

        chatArea.appendChild(checkDiv);
        chatArea.appendChild(typingIndicator);
        scrollToBottom();
    }

});