import { translateText } from '../data/translations.js';
import { illustrations } from '../data/ilustracoes.js';
import { view, sceneNames, oracle, questions, activity, references, historicalNotes } from '../data/episodio.js';
import { resourceSummary } from './engine.js';
const $=id=>document.getElementById(id);
export function element(tag,text,attrs={}) { const e=document.createElement(tag); if(text!==undefined)e.textContent=translateText(text); for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v); return e; }
function button(text,handler,primary=false) {const b=element('button',text,{type:'button'});if(primary)b.className='primary';b.addEventListener('click',handler);return b;}
export function paragraphs(container,texts) {
  for(let text of texts){
    const p=element('p');
    text=translateText(text);
    if(text===oracle){p.className='oracle-quote';p.textContent=text;}
    else {const m=text.match(/^([^:]{1,85}): “(.*)”$/s);if(m){p.className='dialogue';p.append(element('span',`${m[1]}: `,{class:'speaker'}),document.createTextNode(`“${m[2]}”`));}else p.textContent=text;}
    container.append(p);
  }
}
let dialogOrigin=null;
export function openDialog(title,build) {
  const d=$('utility-dialog'); if(d.open)d.close();dialogOrigin=document.activeElement;
  $('dialog-title').textContent=title;const content=$('dialog-content');content.replaceChildren();build(content);d.showModal();$('dialog-close').focus();
}
export function closeDialog(){ $('utility-dialog').close(); }
export function announce(text){$('announcement').textContent=text;}
export function status(text){$('storage-status').textContent=text;}
export function conflict(show){$('conflict').hidden=!show;}
export function confirmDialog(title,text,action,{exportAction=null,label="Confirm"}={}) {
  openDialog(title,c=>{paragraphs(c,[text]);if(exportAction)c.append(button("Export path first",exportAction));c.append(button(label,()=>{closeDialog();action();},true),button("Cancel",closeDialog));});
}
export function initDialogs() {
  $('dialog-close').addEventListener('click',closeDialog);
  $('utility-dialog').addEventListener('close',()=>{if(dialogOrigin?.isConnected)dialogOrigin.focus();});
  const imageDialog=$('image-dialog');let imageOrigin=null,zoom=1;
  const apply=()=>{$('zoom-image').style.width=`${zoom*100}%`;$('zoom-status').textContent=`${Math.round(zoom*100)}%`;};
  $('enlarge-button').addEventListener('click',()=>{imageOrigin=document.activeElement;const img=$('scene-image');$('zoom-image').src=img.src;$('zoom-image').alt=img.alt;$('zoom-image').width=img.width;$('zoom-image').height=img.height;$('zoom-description').textContent=$('image-description').textContent;zoom=1;apply();imageDialog.showModal();$('image-close').focus();});
  $('image-close').addEventListener('click',()=>imageDialog.close());
  imageDialog.addEventListener('close',()=>imageOrigin?.isConnected&&imageOrigin.focus());
  $('zoom-in').addEventListener('click',()=>{zoom=Math.min(3,zoom+.25);apply();});
  $('zoom-out').addEventListener('click',()=>{zoom=Math.max(1,zoom-.25);apply();});
  $('zoom-reset').addEventListener('click',()=>{zoom=1;apply();$('zoom-viewport').scrollTo(0,0);});
  $('scene-image').addEventListener('error',()=>{$('image-error').hidden=false;});
  $('scene-image').addEventListener('load',()=>{$('image-error').hidden=true;});
  $('image-retry').addEventListener('click',()=>{const img=$('scene-image');const src=img.getAttribute('src');img.removeAttribute('src');img.src=src;});
}
export function render(s,handlers,{focus=true,resume=null}={}) {
  const v=view(s),node=s.node;
  const number=/^C0[1-5]$/.test(v.scene)?Number(v.scene.slice(-1)):0;
  $('chapter').textContent=number?`Scene ${number} of 5 · ${sceneNames[v.scene]}`:v.scene==='AB'?"Greek mainland · around 470 BCE":v.scene==='EP'?"Epilogue · commitments and consequences":"Discussion · information, choice, and learning";
  $('progress').replaceChildren();for(let i=1;i<=5;i++){const li=element('li',String(i),{'aria-label':`Scene ${i}`});if(i===number)li.setAttribute('aria-current','step');$('progress').append(li);}
  $('scene-title').textContent=v.title;
  const image=illustrations[v.scene];$('art').hidden=!image||v.image===false;
  if(image&&v.image!==false){const img=$('scene-image');if(img.getAttribute('src')!==image.src){$('image-error').hidden=true;img.width=image.width;img.height=image.height;img.alt=image.alt;img.src=image.src;} $('image-description').textContent=image.description;$('art-caption').textContent=v.scene==='AB'?"Episode landscape · contemporary painting":"Image of the initial situation · does not show the consequences of your choice";}
  for(const id of ['paragraphs','information','oracle','choices','discussion','resources'])$(id).replaceChildren();
  paragraphs($('paragraphs'),v.paragraphs);
  if(v.info)for(const [title,text]of v.info){const d=element('details');d.append(element('summary',title),element('p',text));$('information').append(d);}
  if(v.oracle){const d=element('details');d.append(element('summary',"Reread the oracular message"),element('p',oracle,{class:'oracle-quote'}),element('p',"Fictional message reported by Lísias; no interpretation is confirmed."));$('oracle').append(d);}
  paragraphs($('resources'),resourceSummary(s));
  if(resume&&node==='AB'){
    const box=element('div',undefined,{class:'notice'});box.append(element('p',`There is a saved path: ${sceneNames[view(resume.state).scene]}.`),button("Continue saved path",handlers.resume,true));$('choices').append(box);
  }
  if(v.options){
    const form=element('form',undefined,{'aria-label':"Choice and confirmation"}),fieldset=element('fieldset');fieldset.append(element('legend',node==='AB'?"Start":"Your choice"));
    const submit=element('button',node==='AB'?"Begin":"Confirm choice",{type:'submit',class:'primary'});submit.disabled=true;let selected=null;
    for(const [i,o] of v.options.entries()){
      const label=element('label',undefined,{class:'option'}),input=element('input',undefined,{type:'radio',name:'choice',value:o.id,id:`choice-${i}`});input.disabled=Boolean(o.reason);
      const body=element('span'),name=element('span',o.label,{class:'label',id:`choice-label-${i}`}),cost=element('span',`Cost and limit: ${o.cost}`,{class:'cost',id:`choice-cost-${i}`});
      body.append(name,cost);input.setAttribute('aria-describedby',`choice-cost-${i}${o.reason?` choice-reason-${i}`:''}`);
      if(o.reason)body.append(element('span',`Unavailable: ${o.reason}`,{class:'reason',id:`choice-reason-${i}`}));
      input.addEventListener('change',()=>{selected=o.id;submit.disabled=false;});label.append(input,body);fieldset.append(label);
    }
    form.append(fieldset,submit);form.addEventListener('submit',event=>{event.preventDefault();if(selected!==null)handlers.command({type:'choose',id:selected},node);});$('choices').append(form);
  }else if(!v.terminal){const actions=element('div',undefined,{class:'actions'});actions.append(button(v.scene==='EP'?"Open discussion":"Continue",()=>handlers.command({type:'continue'},node),true));$('choices').append(actions);}
  if(v.discussion){
    $('discussion').append(element('h2',"Questions for Discussion"));const list=element('ol');
    for(const [i,q]of questions.entries()){const li=element('li');li.append(element('p',q));const label=element('label',`Note ${i+1} (optional)`,{for:`response-${i}`,class:'response-hint'}),field=element('textarea',undefined,{id:`response-${i}`,rows:'3'});li.append(label,field);list.append(li);}
    $('discussion').append(list,element('p',"These notes are not saved with your progress. Copy them before leaving.",{class:'response-hint'}),element('h2',"Compare Paths"),element('p',activity),button("View historical notes and references",openNotes),button("Begin another path",handlers.restart));
  }
  $('ledger').hidden=v.scene==='AB';
  if(focus){$('scene-title').focus({preventScroll:true});$('scene-title').scrollIntoView({block:'start',behavior:'auto'});announce(v.options?"Situation and choices available.":v.terminal?"Discussion available.":"Consequence displayed. Read before continuing.");}
}
export function openDiary(s){openDialog("Path Journal",c=>{
  c.append(element('h3',"Resources"));paragraphs(c,resourceSummary(s));
  c.append(element('h3',"Commitments: promise, authorization, and completion"));
  if(!s.commitments.length)c.append(element('p',"No commitment has been recorded yet."));
  for(const item of s.commitments){const block=element('section',undefined,{class:'commitment'});block.append(element('h3',item.object));paragraphs(block,[`Responsible person: ${item.by}. Recipient: ${item.beneficiary}.`,`Promised: ${item.promised?"yes":"not recorded as a personal promise"}. Authorization: ${item.authorized?"confirmed for the stated scope":"not fully confirmed"}. Completed: ${item.realized?"yes":"no"}.`,...(item.deadline?[`Deadline: ${item.deadline}.`]:[]),...(item.conditions?[`Conditions: ${item.conditions}`]:[])]);c.append(block);}
  c.append(element('h3',"What Was Observed and Reported"));
  if(!s.journal.length)c.append(element('p',"The journal will fill up during the episode."));
  for(const item of s.journal){const p=element('p',undefined,{class:'journal-entry'});p.append(element('span',`${item.scene} · ${item.kind}`,{class:'journal-kind'}),document.createTextNode(translateText(item.text)));c.append(p);}
});}
export function openHistory(s,onRewind,exportAction){openDialog("Review Your Path",c=>{
  paragraphs(c,["Rereading does not change resources. Revisiting creates a new branch from the chosen point; later choices are discarded from that new branch. The previous path remains recoverable."]);
  for(const item of s.history){const d=element('details',undefined,{class:'history-item'});d.append(element('summary',`${item.scene} · ${item.title}`));paragraphs(d,item.paragraphs);if(item.at<s.commands.length)d.append(button("Revisit from this point",()=>confirmDialog("Revisit This Section?",`Resume “${item.title}” and discard later choices in this new branch?`,()=>onRewind(item.at),{exportAction,label:"Revisit in a new branch"})));c.append(d);}
});}
export function openNotes(){openDialog("Historical Notes and References",c=>{
  paragraphs(c,historicalNotes);c.append(element('h3',"References Recorded in the Conception"),element('p',"Reference links open in a new tab."));
  for(const [title,url,caveat]of references){const p=element('p');p.append(element('a',title,{href:url,target:'_blank',rel:"noopener noreferrer"}),element('span',` — ${caveat}`));c.append(p);}
  c.append(element('p',"Evidence is what a source supports; reconstruction combines parallels with hypotheses; invention creates the episode's events and rules. Not all sources were rechecked during implementation."));
});}
