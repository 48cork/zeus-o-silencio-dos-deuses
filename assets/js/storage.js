import { CONTENT_VERSION } from '../data/episodio.js';
import { replay } from './engine.js';
export const PREFIX='zeus:v1:';
export const HEAD=`${PREFIX}head`;
export const MAX_BYTES=1024*1024;
const uuid=()=>globalThis.crypto.randomUUID();
export function envelope(state, runId=uuid(), revision=state.commands.length) {
  return {schema:1,content:CONTENT_VERSION,runId,revision,updatedAt:new Date().toISOString(),commands:structuredClone(state.commands)};
}
export function validateRecord(record) {
  if(!record||typeof record!=='object'||Array.isArray(record)||Object.keys(record).sort().join(',')!=='commands,content,revision,runId,schema,updatedAt')throw new Error('Formato de progresso inválido.');
  if(record.schema!==1||record.content!==CONTENT_VERSION)throw new Error('O arquivo não corresponde a uma versão compatível.');
  if(typeof record.runId!=='string'||!/^[\w-]{1,80}$/.test(record.runId)||!Number.isSafeInteger(record.revision)||record.revision<0||typeof record.updatedAt!=='string'||!Number.isFinite(Date.parse(record.updatedAt)))throw new Error('Identificação de progresso inválida.');
  const state=replay(record.commands);
  if(record.revision!==record.commands.length)throw new Error('Revisão de progresso inválida.');
  return state;
}
export function parseRecord(text) {
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)throw new Error('O arquivo deve ter até 1 MiB.');
  const record=JSON.parse(text); const state=validateRecord(record); return {record,state};
}
export function createStore(adapter, writerId=uuid()) {
  let base=`${PREFIX}branch:${writerId}`;
  let expected=null, runId=uuid(), initialized=false;
  const validBase=v=>typeof v==='string'&&/^zeus:v1:branch:[\w-]{1,80}$/.test(v);
  function rawHead(){return adapter.getItem(HEAD);}
  function scan() {
    const candidates=[],errors=[];
    try {
      const head=rawHead(); if(!initialized){expected=head;initialized=true;}
      const bases=new Set(validBase(head)?[head]:[]);
      for(let i=0;i<adapter.length;i++) {const key=adapter.key(i);if(key?.endsWith(':current')&&validBase(key.slice(0,-8)))bases.add(key.slice(0,-8));}
      for(const b of bases)for(const slot of ['current','backup']){
        const raw=adapter.getItem(`${b}:${slot}`);if(raw===null)continue;
        try {const parsed=parseRecord(raw);candidates.push({...parsed,base:b,slot,label:slot==='backup'?'Cópia anterior':'Percurso salvo',active:b===head});}
        catch(error){errors.push({base:b,slot,message:error.message});}
      }
      candidates.sort((a,b)=>Number(b.active)-Number(a.active)||Number(a.slot==='backup')-Number(b.slot==='backup')||Date.parse(b.record.updatedAt)-Date.parse(a.record.updatedAt));
      const current=candidates.find(c=>c.active&&c.slot==='current')||null;
      return {current,candidates,errors,available:true,needsRecovery:!current&&(candidates.length>0||errors.length>0)};
    }catch(error){return {current:null,candidates:[],errors:[{message:error.message}],available:false,needsRecovery:false};}
  }
  function adopt(record) { validateRecord(record);runId=record.runId;try{expected=rawHead();}catch{expected=null;} }
  function hasConflict(){try{return rawHead()!==expected;}catch{return false;}}
  function save(state,{force=false}={}) {
    const record=envelope(state,runId);
    try {
      if(!force&&hasConflict())return {ok:false,conflict:true,record};
      let old=adapter.getItem(`${base}:current`);
      if(old!==null){
        try{parseRecord(old);}catch{base=`${PREFIX}branch:${uuid()}`;old=null;}
        if(old!==null)adapter.setItem(`${base}:backup`,old);
      }
      adapter.setItem(`${base}:current`,JSON.stringify(record));
      adapter.setItem(HEAD,base);expected=base;
      return {ok:true,record};
    }catch(error){return {ok:false,conflict:false,message:error.message,record};}
  }
  function fork(){runId=uuid();base=`${PREFIX}branch:${uuid()}`;try{expected=rawHead();}catch{expected=null;}}
  function clearForNew(){fork();}
  return {scan,adopt,save,hasConflict,fork,clearForNew,get base(){return base;},export:state=>JSON.stringify(envelope(state,runId),null,2)};
}
