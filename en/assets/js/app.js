import { initialState, dispatch, rewind } from './engine.js';
import { createStore, parseRecord, MAX_BYTES } from './storage.js';
import { view, sceneNames } from '../data/episodio.js';
import { render, initDialogs, openDiary, openHistory, openNotes, openDialog, closeDialog, confirmDialog, element, status, conflict, announce } from './ui.js';
let adapter;try{adapter=window.localStorage;}catch{adapter={getItem(){throw new Error("Browser storage is blocked.");}};}
const store=createStore(adapter);let state=initialState(),scan=store.scan(),resume=scan.current,landing=true;
const $=id=>document.getElementById(id);
function notify(result){status(result.ok?"Progress saved in this browser.":result.conflict?"Another path changed. Your path is safe.":"Cannot save in this browser. You can keep playing here. Export your path to keep a copy.");if(result.conflict)conflict(true);}
function paint(focus=true){render(state,{command:act,resume:continueSaved,restart},{focus,resume:landing?resume:null});}
function save({force=false}={}){const result=store.save(state,{force});notify(result);return result;}
function exportProgress(){const source=landing&&resume?JSON.stringify(resume.record,null,2):store.export(state);const blob=new Blob([source],{type:'application/json'});const url=URL.createObjectURL(blob);const link=element('a',undefined,{href:url,download:'zeus-progresso.json'});document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce("Progress file exported.");}
function act(command,node){
  if(state.node!==node)return;
  if(store.hasConflict()){conflict(true);status("Another tab saved new progress. Recover a saved path or continue in a copy before choosing again.");return;}
  if(landing&&resume&&command.type==='choose') {confirmDialog("Start another path?","Your current path stays saved. You will start a new one.",()=>{store.fork();resume=null;landing=false;act(command,node);},{exportAction:exportProgress,label:"Start a new path"});return;}
  try{state=dispatch(state,command);landing=false;resume=null;save();paint();}catch(error){status(`Cannot confirm: ${error.message}`);}
}
function continueSaved(){if(!resume)return;state=resume.state;store.adopt(resume.record);landing=false;resume=null;conflict(false);paint();status("Path recovered. Past choices were restored without using resources again.");}
function restart(){confirmDialog("Start another path?","You will start again at the opening. Your old path stays saved.",()=>{store.clearForNew();state=initialState();landing=false;resume=null;conflict(false);save();paint();},{exportAction:exportProgress,label:"Start another path"});}
function restore(candidate){confirmDialog("Recover this path?",`Continue at ${sceneNames[view(candidate.state).scene]} using ${candidate.slot==='backup'?"the previous copy":"the selected save"}? Your current path stays saved.`,()=>{state=candidate.state;store.fork();store.adopt(candidate.record);landing=false;resume=null;conflict(false);save({force:true});paint();},{exportAction:exportProgress,label:"Recover path"});}
function recover(){scan=store.scan();openDialog("Save and recover progress",c=>{
  c.append(element('p',"Progress is saved in this browser for this website. It may be lost if you clear browser data or use another address. Export a file to keep a copy or move it."));
  const exp=element('button',"Export my path",{type:'button'});exp.addEventListener('click',exportProgress);c.append(exp);
  const input=element('input',undefined,{type:'file',accept:'.json,application/json',id:'import-file'});c.append(element('label',"Import progress (JSON file, up to 1 MiB)",{for:'import-file'}),input);
  const message=element('p','',{role:'status'});c.append(message);
  input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;try{if(file.size>MAX_BYTES)throw new Error("The file must be 1 MiB or smaller.");const candidate=parseRecord(await file.text());restore({...candidate,slot:'current'});}catch(error){message.textContent=`Cannot import: ${error.message} Your current progress is safe.`;}});
  if(scan.errors.length)c.append(element('p',`${scan.errors.length} save(s) could not be read. They were kept. Use another valid save or import a file.`,{class:'notice'}));
  if(!scan.candidates.length)c.append(element('p',"No valid save was found for this website."));
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
window.addEventListener('storage',event=>{if(event.key==='zeus:v1:head'&&store.hasConflict()){conflict(true);status("Another tab changed this path. Your copy is safe.");}});
paint(false);
status(location.protocol==='file:'?"Open the game through a local web server. It cannot run directly from the file.":scan.available?resume?"This browser has saved progress. Continue it or start another path.":"Your progress will be saved here after each confirmed choice.":"Browser storage is unavailable. You can play here. Export your path to keep it.");
if(scan.needsRecovery)recover();
