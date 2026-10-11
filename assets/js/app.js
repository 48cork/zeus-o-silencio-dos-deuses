import { createIntroduction } from './introducao.js';
import * as introductionUI from './ui.js';
import { initialState, dispatch, rewind } from './engine.js';
import { createStore, parseRecord, MAX_BYTES } from './storage.js';
import { view, sceneNames } from '../data/episodio.js';
import { render, initDialogs, openDiary, openHistory, openNotes, openHelp, openDialog, closeDialog, confirmDialog, element, status, conflict, announce } from './ui.js';
let adapter;try{adapter=window.localStorage;}catch{adapter={getItem(){throw new Error('Armazenamento bloqueado.');}};}
const store=createStore(adapter);let state=initialState(),scan=store.scan(),resume=scan.current,landing=true;
const $=id=>document.getElementById(id);
function notify(result){status(result.ok?'Progresso salvo neste navegador.':result.conflict?'Outro percurso foi atualizado. Sua linha foi preservada.':'Não foi possível salvar. Seu percurso continua nesta sessão; exporte para preservá-lo.');if(result.conflict)conflict(true);}
function paint(focus=true){render(state,{command:act,resume:continueSaved,restart},{focus,resume:landing?resume:null});introduction.render();}
function save({force=false}={}){const result=store.save(state,{force});notify(result);return result;}
function exportProgress(){const source=landing&&resume?JSON.stringify(resume.record,null,2):store.export(state);const blob=new Blob([source],{type:'application/json'});const url=URL.createObjectURL(blob);const link=element('a',undefined,{href:url,download:'zeus-progresso.json'});document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Arquivo de progresso exportado.');}
function act(command,node){
  if(state.node!==node)return;
  if(store.hasConflict()){conflict(true);status('Outra aba atualizou o progresso. Recupere uma linha ou continue em cópia antes de confirmar.');return;}
  if(landing&&resume&&command.type==='choose') {confirmDialog('Começar outro percurso?','O percurso salvo será preservado. Você iniciará uma nova linha.',()=>{store.fork();resume=null;landing=false;act(command,node);},{exportAction:exportProgress,label:'Começar nova linha'});return;}
  try{state=dispatch(state,command);landing=false;resume=null;save();if(node==='AB')introduction.begin();paint();}catch(error){status(`Não foi possível confirmar: ${error.message}`);}
}
function continueSaved(){if(!resume)return;state=resume.state;store.adopt(resume.record);landing=false;resume=null;conflict(false);introduction.restore();paint();status('Percurso recuperado. As consequências foram reconstruídas sem novas execuções.');}
function restart(){confirmDialog('Começar outro percurso?','Você voltará à abertura em uma nova linha. O percurso anterior permanece recuperável.',()=>{store.clearForNew();state=initialState();introduction.reset();landing=false;resume=null;conflict(false);save();paint();},{exportAction:exportProgress,label:'Começar outra linha'});}
function restore(candidate){confirmDialog('Recuperar este percurso?',`Continuar em ${sceneNames[view(candidate.state).scene]} usando ${candidate.slot==='backup'?'a cópia anterior':'o registro selecionado'}? Seu percurso atual será preservado.`,()=>{state=candidate.state;introduction.reset();store.fork();store.adopt(candidate.record);landing=false;resume=null;conflict(false);save({force:true});paint();},{exportAction:exportProgress,label:'Recuperar percurso'});}
function recover(){scan=store.scan();openDialog('Progresso e recuperação',c=>{
  c.append(element('p','O progresso fica neste navegador e nesta origem. Limpar dados ou usar outra origem pode torná-lo indisponível. Exporte para transferir ou preservar uma cópia.'));
  const exp=element('button','Exportar meu percurso',{type:'button'});exp.addEventListener('click',exportProgress);c.append(exp);
  const input=element('input',undefined,{type:'file',accept:'.json,application/json',id:'import-file'});c.append(element('label','Importar progresso (JSON, até 1 MiB)',{for:'import-file'}),input);
  const message=element('p','',{role:'status'});c.append(message);
  input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;try{if(file.size>MAX_BYTES)throw new Error('O arquivo deve ter até 1 MiB.');const candidate=parseRecord(await file.text());restore({...candidate,slot:'current'});}catch(error){message.textContent=`Importação recusada: ${error.message} Seu progresso atual foi mantido.`;}});
  if(scan.errors.length)c.append(element('p',`${scan.errors.length} registro(s) não puderam ser lidos. Não foram apagados. Use uma cópia válida ou importe um arquivo.`,{class:'notice'}));
  if(!scan.candidates.length)c.append(element('p','Não há cópia válida disponível nesta origem.'));
  const dedup=new Set();for(const candidate of scan.candidates){const identity=`${candidate.base}:${candidate.slot}`;if(dedup.has(identity))continue;dedup.add(identity);const b=element('button',`${candidate.label} · ${sceneNames[view(candidate.state).scene]} · ${new Date(candidate.record.updatedAt).toLocaleString('pt-BR')}`,{type:'button'});b.addEventListener('click',()=>restore(candidate));c.append(b);}
  const start=element('button','Começar outro percurso',{type:'button'});start.addEventListener('click',restart);c.append(start);
});}
const introduction=createIntroduction({locale:'pt',adapter,ui:introductionUI,paint,getState:()=>state});
initDialogs();
$('intro-button').addEventListener('click',()=>introduction.review());
for(const id of ['diary-button','ledger-diary'])$(id).addEventListener('click',()=>openDiary(state));
$('notes-button').addEventListener('click',openNotes);
$('help-button').addEventListener('click',openHelp);
$('save-button').addEventListener('click',recover);
$('history-button').addEventListener('click',()=>openHistory(state,index=>{store.fork();state=rewind(state,index);introduction.reset();landing=false;resume=null;conflict(false);save();paint();},exportProgress));
$('conflict-recover').addEventListener('click',recover);
$('conflict-export').addEventListener('click',exportProgress);
$('conflict-fork').addEventListener('click',()=>{store.fork();conflict(false);save();paint();});
window.addEventListener('storage',event=>{if(event.key==='zeus:v1:head'&&store.hasConflict()){conflict(true);status('Outra aba atualizou o percurso. Sua linha está preservada.');}});
paint(false);
status(location.protocol==='file:'?'Abra por um servidor HTTP local para usar os módulos e a persistência.':scan.available?resume?'Há progresso salvo neste navegador. Continue ou comece outra linha.':'O progresso será salvo neste navegador após cada confirmação.':'Armazenamento indisponível. Jogue nesta sessão e exporte para preservar o percurso.');
if(scan.needsRecovery)recover();
