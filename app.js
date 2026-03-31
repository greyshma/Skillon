/* =============================
   SKILLON – Frontend Application
   ============================= */

const API = 'http://localhost:3000/api';

// ─── API Helper ───────────────────────────────────────────────────────────────
const api = {
  async get(path) {
    const r = await fetch(API + path);
    return r.json();
  },
  async post(path, body = {}) {
    const r = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  },
  simulateInactive() {
    api.post('/user/simulate-inactive').then(() => {
      appState.checkStatus();
    });
  }
};

// ─── Micro-project templates ───────────────────────────────────────────────────
const MICRO_PROJECTS = {
  concept: [
    'Write a 5-bullet summary of today\'s topic in your own words.',
    'Explain this concept to an imaginary student using an analogy.',
    'Find a real-world example of this concept and document it.',
  ],
  project: [
    'Build a minimal working prototype using today\'s skill.',
    'Create a simple interactive demo to showcase what you learned.',
    'Write clean, commented code that solves a small practical problem.',
  ],
  easy: [
    'Watch a 5-minute explainer on this topic and take notes.',
    'Draw a visual diagram of how this concept works.',
    'Solve 3 basic exercises to reinforce the fundamentals.',
  ]
};

// ─── AI-like analysis messages ─────────────────────────────────────────────────
const AI_MESSAGES = {
  active: [
    'Learning rhythm is stable. Comprehension looks solid — keep the momentum!',
    'Strong engagement detected. You\'re building real fluency in this area.',
    'Consistent progress noted. Adaptive path looks optimized for you.',
  ],
  struggling: [
    'Struggle pattern detected. Skillon has injected an easier path — no worries!',
    'Difficulty spike noticed. Switching to a lower-level bridge concept.',
    'Adaptive engine activated. Slower progression recommended.',
  ],
  inactive: [
    'Extended inactivity detected. A comeback path has been prepared.',
    'Welcome back! Resuming from a soft re-entry point.',
  ]
};

// ─── State Machine ─────────────────────────────────────────────────────────────
const appState = {
  user: null,
  roadmap: null,
  currentNode: null,
  selectedNodeId: null,
  network: null,
  assessmentScore: 0,
  currentQuestion: 0,
  tempGoal: 'Web Development',
  assessmentQuestions: [
    { 
      q: "Before we begin the calibration, what is your primary learning trajectory?", 
      opts: ["Web Development Engineering", "Data Science & Analytics", "Game Development", "AI / Machine Learning"], 
      isGoal: true 
    },
    { 
      scenario: "<strong>Scenario: The Production Outage</strong><br/>You just deployed a new feature for a client's e-commerce site. Five minutes later, the client calls you: users can't check out, and the site is throwing 500 Internal Server Errors.",
      q: "What is your immediate first step?", 
      opts: [
        "I don't know where to start.", 
        "Quickly revert the deployment to the previous stable version.", 
        "Check the server and application logs to identify the exact error trace before acting.", 
        "Write a script to automate health checks and implement blue-green deployments."
      ], 
      scores: [0, 1, 2, 3] 
    },
    { 
      scenario: "<strong>Scenario: The Scaling Bottleneck</strong><br/>The site is stable, but traffic has spiked by 10x. The database CPU is at 100% and queries are taking 5+ seconds.",
      q: "How do you architect a solution to handle this load securely?", 
      opts: [
        "I'm not exactly sure what a Database CPU is.", 
        "I would upgrade the database server to a larger cloud instance (Vertical Scaling).", 
        "I'd analyze the slow queries and add proper indexes to the database tables.", 
        "I'd implement a distributed caching layer (like Redis) and assign read-replicas."
      ], 
      scores: [0, 1, 2, 3] 
    }
  ],

  async init() {
    // First-time setup or restore
    const savedName = localStorage.getItem('skillon_name');
    if (!savedName) {
      this.showLogin();
    } else {
      try {
        this.user = await api.get('/user');
        this.user.name = savedName;
        this.roadmap = await api.get('/roadmap');
        this.refreshUI();
        this.checkStatus();
      } catch(e) {
        // backend not available - demo mode
        this.user = { name: savedName, confidenceIndex: 45, status: 'active', struggleCount: 0, currentNodeId: 'n1', level: localStorage.getItem('skillon_level') || 'Complete Beginner' };
        this.roadmap = this.getDemoRoadmap();
        this.refreshUI();
      }
    }
  },

  showLogin() {
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('assessment-overlay').classList.add('hidden');
  },

  startAssessment() {
    const name = document.getElementById('login-name').value.trim() || 'Arjun';
    localStorage.setItem('skillon_name', name);
    document.getElementById('login-overlay').classList.add('hidden');
    
    document.getElementById('assessment-overlay').classList.remove('hidden');
    
    // Reset steps
    document.querySelectorAll('.assess-step').forEach(el => el.classList.add('hidden'));
    document.getElementById('step-0').classList.remove('hidden');
  },

  nextAssessStep(stepNum) {
    // Validation for Step 0 (Goal Input)
    if (stepNum === 1) {
        const goalText = document.getElementById('arjun-goal').value.trim();
        if (goalText.length < 3) {
            this.showToast('⚠️ Please enter a meaningful goal (e.g. "SWE").', 'warning');
            return;
        }
    }
    
    document.querySelectorAll('.assess-step').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step-${stepNum}`).classList.remove('hidden');
  },

  async analyzeAndGenerate() {
    const taskResponse = document.getElementById('arjun-task').value.trim().toLowerCase();
    
    // Minimal constraint to block empty submits or single periods
    if (taskResponse.length < 2) {
        this.showToast('⚠️ Please write something to give us a starting point.', 'warning');
        return;
    }
    
    this.nextAssessStep(4);
    
    const goal = document.getElementById('arjun-goal').value;
    const reportBox = document.getElementById('analysis-report');
    
    // Quick handle for users who outright admit they do not know
    const idkVariations = ['idk', 'i dont know', 'i don\'t know', 'no idea', 'not sure', 'clueless'];
    if (idkVariations.some(v => taskResponse.includes(v)) || taskResponse.length < 10) {
        localStorage.setItem('skillon_level', 'Beginner Backend');
        
        reportBox.innerHTML = `
          <div style="text-align:left; margin-bottom:15px; background:rgba(0,0,0,0.2); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
            <p style="color:var(--success); margin-bottom:8px;"><i class="fa-solid fa-heart"></i> <strong>Honesty Tracked!</strong><br>
            <span style="color:var(--text-secondary);">It is completely okay that you don't know the answer to this! Database query optimization is an advanced engineering topic that many standard courses skip entirely.</span></p>
            
            <p style="color:var(--accent-base); margin-bottom:0;"><i class="fa-solid fa-seedling"></i> <strong>The Verdict:</strong><br>
            <span style="color:var(--text-secondary);">Because you admitted this transparently, I am constructing a deeply structured, fundamental roadmap from the ground up prioritizing architectural mastery. You've got this!</span></p>
          </div>`;
        return;
    }
    
    reportBox.innerHTML = '<div style="text-align:center; color:var(--text-secondary);"><i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing your intelligence profile...</div>';
    
    try {
        const response = await fetch('http://localhost:3000/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal, taskResponse })
        });
        const resData = await response.json();
        
        let aiData = resData.data;
        if(!aiData) throw new Error("Fallback to default local mock");
        
        localStorage.setItem('skillon_level', aiData.level || 'Advanced Backend');
        
        reportBox.innerHTML = `
          <div style="text-align:left; margin-bottom:15px; background:rgba(0,0,0,0.2); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
            <p style="color:var(--success); margin-bottom:8px;"><i class="fa-solid fa-check-circle"></i> <strong>Confirmed:</strong><br>
            <span style="color:var(--text-secondary);">${aiData.confirmed}</span></p>
            
            <p style="color:var(--warning); margin-bottom:8px;"><i class="fa-solid fa-triangle-exclamation"></i> <strong>The Gap:</strong><br>
            <span style="color:var(--text-secondary);">${aiData.gap}</span></p>
            
            <p style="color:var(--accent-base); margin-bottom:0;"><i class="fa-solid fa-bolt"></i> <strong>The Verdict:</strong><br>
            <span style="color:var(--text-secondary);">${aiData.verdict}</span></p>
          </div>`;
          
    } catch(err) {
        // Safe fallback in case the backend API fails
        reportBox.innerHTML = `
          <div style="text-align:left; margin-bottom:15px; background:rgba(0,0,0,0.2); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
            <p style="color:var(--success); margin-bottom:8px;"><i class="fa-solid fa-check-circle"></i> <strong>Confirmed:</strong><br>
            <span style="color:var(--text-secondary);">You know what an index is and correctly identified the missing index as the likely cause. You intuitively understand table scans and know <code>SELECT *</code> is wasteful.</span></p>
            
            <p style="color:var(--warning); margin-bottom:8px;"><i class="fa-solid fa-triangle-exclamation"></i> <strong>The Gap:</strong><br>
            <span style="color:var(--text-secondary);">You missed the <code>ORDER BY created_at</code>. Without a composite index on <code>(customer_id, created_at DESC)</code>, the DB finds the rows but still sorts thousands of them in memory. This specific gap comes up in every product company interview.</span></p>
            
            <p style="color:var(--accent-base); margin-bottom:0;"><i class="fa-solid fa-bolt"></i> <strong>The Verdict:</strong><br>
            <span style="color:var(--text-secondary);">Skipping 5-6 weeks of standard curriculum. Generating a hyper-focused, 8-week roadmap to close your backend gaps for Razorpay/Swiggy.</span></p>
          </div>`;
    }
  },

  async finishCalibration() {
    document.getElementById('assessment-overlay').classList.add('hidden');
    
    localStorage.setItem('skillon_level', 'Advanced Backend');
    const name = localStorage.getItem('skillon_name');

    try {
      this.user = await api.get('/user');
      this.user.name = name;
      this.roadmap = await api.post('/roadmap/generate', { interests: ['Backend'], level: 'Advanced' });
    } catch(e) {
      this.user = { name, confidenceIndex: 70, status: 'active', struggleCount: 0, currentNodeId: 'n1', level: 'Advanced Backend' };
      this.roadmap = this.getDemoRoadmap();
    }

    this.refreshUI();
  },

  getDemoRoadmap() {
    return {
      nodes: [
        { id: 'n1', label: 'Composite Indexes & Query Planning', type: 'concept', status: 'pending', difficulty: 'hard', explanation: 'You know indexes exist. Now learn how multi-column indexes work and why column order matters. Crucial for scaling DB performance.', prereqs: [] },
        { id: 'n2', label: 'Database Transactions & Atomicity', type: 'concept', status: 'locked', difficulty: 'hard', explanation: 'Every payment, booking, and inventory system relies on this. You cannot scale a product without strict atomicity.', prereqs: ['Composite Indexes & Query Planning'] },
        { id: 'n3', label: 'Race Conditions & Concurrent Writes', type: 'concept', status: 'locked', difficulty: 'hard', explanation: 'The exact bug that causes money to double-debit. Avoid data corruption under heavy concurrent load.', prereqs: ['Database Transactions & Atomicity'] },
        { id: 'n4', label: 'System Design Track', type: 'concept', status: 'locked', difficulty: 'expert', explanation: 'The 4-6 week track that separates juniors from mid-level engineers. Start thinking about architecture, bottlenecks, and load balancing.', prereqs: ['Race Conditions & Concurrent Writes'] },
        { id: 'n5', label: 'Simplified Payment Flow', type: 'project', status: 'locked', difficulty: 'expert', explanation: 'A robust mini-project combining composite indexes, transactions, and race-condition handling. Your interview talking point.', prereqs: ['System Design Track'] },
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' },
        { from: 'n4', to: 'n5' }
      ]
    };
  },

  logout() {
    localStorage.removeItem('skillon_name');
    localStorage.removeItem('skillon_level');
    this.user = null;
    this.roadmap = null;
    location.reload();
  },

  // ─── Navigation ───────────────────────────────────────────────────────────────
  navigate(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    document.getElementById(`${screen}-screen`).classList.add('active');
    document.getElementById(`nav-${screen}`).classList.add('active');

    if (screen === 'roadmap') this.renderRoadmap();
    if (screen === 'learning') this.renderLearning();
  },

  // ─── Refresh Dashboard ────────────────────────────────────────────────────────
  refreshUI() {
    if (!this.user || !this.roadmap) return;
    const node = this.roadmap.nodes.find(n => n.id === this.user.currentNodeId)
                 || this.roadmap.nodes.find(n => n.status === 'pending')
                 || this.roadmap.nodes[0];
    this.currentNode = node;

    // Name
    document.getElementById('dash-name').textContent = this.user.name;
    document.querySelectorAll('#wb-name').forEach(el => el.textContent = this.user.name);

    // Confidence Index
    const ci = this.user.confidenceIndex;
    this.animateCI(ci);

    // Focus card
    if (node) {
      document.getElementById('focus-title').textContent = node.label;
      document.getElementById('focus-desc').textContent = node.explanation;
      document.getElementById('focus-type-tag').textContent = node.type === 'project' ? 'Project' : 'Concept';
      document.getElementById('focus-type-tag').className = 'tag' + (node.type === 'project' ? ' project' : ' info');
      document.getElementById('focus-diff').textContent = node.difficulty || 'Normal';
    }

    // AI message
    const msgs = AI_MESSAGES[this.user.status] || AI_MESSAGES.active;
    document.getElementById('ai-msg-text').textContent = msgs[Math.floor(Math.random() * msgs.length)];

    // Status badge
    const badge = document.getElementById('user-status-badge');
    badge.innerHTML = `<span class="dot"></span> ${this.capitalise(this.user.status)}`;
    badge.className = `status-badge ${this.user.status}`;

    // Stats
    document.getElementById('tasks-done').textContent = this.tasksDone;
    document.getElementById('badge-count').textContent = document.querySelectorAll('.achv-badge.unlocked').length;

    // CI breakdown bars
    const quizPct = Math.min(100, ci * 1.1);
    const taskPct = Math.min(100, this.tasksDone * 15);
    document.getElementById('ci-quiz').style.width = quizPct + '%';
    document.getElementById('ci-tasks').style.width = taskPct + '%';
  },

  animateCI(value) {
    document.getElementById('ci-value').textContent = value;
    const circumference = 2 * Math.PI * 50; // r=50
    const dash = (value / 100) * circumference;
    document.getElementById('ci-circle').style.strokeDasharray = `${dash} ${circumference}`;
    document.getElementById('ci-circle').setAttribute('stroke', 'url(#grad)');
  },

  // ─── Check Status (Comeback / Struggle) ──────────────────────────────────────
  async checkStatus() {
    try { this.user = await api.get('/user'); } catch(e) {}
    if (this.user && this.user.status === 'inactive') {
      document.getElementById('comeback-modal').classList.remove('hidden');
    }
    this.refreshUI();
  },

  dismissComeback() {
    document.getElementById('comeback-modal').classList.add('hidden');
    if (this.user) this.user.status = 'active';
    this.unlockBadge(3); // "Comeback Kid"
    this.refreshUI();
  },

  // ─── Roadmap (Vis.js) ─────────────────────────────────────────────────────────
  renderRoadmap() {
    if (!this.roadmap) return;
    const container = document.getElementById('roadmap-network');
    container.innerHTML = '';

    const colorMap = {
      completed: { bg: '#16a34a', border: '#22c55e', font: '#fff' },
      pending:   { bg: '#4c46cc', border: '#6c63ff', font: '#fff' },
      locked:    { bg: '#1a1d35', border: '#2a2d45', font: '#666' },
    };

    const nodes = this.roadmap.nodes.map(n => ({
      id: n.id,
      label: n.label,
      color: {
        background: n.type === 'project' && n.status !== 'completed' ? '#7a4800' : colorMap[n.status]?.bg || '#1a1d35',
        border:     n.type === 'project' && n.status !== 'completed' ? '#f59e0b' : colorMap[n.status]?.border || '#2a2d45',
        highlight:  { background: '#4c46cc', border: '#9c95ff' }
      },
      font: {
        color: colorMap[n.status]?.font || '#555',
        size: 13,
        face: 'Outfit, sans-serif',
      },
      shape: n.type === 'project' ? 'diamond' : 'roundRect',
      size: 28,
      margin: { top: 10, bottom: 10, left: 14, right: 14 },
      borderWidth: n.id === this.user?.currentNodeId ? 3 : 1.5,
    }));

    const edges = this.roadmap.edges.map(e => ({
      from: e.from,
      to:   e.to,
      color: { color: 'rgba(108,99,255,0.4)', highlight: '#6c63ff' },
      arrows: { to: { enabled: true, scaleFactor: 0.7 } },
      smooth: { type: 'cubicBezier' },
    }));

    const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };

    const options = {
      layout: { hierarchical: { direction: 'LR', sortMethod: 'directed', levelSeparation: 180, nodeSpacing: 100 } },
      physics: { enabled: false },
      interaction: { hover: true, tooltipDelay: 200 },
      nodes: { widthConstraint: { maximum: 160 } },
    };

    this.network = new vis.Network(container, data, options);

    this.network.on('click', (params) => {
      if (params.nodes.length > 0) {
        this.selectedNodeId = params.nodes[0];
        this.showNodePanel(this.selectedNodeId);
      } else {
        document.getElementById('node-detail-panel').classList.add('hidden');
      }
    });
  },

  showNodePanel(nodeId) {
    const node = this.roadmap.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const panel = document.getElementById('node-detail-panel');
    panel.classList.remove('hidden');
    document.getElementById('np-title').textContent = node.label;
    document.getElementById('np-type').textContent = node.type === 'project' ? 'Project' : 'Concept';
    document.getElementById('np-type').className = 'tag' + (node.type === 'project' ? ' project' : '');
    document.getElementById('np-why').innerHTML = `<strong>Why this matters:</strong> ${node.explanation}`;
    document.getElementById('np-prereqs').innerHTML = `<strong>Prerequisites:</strong> ${node.prereqs?.length ? node.prereqs.join(', ') : 'None — this is your starting point.'}`;
  },

  focusNode() {
    if (!this.selectedNodeId) return;
    const node = this.roadmap.nodes.find(n => n.id === this.selectedNodeId);
    if (node && (node.status === 'pending' || node.status === 'completed')) {
      this.user.currentNodeId = this.selectedNodeId;
      this.currentNode = node;
      document.getElementById('node-detail-panel').classList.add('hidden');
      this.navigate('learning');
    } else {
      alert('This node is still locked. Complete prerequisites first!');
    }
  },

  // ─── Learning Screen ──────────────────────────────────────────────────────────
  renderLearning() {
    const node = this.currentNode;
    if (!node) return;

    document.getElementById('learn-title').textContent = node.label;
    document.getElementById('learn-type').textContent = node.type === 'project' ? 'Project' : 'Concept';
    document.getElementById('learn-type').className = 'tag' + (node.type === 'project' ? ' project' : ' info');
    document.getElementById('learn-diff').textContent = node.difficulty || 'Normal';
    document.getElementById('learn-explanation').textContent = node.explanation;

    // Prerequisites
    const prereqList = document.getElementById('learn-prereqs');
    prereqList.innerHTML = '';
    if (node.prereqs && node.prereqs.length > 0) {
      node.prereqs.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        prereqList.appendChild(li);
      });
    } else {
      prereqList.innerHTML = '<li>No prerequisites – this is an entry point!</li>';
    }

    // Micro-project
    const projPool = MICRO_PROJECTS[node.type] || MICRO_PROJECTS.concept;
    const proj = projPool[Math.floor(Math.random() * projPool.length)];
    document.getElementById('micro-project-text').textContent = proj;

    // Reset struggle hint
    document.getElementById('struggle-hint').textContent = '';
  },

  // ─── Task Actions ─────────────────────────────────────────────────────────────
  openQuiz() {
    const node = this.currentNode;
    if (!node) return;
    
    if (node.type === 'project') {
       this.finishTask();
       return;
    }

    const modal = document.getElementById('quiz-modal');
    modal.classList.remove('hidden');
    
    document.getElementById('quiz-question').textContent = `To complete "${node.label}", let's run a quick knowledge check. Which of the following is correct?`;
    
    const optionsObj = document.getElementById('quiz-options');
    optionsObj.innerHTML = `
      <div class="quiz-option" onclick="appState.handleQuizAnswer(false, this)">A completely unrelated and wrong approach.</div>
      <div class="quiz-option" onclick="appState.handleQuizAnswer(true, this)">The core principle of ${node.label} involves exactly what I studied.</div>
      <div class="quiz-option" onclick="appState.handleQuizAnswer(false, this)">A common misconception about this topic.</div>
    `;
  },

  handleQuizAnswer(isCorrect, element) {
    const opts = document.querySelectorAll('.quiz-option');
    opts.forEach(o => o.style.pointerEvents = 'none');
    
    if (isCorrect) {
      element.classList.add('correct');
      setTimeout(() => {
        document.getElementById('quiz-modal').classList.add('hidden');
        this.showToast('✅ Correct! You mastered this node.', 'success');
        this.finishTask();
      }, 1000);
    } else {
      element.classList.add('incorrect');
      setTimeout(() => {
        document.getElementById('quiz-modal').classList.add('hidden');
        this.showToast('❌ Incorrect context detected! Rerouting your path...', 'warning');
        this.struggleTask();
      }, 1000);
    }
  },

  async completeTask() {
    // Instead of completing right away, trigger the AI Quiz Challenge Mode
    this.openQuiz();
  },

  async finishTask() {
    const nodeId = this.currentNode?.id;
    if (!nodeId) return;

    try {
      const res = await api.post('/roadmap/complete', { nodeId });
      this.user = res.user;
      this.roadmap = res.roadmap;
    } catch(e) {
      // local demo mode update
      this.user.confidenceIndex = Math.min(100, this.user.confidenceIndex + 12);
      this.user.struggleCount = 0;
      this.user.status = 'active';
      const node = this.roadmap.nodes.find(n => n.id === nodeId);
      if (node) node.status = 'completed';
      const nextEdges = this.roadmap.edges.filter(e => e.from === nodeId);
      nextEdges.forEach(e => {
        const next = this.roadmap.nodes.find(n => n.id === e.to);
        if (next) next.status = 'pending';
      });
      const nextPending = this.roadmap.nodes.find(n => n.status === 'pending');
      if (nextPending) { this.user.currentNodeId = nextPending.id; this.currentNode = nextPending; }
    }

    this.tasksDone++;
    this.checkBadges();
    this.refreshUI();

    // Brief delay then go to next node
    setTimeout(() => this.renderLearning(), 500);
  },

  async struggleTask() {
    const nodeId = this.currentNode?.id;
    if (!nodeId) return;

    const sc = (this.user.struggleCount || 0) + 1;

    try {
      const res = await api.post('/roadmap/struggle', { nodeId });
      this.user = res.user;
      this.roadmap = res.roadmap;
    } catch(e) {
      this.user.struggleCount = sc;
      this.user.confidenceIndex = Math.max(0, this.user.confidenceIndex - 5);

      if (sc >= 2) {
        this.user.status = 'struggling';
        const easierId = 'n_easy_' + Date.now();
        const easyNode = {
          id: easierId, label: 'Refresher: Core Fundamentals', type: 'concept',
          status: 'pending', difficulty: 'easy',
          explanation: 'Let\'s revisit the fundamentals using a simpler approach. No pressure — Skillon adapts to you!',
          prereqs: []
        };
        this.roadmap.nodes.unshift(easyNode);
        this.roadmap.edges.push({ from: easierId, to: nodeId });
        this.user.currentNodeId = easierId;
        this.currentNode = easyNode;
        this.user.struggleCount = 0;
      }
    }

    const hint = document.getElementById('struggle-hint');
    if (sc === 1) {
      hint.textContent = '⚠️ Struggle noted. One more and Skillon will adapt the path for you.';
      this.showToast('Struggling noted. Keep going!', 'warning');
    } else {
      hint.textContent = '🔄 Adaptive engine triggered! A refresher path has been injected.';
      this.showToast('🔄 Path adapted! Easier content incoming.', 'warning');
    }

    this.refreshUI();
    setTimeout(() => this.renderLearning(), 600);
  },

  skipTask() {
    this.showToast('⏭️ Skipped. Moving to next topic.', 'info');
    const pending = this.roadmap.nodes.find(n => n.status === 'pending' && n.id !== this.currentNode?.id);
    if (pending) {
      this.user.currentNodeId = pending.id;
      this.currentNode = pending;
      this.renderLearning();
    }
  },

  startMicroProject() {
    this.showToast('🚀 Micro-project started! Use the "Complete" button when done.', 'accent');
  },

  // ─── Badges & Gamification ────────────────────────────────────────────────────
  checkBadges() {
    if (this.tasksDone === 1) this.unlockBadge(0); // First Steps
    if (this.tasksDone === 5) this.unlockBadge(5); // Unstoppable
    if (this.user.confidenceIndex >= 80) this.unlockBadge(4); // Master
    const node = this.currentNode;
    if (node && node.type === 'project') this.unlockBadge(2); // Builder
  },

  unlockBadge(index) {
    const badges = document.querySelectorAll('.achv-badge');
    if (badges[index] && badges[index].classList.contains('locked')) {
      badges[index].classList.remove('locked');
      badges[index].classList.add('unlocked');
      document.getElementById('badge-count').textContent =
        document.querySelectorAll('.achv-badge.unlocked').length;
      this.showToast('🏆 Badge Unlocked!', 'accent');
    }
  },

  // ─── Toast Notification ───────────────────────────────────────────────────────
  showToast(message, type = 'info') {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position:fixed; bottom:32px; right:32px; z-index:9999;
      background: ${type === 'success' ? '#16a34a' : type === 'warning' ? '#d97706' : type === 'accent' ? '#4c46cc' : '#1a1d35'};
      color:white; padding:14px 22px; border-radius:12px;
      font-size:0.88rem; font-weight:600; font-family:Outfit,sans-serif;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
      animation: fadeIn 0.25s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
  },

  capitalise(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // ─── Chatbox Implementation ─────────────────────────────────────────────────────
  toggleChat() {
    const w = document.getElementById('chat-widget');
    const i = w.querySelector('.toggle-icon');
    w.classList.toggle('closed');
    if (w.classList.contains('closed')) {
      i.className = 'fa-solid fa-chevron-up toggle-icon';
    } else {
      i.className = 'fa-solid fa-chevron-down toggle-icon';
      document.getElementById('chat-input').focus();
    }
  },

  handleChatKey(e) {
    if (e.key === 'Enter') this.sendChatMessage();
  },

  async sendChatMessage() {
    const inp = document.getElementById('chat-input');
    const text = inp.value.trim();
    
    if (text.length === 0) return;
    
    const body = document.getElementById('chat-body');
    body.innerHTML += `<div class="chat-msg user">${text}</div>`;
    inp.value = '';
    
    // Add typing indicator
    const typingId = 'typing-' + Date.now();
    body.innerHTML += `<div class="chat-msg ai typing-indicator" id="${typingId}"><i class="fa-solid fa-ellipsis fa-fade"></i></div>`;
    body.scrollTop = body.scrollHeight;
    
    try {
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text,
                context: { currentNodeName: this.currentNode ? this.currentNode.label : 'skills' }
            })
        });
        const data = await response.json();
        
        document.getElementById(typingId).remove();
        body.innerHTML += `<div class="chat-msg ai">${data.answer || data.error}</div>`;
        body.scrollTop = body.scrollHeight;
        
    } catch(err) {
        document.getElementById(typingId).remove();
        body.innerHTML += `<div class="chat-msg ai">I'm currently running in offline mode. Let's focus on your roadmap.</div>`;
        body.scrollTop = body.scrollHeight;
    }
  }
};

// ─── Chip Toggle ──────────────────────────────────────────────────────────────
window.toggleChip = function(el) {
  const siblings = el.parentElement.querySelectorAll('.chip');
  siblings.forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
};

window.toggleChipMulti = function(el) {
  el.classList.toggle('selected');
};

// ─── SVG Gradient for CI ring ─────────────────────────────────────────────────
function injectSVGGradient() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#6c63ff"/>
        <stop offset="100%" style="stop-color:#00d4ff"/>
      </linearGradient>
    </defs>`;
  document.body.prepend(svg);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
injectSVGGradient();
appState.init();
