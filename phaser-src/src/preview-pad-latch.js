/* P5B.2 — ações de botão (borda de pressionamento) vs. movimento contínuo.
 * O estado é efêmero da interface, sem escrita no save ou no RNG.
 */
export class PreviewPadLatch{
 constructor(){this.previous=new Set();this.pending=new Set();this.context='';this.connected=false;}
 sample(pad,context){
  if(!pad?.connected){
   this.previous.clear();this.pending.clear();this.context='';this.connected=false;
   return;
  }
  const current=new Set();
  for(const [index,button] of (pad.buttons||[]).entries())
   if(button?.pressed)current.add(index);
  const changed=!this.connected||context!==this.context;
  if(changed)this.pending.clear();
  for(const index of current)
   if(!this.previous.has(index)&&!changed)this.pending.add(index);
  this.previous=current;this.context=context;this.connected=true;
 }
 consume(button){
  if(!this.pending.has(button))return false;
  this.pending.delete(button);return true;
 }
 reset(){this.previous.clear();this.pending.clear();this.context='';this.connected=false;}
}
export function previewInputContext(scene){
 if(scene.classSelectionOpen)return 'class';
 if(scene.run?.pendingFinalChoice)return 'ending';
 if(scene.run?.over)return 'ended';
 if(scene.run?.pendingTalentChoices?.length)return 'talent';
 if(scene.itemUI?.active())return 'item';
 if(scene.autoPath?.length)return 'route';
 return 'exploration';
}
