# PolicyApp — Sol Powerlines Safety Reference

AI-powered safety manual assistant for utility field crews.
Ask questions by voice or text — get plain-English answers from your actual policy manuals.

---

## Files in this package

| File | Purpose |
|------|---------|
| `server.js` | Node.js backend — handles all AI API calls |
| `manuals.js` | Sol Powerlines + Entergy manuals (embedded text) |
| `package.json` | Node dependencies |
| `public/index.html` | The app — what crews see on their phones |

---

## Replit Setup (step by step)

### Step 1 — Create your Repl
1. Go to **https://replit.com** and sign in or create a free account
2. Click **+ Create Repl**
3. Choose **Node.js** template
4. Name it `policyapp`
5. Click **Create Repl**

### Step 2 — Upload your files
In the Replit file panel on the left:

1. Upload `server.js` → drag into root folder
2. Upload `manuals.js` → drag into root folder
3. Upload `package.json` → drag into root folder (say yes to replace)
4. Create a folder called `public` (click + New Folder)
5. Upload `public/index.html` → drag into the `public` folder

### Step 3 — Add your Anthropic API key
Your API key is what lets the app talk to the AI. Keep it secret.

1. In Replit, click the **🔒 Secrets** icon in the left sidebar
2. Click **+ New Secret**
3. Key: `ANTHROPIC_API_KEY`
4. Value: your key from https://console.anthropic.com/settings/keys
5. Click **Add Secret**

### Step 4 — Run it
1. Click the green **▶ Run** button at the top
2. Wait for: `PolicyApp running on port 3000`
3. A preview opens — your app is live!

### Step 5 — Get your URL
1. Click the **↗ Open in new tab** button on the preview panel
2. Your URL: `https://policyapp.YOUR-USERNAME.repl.co`
3. This is the link your crews use — works in any mobile browser

---

## Testing checklist
- [ ] Home screen loads — Sol, Entergy, OSHA listed
- [ ] Sol Powerlines → ask a question → answer from actual Sol manual
- [ ] Entergy → ask same question → Entergy's answer
- [ ] Strictest Standard → both manuals compared, winner shows green badge
- [ ] Voice input (mic button) works in Chrome
- [ ] Read aloud (speaker icon) reads answers back

---

## Going always-on (when ready)
Free Replit goes to sleep after ~30 min of no use.
To keep it awake 24/7: upgrade to **Replit Core** (~$20/month) → enable **Always On** in Repl settings.

---

## Adding future manuals
To add AEP, Cleco, or any other customer manual:

1. Extract the PDF text and add to `manuals.js`:
```js
const MANUALS = {
  sol: "...",
  entergy: "...",
  aep: "paste extracted text here"
};
```

2. Add a card to the BASE array in `public/index.html`:
```js
{ id:'aep', name:'AEP Requirements', desc:'Customer spec manual', icon:'⚡', bg:'#f0fdf4', hasPDF:true },
```

3. Re-upload both files to Replit and click Run

---

*PolicyApp — Built for Sol Powerlines field crews*
