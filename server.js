require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve login page explicitly
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Mock database to persist state in memory for demo
let db = {
    user: {
        id: 1,
        name: "Learner",
        interests: [],
        confidenceIndex: 45,
        status: "active", // active, inactive, struggling
        lastActive: Date.now(),
        struggleCount: 0,
        currentNodeId: "n1"
    },
    roadmap: {
        nodes: [
            { id: "n1", label: "Programming Basics", type: "concept", status: "pending", difficulty: "normal", explanation: "Understand the core building blocks of computer programming.", prereqs: [] },
            { id: "n2", label: "Variables & Data Types", type: "concept", status: "locked", difficulty: "normal", explanation: "Store information to make applications dynamic and stateful.", prereqs: ["Programming Basics"] },
            { id: "n3", label: "Logic & Control Flow", type: "concept", status: "locked", difficulty: "normal", explanation: "Make decisions in your code using if/else statements.", prereqs: ["Variables & Data Types"] },
            { id: "n4", label: "Simple Calculator Project", type: "project", status: "locked", difficulty: "hard", explanation: "Apply your knowledge to build a functioning interactive calculator.", prereqs: ["Logic & Control Flow"] }
        ],
        edges: [
            { from: "n1", to: "n2" },
            { from: "n2", to: "n3" },
            { from: "n3", to: "n4" }
        ]
    }
};

// --- Endpoints ---

// Get current user and state
app.get('/api/user', (req, res) => {
    res.json(db.user);
});

// Developer shortcut to simulate inactivity and test the Comeback Flow
app.post('/api/user/simulate-inactive', (req, res) => {
    db.user.status = "inactive";
    res.json({ success: true, user: db.user });
});

// Generate dynamic roadmap based on interests
app.post('/api/roadmap/generate', (req, res) => {
    const { interests } = req.body;
    db.user.interests = interests;
    
    // Simulate AI Generation: adding personalized conceptual and project nodes based on the array of user interests
    const primaryInterest = interests.length > 0 ? interests[0] : 'Web App';
    
    // Append dynamically generated personalized path points
    const dynamicNodeId1 = "n_" + Date.now() + "_1";
    const dynamicNodeId2 = "n_" + Date.now() + "_2";
    
    db.roadmap.nodes.push({ id: dynamicNodeId1, label: `Intro to ${primaryInterest}`, type: "concept", status: "locked", difficulty: "normal", explanation: `Understand how ${primaryInterest} fits into the modern technology landscape.`, prereqs: ["Simple Calculator Project"] });
    db.roadmap.nodes.push({ id: dynamicNodeId2, label: `Build your first ${primaryInterest}`, type: "project", status: "locked", difficulty: "hard", explanation: `Showcase your skills by building a micro-project focused on ${primaryInterest}.`, prereqs: [`Intro to ${primaryInterest}`] });
    
    db.roadmap.edges.push({ from: "n4", to: dynamicNodeId1 });
    db.roadmap.edges.push({ from: dynamicNodeId1, to: dynamicNodeId2 });
    
    res.json(db.roadmap);
});

// Get structured roadmap (nodes, edges)
app.get('/api/roadmap', (req, res) => res.json(db.roadmap));

// User explicitly declares struggle with current concept
app.post('/api/roadmap/struggle', (req, res) => {
    const { nodeId } = req.body;
    db.user.struggleCount += 1;
    
    // Adaptive Logic: If struggling twice, adapt roadmap with an easier path
    if (db.user.struggleCount >= 2) {
        db.user.status = "struggling";
        
        // Spawn an easier dynamic step
        const easierNodeId = "n_catchup_" + Date.now();
        db.roadmap.nodes.push({
            id: easierNodeId,
            label: "Refresher: Core Fundamentals",
            type: "concept",
            status: "pending",
            difficulty: "easy",
            explanation: "Let's review some absolute basics using a simpler analogy to make sure we're on the right track.",
            prereqs: []
        });
        
        // Connect intermediate easier node directly before the struggle node
        db.roadmap.edges.push({ from: easierNodeId, to: nodeId });
        
        // Change user focus to the easier step
        db.user.currentNodeId = easierNodeId;
        db.user.struggleCount = 0; // Reset struggles for new node
    }
    
    // Reduce Confidence Index slightly but floor at 0
    db.user.confidenceIndex = Math.max(0, db.user.confidenceIndex - 5);
    res.json({ user: db.user, roadmap: db.roadmap });
});

// Completes a node, increasing confidence and unlocking the next sections
app.post('/api/roadmap/complete', (req, res) => {
    const { nodeId } = req.body;
    const node = db.roadmap.nodes.find(n => n.id === nodeId);
    if(node) node.status = "completed";
    
    // Increase Skill Confidence Index capped at 100
    db.user.confidenceIndex = Math.min(100, db.user.confidenceIndex + 12);
    db.user.struggleCount = 0;
    db.user.status = "active";
    
    // Check outgoing edges to unlock children
    const nextEdges = db.roadmap.edges.filter(e => e.from === nodeId);
    nextEdges.forEach(e => {
        const nextNode = db.roadmap.nodes.find(n => n.id === e.to);
        if(nextNode) nextNode.status = "pending";
    });
    
    // Automatically reassign current node focus based on topological queue
    const nextPending = db.roadmap.nodes.find(n => n.status === "pending");
    if(nextPending) {
        db.user.currentNodeId = nextPending.id;
    }
    
    res.json({ user: db.user, roadmap: db.roadmap });
});

// ==========================================
// 🤖 AI ENDPOINTS (Gemini + Smart Fallback)
// ==========================================

// Smart fallback chatbot — works with ZERO API key, always responsive
function smartFallback(message, node) {
    const m = message.toLowerCase();
    const n = node || 'your current task';

    if (m.includes('idk') || m.includes("don't know") || m.includes('dont know') || m.includes('not sure') || m.includes('no idea'))
        return `Hey — not knowing is the starting point of every expert. The fact you're here means you're already ahead of someone who gave up. Let's break "${n}" down tiny. What part can you try for just 10 minutes?`;
    if (m.includes('stuck') || m.includes('help') || m.includes('hard') || m.includes('difficult') || m.includes('confus'))
        return `Being stuck on "${n}" is completely normal — it means you've hit the edge of your current knowledge, which is exactly where growth happens. Try: search "${n} explained simply" and come back here.`;
    if (m.includes('lazy') || m.includes('tired') || m.includes('burnout') || m.includes("can't"))
        return `Burnout is real. Even 10 minutes of skimming today counts. Your roadmap adapts around you — not the other way around. Rest if you need to.`;
    if (m.includes('why') || m.includes('reason') || m.includes('point'))
        return `"${n}" is in your roadmap because it directly unblocks 2-3 advanced skills that Razorpay and Swiggy specifically test in backend interviews. Skipping it now creates a wall later.`;
    if (m.includes('quit') || m.includes('stop') || m.includes('give up'))
        return `You've come too far to stop now. You're not quitting the task—you're just pausing the timer. What specifically is blocking you on "${n}"?`;
    if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('sup'))
        return `Hey! I'm your AI guide, calibrated to your backend roadmap. Right now we're targeting: "${n}". Ask me anything — even "this is confusing".`;
    if (m.includes('motivat') || m.includes('inspire') || m.includes('encourage'))
        return `In 6 months, you could be explaining "${n}" fluently in a Razorpay technical interview. That version of you starts today.`;
    if (m.includes('done') || m.includes('finish') || m.includes('complet'))
        return `Completing "${n}" is a real milestone! Hit the "Mark Complete" button on the graph node and watch your roadmap unlock the next level.`;
    if (m.includes('project') || m.includes('build') || m.includes('implement'))
        return `Best way to solidify "${n}": build something tiny with it — even a 20-line script. Hands-on practice encodes it 5x faster than reading.`;

    const generics = [
        `Solid question. The key insight most engineers miss about "${n}" is understanding *why* it matters architecturally — not just how to implement it.`,
        `Keep going. Every minute on "${n}" is compounding. Senior engineers are built from consistent daily effort, not marathon sessions.`,
        `You're on the right track. "${n}" is a foundation skill — once you lock this in, the next 3 nodes on your roadmap will click into place naturally.`,
        `Pro tip: test whether you've truly understood "${n}" by explaining it out loud, to yourself, without notes. If you can do that — you own it.`
    ];
    return generics[Math.floor(Math.random() * generics.length)];
}

// Chat endpoint — Gemini first, smart fallback always
app.post('/api/ai/chat', async (req, res) => {
    const { message, context } = req.body;
    const node = (context && context.currentNodeName) || 'your current task';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        return setTimeout(() => res.json({ success: true, answer: smartFallback(message, node) }), 600);
    }

    try {
        const gemRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `You are "FutureYou", a warm AI mentor from 5 years ahead guiding a user learning "${node}". Be specific, motivating, and concise (2-3 sentences max). User said: "${message}"` }] }]
                })
            }
        );
        const data = await gemRes.json();
        if (data.error) throw new Error(data.error.message);
        const answer = data.candidates[0].content.parts[0].text;
        res.json({ success: true, answer });
    } catch(e) {
        res.json({ success: true, answer: smartFallback(message, node) });
    }
});

// Assessment analysis — Gemini first, rich mock fallback
app.post('/api/ai/analyze', async (req, res) => {
    const { goal, taskResponse } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const mockData = {
        confirmed: "You identified the missing index as the likely bottleneck — that's the right instinct. You also recognized that fetching all columns with SELECT * adds unnecessary I/O overhead.",
        gap: "The critical gap: you missed the ORDER BY created_at clause. Without a composite index on (customer_id, created_at DESC), Postgres still performs an expensive in-memory sort on thousands of rows after the initial lookup.",
        verdict: `Skipping 5-6 weeks of generic curriculum. Building a hyper-focused 8-week roadmap targeting your goal: "${goal}". Starting with Composite Indexes & Query Planning.`,
        level: "Advanced Backend"
    };

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        return setTimeout(() => res.json({ success: true, data: mockData }), 1400);
    }

    try {
        const prompt = `A backend engineering student's goal: "${goal}". They were asked to debug a slow Postgres query: SELECT * FROM orders WHERE customer_id = 1042 ORDER BY created_at DESC LIMIT 20 (taking 8 seconds on 4M rows). Their response: "${taskResponse}". Analyze their engineering depth. Return ONLY valid JSON with keys: "confirmed", "gap", "verdict", "level" (Beginner Backend / Intermediate Backend / Advanced Backend).`;
        const gemRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: 'application/json' }
                })
            }
        );
        const data = await gemRes.json();
        if (data.error) throw new Error(data.error.message);
        const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
        res.json({ success: true, data: parsed });
    } catch(e) {
        res.json({ success: true, data: mockData });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
