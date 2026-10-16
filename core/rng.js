/* Carcaça / Golzdov — núcleo determinístico, sem Phaser, Canvas ou DOM.
 * Consome o mesmo xorshift32 de Golzdov 1.2C. A mutação do rngState
 * é explícita e só pode ocorrer durante uma ação de simulação.
 */
(function(root){
'use strict';
const NONZERO=0x6d2b79f5;
function nextState(value){
  let n=(value>>>0)||NONZERO;
  n^=n<<13;
  n^=n>>>17;
  n^=n<<5;
  const state=n>>>0;
  return {state,value:state/4294967296};
}
function next(run){
  const result=nextState(run.rngState);
  run.rngState=result.state;
  return result.value;
}
function integer(run,a,b){return Math.floor(next(run)*(b-a+1))+a;}
function pick(run,arr){return arr[integer(run,0,arr.length-1)];}
function seeded(seed){
  let state=(seed>>>0)||NONZERO;
  return {get state(){return state;},next(){const r=nextState(state);state=r.state;return r.value;},integer(a,b){return Math.floor(this.next()*(b-a+1))+a;}};
}
root.GolzdovCoreRng=Object.freeze({nextState,next,integer,pick,seeded,NONZERO});
})(typeof window!=='undefined'?window:globalThis);
