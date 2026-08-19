import { chromium } from 'playwright'
const URL=process.argv[2], OUT='/private/tmp/claude-501/-Users-swchck-Downloads/ef353628-b242-469d-a2c1-76197e21843e/scratchpad'
const b=await chromium.launch()
async function shot(name,vw,vh,act){const p=await b.newPage({viewport:{width:vw,height:vh},deviceScaleFactor:2});await p.goto(URL,{waitUntil:'networkidle'});await p.evaluate(()=>localStorage.setItem('gv-seen-guide','1'));await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(500);if(act)await act(p);await p.screenshot({path:`${OUT}/${name}.png`});await p.close()}
await shot('modal-vignette',1440,1150,async p=>{await p.locator('.views button',{hasText:'Все истории'}).click();await p.waitForTimeout(600);await p.locator('.story-main',{hasText:'Билл'}).first().click();await p.waitForTimeout(500)})
await shot('modal-variability',1440,1300,async p=>{await p.locator('.views button',{hasText:'Все истории'}).click();await p.waitForTimeout(600);await p.locator('.story-main',{hasText:'Белый всадник'}).first().click();await p.waitForTimeout(500)})
await b.close();console.log('done')
