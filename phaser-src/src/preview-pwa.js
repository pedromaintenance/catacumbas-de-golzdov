/* P5A.1 — Instalação manual da preview. Não registra o SW do HTML clássico.
 * Este módulo não acessa run, RNG, histórico, nem realiza comandos de jogo.
 */
export function initPreviewPwa(win=window,doc=document){
 const install=doc.getElementById('install-preview');
 const status=doc.getElementById('pwa-status');
 const guide=doc.getElementById('pwa-guide');
 if(!install||!status||!guide)return null;
 let promptEvent=null;
 let installed=false;
 let registration=null;
 const setStatus=text=>{status.textContent=text;};
 const showGuide=()=>{
  guide.hidden=false;
  guide.textContent='Instalação manual: no Chrome/Edge, abra o menu ⋮ e escolha Instalar aplicativo; no Safari do iPhone, use Compartilhar → Adicionar à Tela de Início. Para jogar offline, visite a prévia online uma vez e depois recarregue.';
 };
 const onPrompt=e=>{
  e.preventDefault();
  promptEvent=e;
  install.textContent='⬇ INSTALAR PRÉVIA';
  setStatus('Seu navegador permite instalar a preview.');
 };
 const onInstalled=()=>{
  installed=true;promptEvent=null;
  install.textContent='✓ PRÉVIA INSTALADA';
  install.disabled=true;guide.hidden=true;
  setStatus('Preview instalada. A campanha clássica continua separada.');
 };
 const onClick=async()=>{
  if(installed)return;
  if(!promptEvent){showGuide();return;}
  const current=promptEvent;promptEvent=null;
  try{
   await current.prompt();
   const choice=await current.userChoice;
   if(choice?.outcome==='accepted')setStatus('Instalação aceita. Aguarde o navegador finalizar.');
   else {setStatus('Instalação dispensada. Você pode usar o menu do navegador.');showGuide();}
  }catch(_){showGuide();setStatus('Use a instalação manual do navegador.');}
 };
 install.addEventListener('click',onClick);
 win.addEventListener('beforeinstallprompt',onPrompt);
 win.addEventListener('appinstalled',onInstalled);
 if(win.matchMedia?.('(display-mode: standalone)')?.matches)onInstalled();
 const nav=win.navigator;
 if(!win.isSecureContext||!nav?.serviceWorker){
  setStatus('Sem Service Worker neste navegador. A prévia segue jogável online.');
  return {registration:null};
 }
 setStatus('Preparando os arquivos da preview para uso offline…');
 const scope=new URL('./',win.location.href);
 const script=new URL('./sw.js',scope);
 // A URL está necessariamente sob /phaser/, e o scope explícito é o mesmo.
 nav.serviceWorker.register(script.href,{scope:scope.href,updateViaCache:'none'})
  .then(async reg=>{
   registration=reg;
   await nav.serviceWorker.ready;
   setStatus(nav.serviceWorker.controller?
    'Arquivos da preview disponíveis offline. Teste desligando a internet e recarregando.':
    'Cache preparado. Recarregue esta página online para ativar o modo offline.');
  })
  .catch(()=>setStatus('Não foi possível preparar o offline. Jogue online e tente recarregar.'));
 nav.serviceWorker.addEventListener?.('controllerchange',()=>{
  setStatus('Modo offline ativo para a preview. O jogo clássico não foi alterado.');
 });
 return {get registration(){return registration;}};
}
