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
  openDialog(title,c=>{paragraphs(c,[text]);if(exportAction)c.append(button("Export your path first",exportAction));c.append(button(label,()=>{closeDialog();action();},true),button("Cancel",closeDialog));});
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
  $('chapter').textContent=number?`Scene ${number} of 5 · ${sceneNames[v.scene]}`:v.scene==='AB'?"Phocis, mainland Greece · around 470 BCE":v.scene==='EP'?"Epilogue · what happened and what remains":"Discussion · reflect on your choices";
  $('progress').replaceChildren();for(let i=1;i<=5;i++){const li=element('li',String(i),{'aria-label':`Scene ${i}`});if(i===number)li.setAttribute('aria-current','step');$('progress').append(li);}
  $('scene-title').textContent=v.title;
  const image=illustrations[v.scene];$('art').hidden=!image||v.image===false;
  if(image&&v.image!==false){const img=$('scene-image');if(img.getAttribute('src')!==image.src){$('image-error').hidden=true;img.width=image.width;img.height=image.height;img.alt=image.alt;img.src=image.src;} $('image-description').textContent=image.description;$('art-caption').textContent=v.scene==='AB'?"The setting · a modern painting":"Before your choice · no outcome shown";}
  for(const id of ['paragraphs','information','oracle','choices','discussion','resources'])$(id).replaceChildren();
  paragraphs($('paragraphs'),v.paragraphs);
  if(v.info)for(const [title,text]of v.info){const d=element('details');d.append(element('summary',title),element('p',text));$('information').append(d);}
  if(v.oracle){const d=element('details');d.append(element('summary',"Read the oracle again"),element('p',oracle,{class:'oracle-quote'}),element('p',"Lísias reports this fictional message. No reading is confirmed."));$('oracle').append(d);}
  paragraphs($('resources'),resourceSummary(s));
  if(resume&&node==='AB'){
    const box=element('div',undefined,{class:'notice'});box.append(element('p',`A path is saved: ${sceneNames[view(resume.state).scene]}.`),button("Continue saved path",handlers.resume,true));$('choices').append(box);
  }
  if(node==='AB'){
    $('choices').append(button("Start the story",()=>handlers.command({type:'choose',id:'COMEÇAR'},node),true));
  }else if(v.options){
    const form=element('form',undefined,{'aria-label':"Choose, then confirm"}),fieldset=element('fieldset');fieldset.append(element('legend',node==='AB'?"Start":"Your choice"));
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
    $('discussion').append(element('h2',"Discussion questions"));const list=element('ol');
    for(const [i,q]of questions.entries()){const li=element('li');li.append(element('p',q));const label=element('label',`Note ${i+1} (optional)`,{for:`response-${i}`,class:'response-hint'}),field=element('textarea',undefined,{id:`response-${i}`,rows:'3'});li.append(label,field);list.append(li);}
    $('discussion').append(list,element('p',"These notes are not saved. Copy them before you leave.",{class:'response-hint'}),element('h2',"Compare paths"),element('p',activity),button("Read the historical notes",openNotes),button("Begin another path",handlers.restart));
  }
  $('ledger').hidden=v.scene==='AB';
  if(focus){$('scene-title').focus({preventScroll:true});$('scene-title').scrollIntoView({block:'start',behavior:'auto'});announce(v.options?"Read the situation and choose.":v.terminal?"Discussion is ready.":"Read what happened before continuing.");}
}
export function openDiary(s){openDialog("Your journal",c=>{
  c.append(element('h3',"Resources"));paragraphs(c,resourceSummary(s));
  c.append(element('h3',"Commitments: promised, agreed, done"));
  if(!s.commitments.length)c.append(element('p',"No commitments recorded yet."));
  for(const item of s.commitments){const block=element('section',undefined,{class:'commitment'});block.append(element('h3',item.object));paragraphs(block,[`Who is responsible: ${item.by}. Who receives help: ${item.beneficiary}.`,`Promised: ${item.promised?"yes":"no personal promise recorded"}. Permission: ${item.authorized?"agreed within the stated limits":"not fully agreed"}. Done: ${item.realized?"yes":"no"}.`,...(item.deadline?[`Deadline: ${item.deadline}.`]:[]),...(item.conditions?[`Conditions: ${item.conditions}`]:[])]);c.append(block);}
  c.append(element('h3',"What people saw and said"));
  if(!s.journal.length)c.append(element('p',"Your journal will fill as you play."));
  for(const item of s.journal){const p=element('p',undefined,{class:'journal-entry'});p.append(element('span',`${item.scene} · ${item.kind}`,{class:'journal-kind'}),document.createTextNode(translateText(item.text)));c.append(p);}
});}
export function openHistory(s,onRewind,exportAction){openDialog("Review your path",c=>{
  paragraphs(c,["Rereading changes nothing. To choose differently, start a copy from an earlier point. Later choices will be removed from that copy. Your old path stays saved."]);
  for(const item of s.history){const d=element('details',undefined,{class:'history-item'});d.append(element('summary',`${item.scene} · ${item.title}`));paragraphs(d,item.paragraphs);if(item.at<s.commands.length)d.append(button("Choose again from here",()=>confirmDialog("Return to this point?",`Return to “${item.title}” in a copy without the later choices?`,()=>onRewind(item.at),{exportAction,label:"Start a copy from here"})));c.append(d);}
});}
export function openNotes(){openDialog("Historical notes and sources",c=>{
  paragraphs(c,historicalNotes);c.append(element('h3',"Sources for the story"),element('p',"Source links open in a new tab."));
  for(const [title,url,caveat]of references){const p=element('p');p.append(element('a',title,{href:url,target:'_blank',rel:"noopener noreferrer"}),element('span',` — ${caveat}`));c.append(p);}
  c.append(element('p',"Evidence: what a source supports. Reconstruction: a plausible scene built from historical parallels. Invention: this story's people, events, and rules. Some sources still need further checks."));
});}

export function openHelp(){openDialog("How to play",c=>{
  paragraphs(c,[
    "Choose an option, read its cost and limits, then select Confirm choice. Check the available resources beside the story.",
    "You play as Níkanor. You can offer your work, report needs, and suggest plans. You cannot decide how to use your family's food or act for the whole city. The people who control the food or work time must agree before it is used.",
    "A promise is not permission. Permission is not help already given. Your journal keeps these separate, alongside what people saw, reported, and understood.",
    "The journey to Delphi is already funded. You do not need to give food or work to join it.",
    "Use Review to reread or try different choices in a saved copy. Use Progress to export or recover your path. Discussion notes are not saved.",
    "Historical notes explains what the sources support, what has been reconstructed, and what is invented. No choice proves what the gods intend."
  ]);
});}
