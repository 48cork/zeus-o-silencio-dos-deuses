import { initialState, dispatch, rewind } from './engine.js';
import { createStore, parseRecord, MAX_BYTES } from './storage.js';
import { view, sceneNames } from '../data/episodio.js';
import { render, initDialogs, openDiary, openHistory, openNotes, openDialog, closeDialog, confirmDialog, element, status, conflict, announce } from './ui.js';
let adapter;try{adapter=window.localStorage;}catch{adapter={getItem(){throw new Error("Storage blocked.");}};}
const store=createStore(adapter);let state=initialState(),scan=store.scan(),resume=scan.current,landing=true;
const $=id=>document.getElementById(id);
function notify(result){status(result.ok?"Progress saved in this browser.":result.conflict?"Another path was updated. Your branch was preserved.":"Unable to save. Your path continues in this session; export it to preserve it.");if(result.conflict)conflict(true);}
function paint(focus=true){render(state,{command:act,resume:continueSaved,restart},{focus,resume:landing?resume:null});}
function save({force=false}={}){const result=store.save(state,{force});notify(result);return result;}
function exportProgress(){const source=landing&&resume?JSON.stringify(resume.record,null,2):store.export(state);const blob=new Blob([source],{type:'application/json'});const url=URL.createObjectURL(blob);const link=element('a',undefined,{href:url,download:'zeus-progresso.json'});document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce("Progress file exported.");}
function act(command,node){
  if(state.node!==node)return;
  if(store.hasConflict()){conflict(true);status("Another tab updated progress. Recover a branch or continue in a copy before confirming.");return;}
  if(landing&&resume&&command.type==='choose') {confirmDialog("Begin Another Path?","The saved path will be preserved. You will begin a new branch.",()=>{store.fork();resume=null;landing=false;act(command,node);},{exportAction:exportProgress,label:"Begin a new branch"});return;}
  try{state=dispatch(state,command);landing=false;resume=null;save();paint();}catch(error){status(`Unable to confirm: ${error.message}`);}
}
function continueSaved(){if(!resume)return;state=resume.state;store.adopt(resume.record);landing=false;resume=null;conflict(false);paint();status("Path recovered. Consequences were reconstructed without executing them again.");}
function restart(){confirmDialog("Begin Another Path?","You will return to the opening in a new branch. The previous path remains recoverable.",()=>{store.clearForNew();state=initialState();landing=false;resume=null;conflict(false);save();paint();},{exportAction:exportProgress,label:"Begin another branch"});}
function restore(candidate){confirmDialog("Recover This Path?",`Continue at ${sceneNames[view(candidate.state).scene]} using ${candidate.slot==='backup'?"the previous copy":"the selected record"}? Your current path will be preserved.`,()=>{state=candidate.state;store.fork();store.adopt(candidate.record);landing=false;resume=null;conflict(false);save({force:true});paint();},{exportAction:exportProgress,label:"Recover path"});}
function recover(){scan=store.scan();openDialog("Progress and Recovery",c=>{
  c.append(element('p',"Progress stays in this browser and on this origin. Clearing data or using another origin can make it unavailable. Export to transfer it or preserve a copy."));
  const exp=element('button',"Export my path",{type:'button'});exp.addEventListener('click',exportProgress);c.append(exp);
  const input=element('input',undefined,{type:'file',accept:'.json,application/json',id:'import-file'});c.append(element('label',"Import progress (JSON, up to 1 MiB)",{for:'import-file'}),input);
  const message=element('p','',{role:'status'});c.append(message);
  input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;try{if(file.size>MAX_BYTES)throw new Error("The file must be no larger than 1 MiB.");const candidate=parseRecord(await file.text());restore({...candidate,slot:'current'});}catch(error){message.textContent=`Import refused: ${error.message} Your current progress was kept.`;}});
  if(scan.errors.length)c.append(element('p',`${scan.errors.length} record(s) could not be read. They were not deleted. Use a valid copy or import a file.`,{class:'notice'}));
  if(!scan.candidates.length)c.append(element('p',"No valid copy is available on this origin."));
  const dedup=new Set();for(const candidate of scan.candidates){const identity=`${candidate.base}:${candidate.slot}`;if(dedup.has(identity))continue;dedup.add(identity);const b=element('button',`${candidate.label} · ${sceneNames[view(candidate.state).scene]} · ${new Date(candidate.record.updatedAt).toLocaleString('en')}`,{type:'button'});b.addEventListener('click',()=>restore(candidate));c.append(b);}
  const start=element('button',"Begin another path",{type:'button'});start.addEventListener('click',restart);c.append(start);
});}
initDialogs();
for(const id of ['diary-button','ledger-diary'])$(id).addEventListener('click',()=>openDiary(state));
$('notes-button').addEventListener('click',openNotes);
$('save-button').addEventListener('click',recover);
$('history-button').addEventListener('click',()=>openHistory(state,index=>{store.fork();state=rewind(state,index);landing=false;resume=null;conflict(false);save();paint();},exportProgress));
$('conflict-recover').addEventListener('click',recover);
$('conflict-export').addEventListener('click',exportProgress);
$('conflict-fork').addEventListener('click',()=>{store.fork();conflict(false);save();paint();});
window.addEventListener('storage',event=>{if(event.key==='zeus:v1:head'&&store.hasConflict()){conflict(true);status("Another tab updated the path. Your branch is preserved.");}});
paint(false);
status(location.protocol==='file:'?"Open through a local HTTP server to use modules and persistence.":scan.available?resume?"There is saved progress in this browser. Continue or begin another branch.":"Progress will be saved in this browser after each confirmation.":"Storage unavailable. Play in this session and export to preserve your path.");
if(scan.needsRecovery)recover();
