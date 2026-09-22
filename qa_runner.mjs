import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'd:/Iqoo_hackathon/docs/assets/test_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
    this.events = new Map();
    this.consoleLogs = [];
    this.pageErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.pending.has(data.id)) {
        this.pending.get(data.id)(data);
        this.pending.delete(data.id);
      } else if (data.method) {
        if (data.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push({
            type: data.params.type,
            args: data.params.args.map((a) => a.value || a.description),
          });
        } else if (data.method === 'Runtime.exceptionThrown') {
          this.pageErrors.push(data.params.exceptionDetails);
        }
        const listeners = this.events.get(data.method) || [];
        for (const cb of listeners) cb(data.params);
      }
    };

    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pending.set(id, (res) => {
        if (res.error) {
          reject(new Error(`CDP Error (${method}): ${JSON.stringify(res.error)}`));
        } else {
          resolve(res.result);
        }
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`[Screenshot Saved]: ${filePath} (${buffer.length} bytes)`);
    return filePath;
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runAudit() {
  console.log('=== STARTING AUTOMATED QA AUDIT FOR LECTURELENS ===');

  // 1. Create a new target page
  const targetRes = await fetch('http://localhost:9222/json/new?http://localhost:3000');
  const targetData = await targetRes.json();
  const cdp = new CDPClient(targetData.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  const auditReport = {
    landing: {},
    classroom: {},
    zones: {},
    pitchDeck: {},
    consoleErrors: [],
    edgeCases: [],
  };

  // Wait for initial page load
  console.log('Waiting for initial page load...');
  await new Promise((r) => setTimeout(r, 4000));

  // --- 1. LANDING & HERO OVERLAY ---
  console.log('Testing Landing & Hero Overlay...');
  const heroInfo = await cdp.eval(`(() => {
    const h1 = document.querySelector('h1')?.innerText || '';
    const taglines = Array.from(document.querySelectorAll('p')).map(p => p.innerText);
    const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Enter Classroom'));
    const teamCredit = Array.from(document.querySelectorAll('p')).find(p => p.innerText.includes('Team Maxzi'))?.innerText || '';
    return {
      h1,
      taglines,
      hasEnterBtn: !!enterBtn,
      enterBtnText: enterBtn?.innerText || '',
      teamCredit
    };
  })()`);

  auditReport.landing = heroInfo;
  console.log('Hero Info:', heroInfo);

  // Take Screenshot 1: Hero landing overlay
  await cdp.captureScreenshot('01_hero_landing_overlay.png');

  // Click "Enter Classroom →"
  console.log('Clicking "Enter Classroom →" button...');
  const clickedEnter = await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Enter Classroom'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  })()`);
  auditReport.landing.clickedEnter = clickedEnter;

  // Wait for transition
  await new Promise((r) => setTimeout(r, 1500));

  // Check if Hero overlay disappeared
  const heroGone = await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Enter Classroom'));
    return !btn;
  })()`);
  auditReport.landing.heroOverlayDismissed = heroGone;
  console.log('Hero overlay dismissed:', heroGone);

  // --- 2. 3D CLASSROOM SCENE & ORBIT ---
  console.log('Testing 3D Classroom Scene & Canvas...');
  const canvasInfo = await cdp.eval(`(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { hasCanvas: false };
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return {
      hasCanvas: true,
      width: canvas.width,
      height: canvas.height,
      hasGL: !!gl,
      renderer: gl ? gl.getParameter(gl.RENDERER) : null,
      vendor: gl ? gl.getParameter(gl.VENDOR) : null
    };
  })()`);
  auditReport.classroom.canvas = canvasInfo;
  console.log('Canvas Info:', canvasInfo);

  // Wait for 3D render to settle
  await new Promise((r) => setTimeout(r, 2500));

  // Take Screenshot 2: 3D classroom overview
  await cdp.captureScreenshot('02_3d_classroom_overview.png');

  // Test Camera Orbit & Zoom Boundaries
  const orbitTest = await cdp.eval(`(() => {
    // Check camera position and OrbitControls if accessible or check camera values via three fiber state
    const canvas = document.querySelector('canvas');
    return {
      canvasVisible: !!canvas && canvas.offsetWidth > 0,
      clientRect: canvas.getBoundingClientRect()
    };
  })()`);
  auditReport.classroom.orbit = orbitTest;

  // Check HTML 3D annotations in scene
  const html3DLabels = await cdp.eval(`(() => {
    const labels = Array.from(document.querySelectorAll('div')).filter(d => 
      d.innerText && (
        d.innerText.includes("Teacher's iQOO Phone") || 
        d.innerText.includes("Binary Search Tree") || 
        d.innerText.includes("Suresh") || 
        d.innerText.includes("On-Device AI Pipeline")
      )
    ).map(d => ({ text: d.innerText.slice(0, 50), className: d.className }));
    return labels;
  })()`);
  console.log('HTML 3D Labels detected:', html3DLabels);
  auditReport.classroom.html3DLabels = html3DLabels;

  // --- 3. INTERACTIVE 3D ZONES ---

  // Zone 1: Teacher's Phone
  console.log('--- Testing Zone: Teacher Phone ---');
  const clickTeacherPhone = await cdp.eval(`(() => {
    const target = Array.from(document.querySelectorAll('div')).find(d => 
      d.innerText && d.innerText.includes("Teacher's iQOO Phone")
    );
    if (target) {
      target.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Teacher Phone label:', clickTeacherPhone);
  await new Promise((r) => setTimeout(r, 1200));

  const teacherPhonePanel = await cdp.eval(`(() => {
    const panel = document.querySelector('aside');
    if (!panel) return { open: false };
    const title = panel.querySelector('h2')?.innerText || '';
    const subtitle = panel.querySelector('p')?.innerText || '';
    const waveform = !!panel.querySelector('canvas') || !!panel.querySelector('svg') || panel.innerHTML.includes('waveform');
    const transcript = panel.innerText.includes("Binary Search Tree") && panel.innerText.includes("O(log n)");
    const bullets = Array.from(panel.querySelectorAll('li')).map(li => li.innerText);
    const returnBtn = Array.from(panel.querySelectorAll('button')).find(b => b.innerText.includes('Return to Classroom Overview'));
    return {
      open: true,
      title,
      subtitle,
      hasWaveform: waveform,
      hasTranscript: transcript,
      bullets,
      hasReturnBtn: !!returnBtn
    };
  })()`);
  console.log('Teacher Phone Panel:', teacherPhonePanel);
  auditReport.zones.teacherPhone = teacherPhonePanel;

  // Capture Screenshot 3: Teacher phone active panel
  await cdp.captureScreenshot('03_teacher_phone_active_panel.png');

  // Test Return button
  const returnOverview1 = await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Return to Classroom Overview'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Return Button:', returnOverview1);
  await new Promise((r) => setTimeout(r, 800));

  const panelClosed1 = await cdp.eval(`!document.querySelector('aside')`);
  auditReport.zones.teacherPhone.closedProperly = panelClosed1;
  console.log('Panel closed:', panelClosed1);

  // Zone 2: Whiteboard
  console.log('--- Testing Zone: Whiteboard ---');
  const clickWhiteboard = await cdp.eval(`(() => {
    const target = Array.from(document.querySelectorAll('div')).find(d => 
      d.innerText && (d.innerText.includes("Click to Snap Board") || d.innerText.includes("Binary Search Tree (BST)"))
    );
    if (target) {
      target.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Whiteboard:', clickWhiteboard);
  await new Promise((r) => setTimeout(r, 1200));

  const whiteboardPanel = await cdp.eval(`(() => {
    const panel = document.querySelector('aside');
    if (!panel) return { open: false };
    const title = panel.querySelector('h2')?.innerText || '';
    const subtitle = panel.querySelector('p')?.innerText || '';
    const chalkboardDiagram = panel.innerText.includes("[15]") && panel.innerText.includes("[10]") && panel.innerText.includes("[20]");
    const noteSynthesis = panel.innerText.includes("# Binary Search Trees (BST)") && panel.innerText.includes("O(log n)");
    const bullets = Array.from(panel.querySelectorAll('li')).map(li => li.innerText);
    const returnBtn = Array.from(panel.querySelectorAll('button')).find(b => b.innerText.includes('Return to Classroom Overview'));
    return {
      open: true,
      title,
      subtitle,
      hasChalkboardDiagram: chalkboardDiagram,
      hasNoteSynthesis: noteSynthesis,
      bullets,
      hasReturnBtn: !!returnBtn
    };
  })()`);
  console.log('Whiteboard Panel:', whiteboardPanel);
  auditReport.zones.whiteboard = whiteboardPanel;

  // Capture Screenshot 4: Whiteboard active panel
  await cdp.captureScreenshot('04_whiteboard_active_panel.png');

  // Return to overview
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Return to Classroom Overview'));
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  // Zone 3: Student Desks & Adaptive Quiz
  console.log('--- Testing Zone: Student Desks & Quiz ---');
  const clickStudentDesks = await cdp.eval(`(() => {
    const target = Array.from(document.querySelectorAll('div')).find(d => 
      d.innerText && (d.innerText.includes("Suresh (Hero)") || d.innerText.includes("Click Suresh"))
    );
    if (target) {
      target.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Student Desks:', clickStudentDesks);
  await new Promise((r) => setTimeout(r, 1200));

  const studentPanelBefore = await cdp.eval(`(() => {
    const panel = document.querySelector('aside');
    if (!panel) return { open: false };
    const title = panel.querySelector('h2')?.innerText || '';
    const sureshMention = panel.innerText.includes("SURESH'S MASTERY DASHBOARD") || panel.innerText.includes("Suresh");
    const quizQuestion = panel.innerText.includes("In a BST, where does a node with a key less than the root node go?");
    const options = Array.from(panel.querySelectorAll('button')).filter(b => 
      ['Right Subtree', 'Left Subtree', 'Root Position', 'Parent Node'].some(opt => b.innerText.includes(opt))
    ).map(b => b.innerText);
    const progressBars = panel.innerText.includes("85%") && panel.innerText.includes("40%");
    return {
      open: true,
      title,
      hasSureshMention: sureshMention,
      hasQuizQuestion: quizQuestion,
      options,
      hasProgressBars: progressBars
    };
  })()`);
  console.log('Student Panel Before Interaction:', studentPanelBefore);

  // Click Quiz Option: Option 1 ("Left Subtree" - correct answer)
  console.log('Clicking Quiz Option: Left Subtree...');
  const quizClickResult = await cdp.eval(`(() => {
    const panel = document.querySelector('aside');
    if (!panel) return { success: false };
    const optionBtn = Array.from(panel.querySelectorAll('button')).find(b => b.innerText.includes('Left Subtree'));
    if (optionBtn) {
      optionBtn.click();
      return { success: true, text: optionBtn.innerText };
    }
    return { success: false };
  })()`);
  console.log('Quiz click result:', quizClickResult);
  await new Promise((r) => setTimeout(r, 800));

  const studentPanelAfter = await cdp.eval(`(() => {
    const panel = document.querySelector('aside');
    if (!panel) return { open: false };
    const optionsState = Array.from(panel.querySelectorAll('button')).filter(b => 
      ['Right Subtree', 'Left Subtree', 'Root Position', 'Parent Node'].some(opt => b.innerText.includes(opt))
    ).map(b => ({
      text: b.innerText,
      className: b.className
    }));
    const isSuccessState = optionsState.some(o => o.text.includes('✓ Correct!'));
    return {
      open: true,
      optionsState,
      isSuccessState
    };
  })()`);
  console.log('Student Panel After Quiz Click:', studentPanelAfter);
  auditReport.zones.studentDesks = {
    ...studentPanelBefore,
    interaction: studentPanelAfter
  };

  // Capture Screenshot 5: Student quiz interaction panel
  await cdp.captureScreenshot('05_student_quiz_interaction_panel.png');

  // Return to overview
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Return to Classroom Overview'));
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  // Zone 4: Architecture Pipeline
  console.log('--- Testing Zone: Architecture Pipeline ---');
  const clickArch = await cdp.eval(`(() => {
    const target = Array.from(document.querySelectorAll('div')).find(d => 
      d.innerText && d.innerText.includes("On-Device AI Pipeline")
    );
    if (target) {
      target.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Arch Pipeline:', clickArch);
  await new Promise((r) => setTimeout(r, 1200));

  const archPanel = await cdp.eval(`(() => {
    const panel = document.querySelector('aside');
    if (!panel) return { open: false };
    const title = panel.querySelector('h2')?.innerText || '';
    const subtitle = panel.querySelector('p')?.innerText || '';
    const qualcommMention = panel.innerText.includes("QUALCOMM AI STACK ON SNAPDRAGON NPU");
    const steps = Array.from(panel.querySelectorAll('.grid > div')).map(d => ({
      title: d.querySelector('p:first-child')?.innerText || '',
      desc: d.querySelector('p:last-child')?.innerText || ''
    }));
    const zeroCloudLatency = panel.innerText.includes("Zero Cloud Latency");
    return {
      open: true,
      title,
      subtitle,
      hasQualcommMention: qualcommMention,
      steps,
      hasZeroCloudLatency: zeroCloudLatency
    };
  })()`);
  console.log('Architecture Panel:', archPanel);
  auditReport.zones.archDiagram = archPanel;

  // Capture Screenshot 6: Architecture pipeline panel
  await cdp.captureScreenshot('06_architecture_pipeline_panel.png');

  // Close panel
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Return to Classroom Overview'));
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  // --- 4. PITCH DECK (/deck) ---
  console.log('--- Testing Pitch Deck (/deck) ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/deck' });
  await new Promise((r) => setTimeout(r, 3000));

  const deckInit = await cdp.eval(`(() => {
    const slideIndicator = document.querySelector('header span.font-mono')?.innerText || '';
    const title = document.querySelector('h1')?.innerText || '';
    const exportBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Export PDF'));
    const progressBar = document.querySelector('footer .bg-primary');
    return {
      slideIndicator,
      title,
      hasExportBtn: !!exportBtn,
      progressBarWidth: progressBar ? progressBar.style.width : null
    };
  })()`);
  console.log('Deck Initial State (Slide 1):', deckInit);
  auditReport.pitchDeck.initial = deckInit;

  // Capture Screenshot 7: Pitch deck Slide 1
  await cdp.captureScreenshot('07_pitch_deck_slide_1.png');

  // Navigate through all 9 slides
  const slideDetails = [];
  // Current slide is 0 (Slide 1). Record slide 0:
  const slide0Data = await cdp.eval(`(() => {
    return {
      index: 0,
      slideText: document.querySelector('main .max-w-6xl')?.innerText?.slice(0, 200),
      indicator: document.querySelector('header span.font-mono')?.innerText
    };
  })()`);
  slideDetails.push(slide0Data);

  // Test navigation: Use Next button to go to Slide 2, 3, 4
  console.log('Navigating using Next button to Slide 4...');
  for (let i = 1; i <= 3; i++) {
    await cdp.eval(`(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next →'));
      if (nextBtn) nextBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
    const sData = await cdp.eval(`(() => {
      return {
        index: ${i},
        h2: document.querySelector('h2')?.innerText,
        indicator: document.querySelector('header span.font-mono')?.innerText,
        progressBarWidth: document.querySelector('footer .bg-primary')?.style.width
      };
    })()`);
    slideDetails.push(sData);
    console.log(`Arrived at slide index ${i}:`, sData);
  }

  // At Slide 4 (index 3, Architecture): Capture Screenshot 8
  await cdp.captureScreenshot('08_pitch_deck_slide_4.png');

  // Test Keyboard Navigation (ArrowRight / ArrowLeft / Space)
  console.log('Testing keyboard navigation (ArrowRight)...');
  // Dispatch ArrowRight keydown
  for (let i = 4; i <= 6; i++) {
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'ArrowRight',
      code: 'ArrowRight',
      windowsVirtualKeyCode: 39,
    });
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'ArrowRight',
      code: 'ArrowRight',
      windowsVirtualKeyCode: 39,
    });
    await new Promise((r) => setTimeout(r, 600));
    const sData = await cdp.eval(`(() => {
      return {
        index: ${i},
        h2: document.querySelector('h2')?.innerText,
        indicator: document.querySelector('header span.font-mono')?.innerText,
        progressBarWidth: document.querySelector('footer .bg-primary')?.style.width
      };
    })()`);
    slideDetails.push(sData);
    console.log(`Arrived at slide index ${i} via keyboard:`, sData);
  }

  // At Slide 7 (index 6, Demo Flow): Capture Screenshot 9
  await cdp.captureScreenshot('09_pitch_deck_slide_7.png');

  // Continue to Slide 8 (Differentiation) and Slide 9 (Team)
  for (let i = 7; i <= 8; i++) {
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'ArrowRight',
      code: 'ArrowRight',
      windowsVirtualKeyCode: 39,
    });
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'ArrowRight',
      code: 'ArrowRight',
      windowsVirtualKeyCode: 39,
    });
    await new Promise((r) => setTimeout(r, 600));
    const sData = await cdp.eval(`(() => {
      return {
        index: ${i},
        h2: document.querySelector('h2')?.innerText,
        teamText: document.querySelector('main .max-w-6xl')?.innerText?.slice(0, 300),
        indicator: document.querySelector('header span.font-mono')?.innerText,
        progressBarWidth: document.querySelector('footer .bg-primary')?.style.width
      };
    })()`);
    slideDetails.push(sData);
    console.log(`Arrived at slide index ${i}:`, sData);
  }

  auditReport.pitchDeck.slides = slideDetails;

  // Test Export PDF button behavior (verify window.print call or mock)
  const exportPdfTest = await cdp.eval(`(() => {
    let printCalled = false;
    const origPrint = window.print;
    window.print = () => { printCalled = true; };
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Export PDF'));
    if (btn) {
      btn.click();
    }
    window.print = origPrint;
    return {
      hasBtn: !!btn,
      triggeredPrint: printCalled
    };
  })()`);
  console.log('Export PDF button test:', exportPdfTest);
  auditReport.pitchDeck.exportPdf = exportPdfTest;

  // Capture console logs & errors
  auditReport.consoleLogs = cdp.consoleLogs;
  auditReport.pageErrors = cdp.pageErrors;
  console.log('Console Logs count:', cdp.consoleLogs.length);
  console.log('Page Errors count:', cdp.pageErrors.length);

  // Save audit results to JSON
  fs.writeFileSync('d:/Iqoo_hackathon/audit_result.json', JSON.stringify(auditReport, null, 2));
  console.log('Audit results saved to audit_result.json');

  await cdp.close();
  console.log('=== AUDIT COMPLETE ===');
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
