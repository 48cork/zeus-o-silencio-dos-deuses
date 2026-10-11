import { panels } from '../data/introducao.js';
// Read position is separate from the existing save envelope and command log.
export function createIntroduction({locale,adapter,ui,paint,getState}) {
  const en=locale==='en',pages=panels(locale),$=id=>document.getElementById(id);
  let active=false,index=0,key=null;
  const label=(pt,english)=>en?english:pt;
  const button=(text,action)=>{const b=ui.element('button',text,{type:'button'});b.addEventListener('click',action);return b;};
  function runKey(){try{const head=adapter.getItem('zeus:v1:head'),record=JSON.parse(adapter.getItem(`${head}:current`));return record?.runId&&JSON.stringify(record.commands)===JSON.stringify(getState().commands)?`zeus:intro:v1:${record.runId}`:null;}catch{return null;}}
  function remember(){try{if(key)adapter.setItem(key,JSON.stringify({version:1,index}));}catch{/* Reading remains available without storage. */}}
  function finish(){active=false;try{if(key)adapter.removeItem(key);}catch{}key=null;paint();}
  function begin(){active=true;index=0;key=runKey();remember();}
  function reset(){active=false;key=null;index=0;}
  function restore(){reset();if(getState().node!=='C01'||getState().commands.length!==1)return;key=runKey();try{const saved=JSON.parse(key&&adapter.getItem(key));if(saved?.version===1&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<4){active=true;index=saved.index;}}catch{} }
  function controls(container,change,leave,review=false){
    const actions=ui.element('div',undefined,{class:'actions'});
    const back=button(label('Voltar','Back'),()=>change(index-1));back.disabled=index===0;actions.append(back);
    actions.append(button(index===3?label(review?'Voltar à partida':'Ir para a escolha',review?'Return to the story':'Go to the choice'):label('Próximo','Next'),()=>index===3?leave():change(index+1)));
    actions.append(button(label(review?'Fechar revisão':'Pular introdução',review?'Close review':'Skip introduction'),leave));container.append(actions);
  }
  function render(){if(!active)return;const p=pages[index];
    $('chapter').textContent=label(`Introdução · quadro ${index+1} de 4`,`Introduction · panel ${index+1} of 4`);$('scene-title').textContent=p.title;
    $('progress').replaceChildren();$('ledger').hidden=true;$('art').hidden=false;
    const img=$('scene-image');img.width=p.width;img.height=p.height;img.alt=p.alt;img.src=p.src;$('image-error').hidden=true;
    // Hide fallback only once the new image loads; a failed image leaves all text readable.
    if(img.complete&&img.naturalWidth>0)$('image-error').hidden=true;
    $('image-description').textContent=p.alt;$('art-caption').textContent=label(`Quadro ${index+1} de 4 · antes da decisão`,`Panel ${index+1} of 4 · before the choice`);
    for(const id of ['paragraphs','information','oracle','choices','discussion'])$(id).replaceChildren();ui.paragraphs($('paragraphs'),p.text);
    controls($('choices'),next=>{index=next;remember();render();},finish);
    $('scene-title').focus({preventScroll:true});$('scene-title').scrollIntoView({block:'start',behavior:'auto'});ui.announce(label(`Quadro ${index+1} de 4`,`Panel ${index+1} of 4`));
  }
  function review(){
    const prior=index;let cursor=0;
    ui.openDialog(label('Rever introdução','Review introduction'),container=>{
      function draw(){const p=pages[cursor];container.replaceChildren();
        const title=ui.element('h3',p.title,{tabindex:'-1'});container.append(title,ui.element('p',label(`Quadro ${cursor+1} de 4`,`Panel ${cursor+1} of 4`)));
        const img=ui.element('img',undefined,{src:p.src,alt:p.alt,width:p.width,height:p.height,class:'intro-review-image'});container.append(img);ui.paragraphs(container,p.text);
        const description=ui.element('details');description.append(ui.element('summary',label('Descrição da imagem','Image description')),ui.element('p',p.alt));container.append(description);
        const retry=button(label('Tentar carregar a imagem novamente','Retry image'),()=>{img.removeAttribute('src');img.src=p.src;});container.append(retry);
        const actions=ui.element('div',undefined,{class:'actions'}),back=button(label('Voltar','Back'),()=>{cursor--;draw();});back.disabled=cursor===0;actions.append(back);
        actions.append(button(cursor===3?label('Voltar à partida','Return to the story'):label('Próximo','Next'),()=>{if(cursor===3)ui.closeDialog();else{cursor++;draw();}}));container.append(actions);
        title.focus();ui.announce(label(`Quadro ${cursor+1} de 4`,`Panel ${cursor+1} of 4`));
      }
      draw();index=prior;
    });
  }
  return {begin,reset,restore,render,review,get active(){return active;}};
}
