/* P5B.1 — leitura pura do Xbox/Generic Gamepad para escolher classe.
 * Nenhuma regra de combate, DOM, RNG, cronômetro ou save.
 */
export function classPickerInput(pad){
 if(!pad?.connected)return null;
 const pressed=i=>!!pad.buttons?.[i]?.pressed;
 const axis=i=>Number.isFinite(pad.axes?.[i])?pad.axes[i]:0;
 if(pressed(12)||pressed(14)||axis(1)<-.55||axis(0)<-.55)
  return {type:'move',delta:-1};
 if(pressed(13)||pressed(15)||axis(1)>.55||axis(0)>.55)
  return {type:'move',delta:1};
 if(pressed(0))return {type:'confirm'};
 return null;
}
export function nextClassPickerIndex(index,delta,count){
 if(!Number.isInteger(count)||count<1)return 0;
 return (((Number.isInteger(index)?index:0)+delta)%count+count)%count;
}
