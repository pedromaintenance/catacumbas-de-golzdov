/* P2B — saves de preview isolados, nunca ler/gravar as chaves do legado. */
export const PREVIEW_SAVE_KEY='carcaca_golzdov_phaser_preview_run_v1';
export function validatePreviewRun(run){
 return !!(run&&run.schemaVersion===2&&run.previewVersion===1&&
  Number.isInteger(run.floor)&&run.floor>=1&&run.floor<=5&&
  Array.isArray(run.map)&&run.map.length===1225&&
  Array.isArray(run.seen)&&run.seen.length===1225&&
  Array.isArray(run.enemies)&&Array.isArray(run.items)&&Array.isArray(run.rooms)&&
  run.hero&&Number.isInteger(run.hero.x)&&Number.isInteger(run.hero.y)&&
  Number.isInteger(run.rngState)&&run.rngState>=0&&
  !Number.isNaN(run.hero.hp));
}
export function loadPreview(storage){
 try{const raw=storage?.getItem(PREVIEW_SAVE_KEY);if(!raw)return null;
 const run=JSON.parse(raw);return validatePreviewRun(run)?run:null;}catch(_){return null;}
}
export function savePreview(storage,run){
 if(!validatePreviewRun(run))return false;
 try{storage?.setItem(PREVIEW_SAVE_KEY,JSON.stringify(run));return true;}catch(_){return false;}
}
export function clearPreview(storage){
 try{storage?.removeItem(PREVIEW_SAVE_KEY);return true;}catch(_){return false;}
}
