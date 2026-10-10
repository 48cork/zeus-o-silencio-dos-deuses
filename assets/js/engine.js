import { view, oracle, readings } from '../data/episodio.js';
const copy = value => structuredClone(value);
function note(s, kind, text) { s.journal.push({ kind, text, scene: view(s).scene }); }
function commitment(s, id, data = {}) {
  let c = s.commitments.find(c => c.id === id);
  if (!c) { c = { id, object: '', by: 'Níkanor', beneficiary: '', promised: false, authorized: false, realized: false, conditions: '', deadline: '' }; s.commitments.push(c); }
  Object.assign(c, data); return c;
}
function authorizeH(s, destination) {
  if (s.h.status !== 'livre') throw new Error('A margem doméstica não está livre.');
  s.h = { status: 'reservada', destination, consents: ['Myrrine', 'Fílon: sementes protegidas'] };
  note(s, 'Consentimento', 'Myrrine autoriza a porção para este destino; Fílon confirma que sementes e parcela ficam fora da cessão.');
}
function deliverH(s) {
  if (s.h.status !== 'reservada' || !s.h.consents.includes('Myrrine')) throw new Error('Entrega doméstica sem autorização.');
  s.h.status = 'entregue'; s.hTransfers++;
  note(s, 'Realização', 'A porção doméstica foi entregue. O consumo da casa foi reduzido e não há segunda margem livre.');
}
function deliverR(s) {
  if (s.r.status !== 'reservada') throw new Error('Reserva do doador não autorizada.');
  s.r.status = 'entregue'; s.rTransfers++;
  commitment(s, 'alimento-doador', {realized: true});
  note(s, 'Realização', 'O doador entregou a reserva que autorizou; sua margem doméstica diminuiu.');
}
function reserveWork(s, target) {
  if (s.w.target) throw new Error('O período já tem destinação.');
  if ((s.c02 === 'B' || s.promise === 'ABERTA') && target !== 'CASA') throw new Error('O período pertence à casa.');
  s.w = {target, realized: false, consents: target === 'CASA' ? ['Myrrine','Fílon'] : ['Myrrine','Fílon',target === 'DORIS' ? 'Dóris' : target === 'CULTO' ? 'Timôn' : 'Lísias']};
  if (target !== 'CASA') note(s, 'Consentimento', 'Myrrine e Fílon autorizam adiar o transporte doméstico para esta única dedicação.');
  if (target === 'DORIS') { commitment(s, 'trabalho-doris', {object: 'Trabalho com Dóris', beneficiary: 'Dóris', promised: true, authorized: true, conditions: 'Família e Dóris confirmaram este período.', deadline: 'Primeiro período após as tarefas básicas'}); note(s, 'Promessa', 'O trabalho com Dóris está confirmado para o único período; ainda não aconteceu.'); }
  if (target === 'CULTO') { commitment(s, 'trabalho-culto', {object: 'Preparo do novo encontro', beneficiary: 'Timôn e participantes', promised: true, authorized: true, conditions: 'Família e Timôn confirmaram este período.', deadline: 'Primeiro período após as tarefas básicas'}); note(s, 'Promessa', 'Níkanor aceita o preparo. Não há encontro realizado neste instante.'); }
  if (target === 'PLANO') { commitment(s, 'levantamento', {object:'Levantamento de condições para troca',beneficiary:'Lísias',promised:true,authorized:true,deadline:'Primeiro período após as tarefas básicas'}); note(s, 'Promessa', 'Níkanor aceita organizar informações, sem assumir viagem.'); }
  if (s.promise === 'RENEGOCIAR' && ['CULTO','PLANO'].includes(target)) note(s,'Renegociação','Dóris foi informada do encargo e mantém o novo prazo após as tarefas da casa. A jornada dela continua pendente.');
}
function performWork(s) {
  if (!s.w.target || s.w.realized) throw new Error('Execução inválida do período.');
  s.w.realized = true; s.wExecutions++;
  if (s.w.target === 'DORIS') commitment(s,'trabalho-doris',{realized:true});
  if (s.w.target === 'CULTO') commitment(s,'trabalho-culto',{realized:true});
  if (s.w.target === 'PLANO') commitment(s,'levantamento',{realized:true});
  note(s,'Realização', {CASA:'O transporte doméstico terminou; Fílon participa do reparo sentado.',DORIS:'O trabalho combinado com Dóris terminou. Isso não equivale a alimento recebido.',CULTO:'O preparo do novo encontro terminou.',PLANO:'O levantamento terminou. Transporte e partida continuam sem autorização.'}[s.w.target]);
}
function enter(s, node) {
  if (s.visited.includes(node)) throw new Error('O bloco já foi executado.');
  s.node = node; s.visited.push(node);
  switch (node) {
    case 'C01':
      note(s,'Observação','Campos com chuva insuficiente e reservas domésticas apertadas; a imagem não mede o estoque.');
      note(s,'Relato','Dóris relata perdas de vizinhos e nuvens vistas na véspera. Níkanor não presenciou esse levantamento.');
      note(s,'Consentimento','Dóris permite transmitir sua necessidade a Lísias, sem concordância automática com propostas em seu nome.'); break;
    case 'C01.out':
      if (s.c01 === 'A') { authorizeH(s,'doris-inicio'); deliverH(s); note(s,'Realização','Dóris recebeu alimento antes da viagem; não assumiu dívida de retorno.'); }
      if (s.c01 === 'B') { commitment(s,'trabalho-doris',{object:'Trabalho com Dóris',beneficiary:'Dóris',promised:true,conditions:'Aceito por Dóris; confirmação doméstica depende do retorno.',deadline:'Primeiro período viável após o retorno'}); note(s,'Promessa','Trabalho com Dóris após a volta, condicionado ao ajuste das tarefas domésticas.'); note(s,'Realização','Níkanor procurou vizinhos; nenhum confirmou entrega antes da partida.'); }
      if (s.c01 === 'C') note(s,'Relação','Níkanor explicou o limite; Dóris continua necessitando de ajuda, sem virar inimiga.'); break;
    case 'C02': note(s,'Relato','O doador anuncia reserva adicional limitada, separada do animal já fornecido, para discussão após o retorno.'); break;
    case 'C02.out':
      if (s.c02 === 'A') { authorizeH(s,'encontro-inicio'); deliverH(s); }
      if (s.c02 === 'B') { commitment(s,'preparo-inicial',{object:'Preparo do primeiro encontro',beneficiary:'Timôn',promised:true,authorized:true,realized:true}); note(s,'Consentimento','Timôn aceita trabalho; Myrrine assume tarefas e Fílon consente o adiamento do transporte, que será prioridade ao retorno.'); note(s,'Realização','Níkanor concluiu o preparo antes da partida. O encargo não será cobrado de novo.'); }
      if (s.c02 === 'C') note(s,'Consentimento','Timôn dispensa a contribuição nesta ocasião. A participação e a viagem permanecem.'); break;
    case 'C02.meal':
      if (s.revision === 'SIM') note(s,'Relato','Timôn encaminha o pedido de considerar necessidade. Não há revisão aprovada da partilha.');
      s.meals.push('primeiro-encontro'); note(s,'Realização','Dóris e Níkanor receberam alimento no primeiro encontro. A refeição não repõe as reservas domésticas.'); break;
    case 'C03.out':
      if (['CULTO','AMBAS'].includes(s.c03)) commitment(s,'relato-timon',{object:'Explicação fiel a Timôn',beneficiary:'Timôn',promised:true,authorized:true});
      if (['CASAS','AMBAS'].includes(s.c03)) commitment(s,'relato-doris',{object:'Transmissão da necessidade de Dóris',beneficiary:'Dóris',promised:true,authorized:true});
      note(s,'Promessa',s.c03 === 'CULTO' ? 'Níkanor levará explicação fiel a Timôn; não prometeu novo trabalho cultual.' : s.c03 === 'CASAS' ? 'Níkanor apresentará o relato consentido de Dóris.' : 'Níkanor comunicará as duas demandas e suas divergências, sem pacto garantido.');
      note(s,'Relato','Lísias encaminha a pergunta comum. A ênfase anterior não foi apagada.'); break;
    case 'C04':
      note(s,'Relato',`Mensagem trazida por Lísias, não testemunhada por Níkanor: ${oracle}`);
      note(s,'Observação','Níkanor viu um trecho do movimento de duas aves, parcialmente ocultas; não viu sua origem.');
      note(s,'Relato','Delegado afirma direção do templo e retorno ao interior; carregador relata mudança sobre viajantes. Lísias não viu o início.'); break;
    case 'C04.out': note(s,'Interpretação',s.c04 === 'DEFENDER' ? `Níkanor defende ${readings.find(r=>r.id===s.reading).label.toLowerCase()}, como interpretação, não verdade divina.` : s.c04 === 'CONCORRENTES' ? 'Níkanor leva leituras concorrentes para debate.' : 'Níkanor não vê fundamento suficiente para escolher uma leitura; ainda responde pelas ações.'); break;
    case 'C05.promise.out':
      if (s.promise === 'CUMPRIR') reserveWork(s,'DORIS');
      if (s.promise === 'RENEGOCIAR') { commitment(s,'trabalho-doris',{authorized:false,deadline:'Depois das tarefas domésticas pendentes',conditions:'Novo prazo aceito por Dóris; período futuro ainda depende da família.'}); note(s,'Renegociação','Dóris aceita novo prazo após tarefas da casa; não houve trabalho realizado.'); }
      if (s.promise === 'ABERTA') { commitment(s,'trabalho-doris',{authorized:false,conditions:'Sem novo prazo aceito; obrigação aberta.'}); note(s,'Renegociação','Níkanor reconhece o impedimento; Dóris não confirmou novo prazo.'); } break;
    case 'C05.meeting':
      for (const id of ['relato-timon','relato-doris']) { const c = s.commitments.find(c=>c.id===id); if (c) {c.realized=true;note(s,'Realização',`${c.object} foi transmitida na reunião. Não cria consenso ou bens disponíveis.`);} }
      if (s.revision === 'SIM') note(s,'Relato','O pedido de necessidade foi retomado, sem reforma geral aprovada.'); break;
    case 'C05.policy.out':
      if (['A','D'].includes(s.policy)) {s.r={status:'reservada',destination:s.policy==='A'?'doris-final':'encontro-final',consents:['Doador']}; commitment(s,'alimento-doador',{object:s.policy==='A'?'Reserva do doador para Dóris':'Reserva do doador para o encontro',by:'Doador',beneficiary:s.policy==='A'?'Dóris':'Participantes',authorized:true}); note(s,'Consentimento','Doador autoriza contribuição voluntária e limitada. A reunião não retira estoques alheios. Ainda não houve entrega.');}
      if (s.policy === 'B') note(s,'Consentimento','Não há contribuição extraordinária; o doador mantém sua reserva. Promessas anteriores continuam.');
      if (s.policy === 'C') {s.r={status:'condicional',destination:'possivel-saida',consents:['Doador: condicionada aos meios']};note(s,'Consentimento','Levantamento autorizado; reserva condicional do doador. Transporte, bens de troca e partida não estão confirmados.');} break;
    case 'C05.household.out': if (s.household === 'OFERECER') authorizeH(s,s.policy==='A'?'doris-final':'encontro-final'); else note(s,'Consentimento','A família preserva a margem sem cancelar a oferta do doador.'); break;
    case 'C05.work': if (!s.w.target && (s.c02==='B'||s.promise==='ABERTA')) reserveWork(s,'CASA'); break;
    case 'C05.work.out': reserveWork(s,s.workChoice); break;
    case 'C05.delivery.out':
      if (s.delivery === 'AGORA') { deliverR(s); if (s.h.status==='reservada') deliverH(s); note(s,'Realização','Dóris recebeu o alimento após a reunião; a entrega antecedeu a conferência das reservas do doador.'); }
      else {commitment(s,'transporte-alimento',{object:'Transporte da ajuda alimentar',beneficiary:'Dóris',promised:true,authorized:true,deadline:'Após este primeiro período'});note(s,'Realização','O doador conferiu as reservas; não entregou alimento.');note(s,'Promessa','Níkanor prometeu transporte futuro. Dóris espera; as porções estão comprometidas.');} break;
    case 'C05.execute': performWork(s); if (s.policy==='D') note(s,'Relato','O encontro está autorizado, mas não realizado por falta de trabalho confirmado. Níkanor não prometeu esse encargo.'); break;
    case 'C05.cult.out':
      if (s.cult==='AGORA') {performWork(s);deliverR(s);if(s.h.status==='reservada')deliverH(s);s.meals.push('novo-encontro');note(s,'Realização','Timôn realizou o novo encontro; Dóris e Níkanor receberam alimento. Transporte doméstico adiado, sem garantia de chuva.');}
      else {note(s,'Renegociação','Timôn aceita adiar; Myrrine e Fílon autorizam liberar este período do preparo e destiná-lo à casa.');commitment(s,'trabalho-culto',{authorized:false,conditions:'Timôn aceita adiamento; família ainda precisa confirmar período futuro.',deadline:'Período futuro a confirmar'});s.w={target:'CASA',realized:false,consents:['Myrrine','Fílon','Timôn: liberação do preparo']};performWork(s);note(s,'Relato','O encontro e a refeição não aconteceram; reservas continuam comprometidas.');if(s.promise==='RENEGOCIAR')note(s,'Relato','Dóris foi informada da mudança para dedicação doméstica; sua promessa continua.');} break;
  }
  const v = view(s);
  s.history.push({node,scene:v.scene,title:v.title,paragraphs:copy(v.paragraphs),at:s.commands.length});
  return s;
}
export function initialState() {
  return enter({node:'AB',commands:[],visited:[],history:[],journal:[],commitments:[],h:{status:'livre',destination:null,consents:[]},r:{status:'livre',destination:null,consents:[]},w:{target:null,realized:false,consents:[]},seeds:'protegidas',hTransfers:0,rTransfers:0,wExecutions:0,meals:[],c01:null,c02:null,revision:null,c03:null,c04:null,reading:null,promise:null,policy:null,household:null,workChoice:null,delivery:null,cult:null},'AB');
}
function executionNext(s) { return s.policy==='A'?'C05.delivery':s.policy==='D'&&s.w.target==='CULTO'?'C05.cult':'C05.execute'; }
export function dispatch(state, command) {
  if (!command || typeof command!=='object' || Array.isArray(command)) throw new Error('Comando inválido.');
  const v = view(state), keys=Object.keys(command).sort().join(',');
  if (command.type==='choose') {
    if(keys!=='id,type' || typeof command.id!=='string' || !v.options) throw new Error('Escolha fora de ordem.');
    const o=v.options.find(o=>o.id===command.id); if(!o || o.reason) throw new Error(o?.reason || 'Opção desconhecida.');
  } else if (command.type==='continue') { if(keys!=='type'||v.options||v.terminal) throw new Error('Avanço fora de ordem.'); }
  else throw new Error('Comando desconhecido.');
  const s=copy(state); s.commands.push(copy(command)); let next;
  if(command.type==='choose') {
    const map={AB:['','C01'],C01:['c01','C01.out'],C02:['c02','C02.out'],'C02.revision':['revision','C02.meal'],C03:['c03','C03.out'],C04:['c04',command.id==='DEFENDER'?'C04.reading':'C04.out'],'C04.reading':['reading','C04.out'],'C05.promise':['promise','C05.promise.out'],'C05.policy':['policy','C05.policy.out'],'C05.household':['household','C05.household.out'],'C05.work':['workChoice','C05.work.out'],'C05.delivery':['delivery','C05.delivery.out'],'C05.cult':['cult','C05.cult.out']};
    const [field,node]=map[s.node]; if(field)s[field]=command.id;next=node;
  } else {
    const map={'C01.out':'C02','C02.out':'C02.revision','C02.meal':'C03','C03.out':'C04','C04.out':'C05.home','C05.home':s.c01==='B'?'C05.promise':'C05.meeting','C05.promise.out':'C05.meeting','C05.meeting':'C05.policy','C05.policy.out':s.h.status==='livre'&&['A','D'].includes(s.policy)?'C05.household':'C05.work','C05.household.out':'C05.work','C05.work':executionNext(s),'C05.work.out':executionNext(s),'C05.delivery.out':'C05.execute','C05.execute':'EP','C05.cult.out':'EP',EP:'DISC'};
    next=map[s.node]; if(!next)throw new Error('Transição inexistente.');
  }
  return enter(s,next);
}
export function replay(commands) {
  if(!Array.isArray(commands)||commands.length>160)throw new Error('Sequência inválida ou muito longa.');
  return commands.reduce(dispatch,initialState());
}
export function rewind(state, index) {
  if(!Number.isInteger(index)||index<0||index>state.commands.length)throw new Error('Ponto de revisão inválido.');
  return replay(state.commands.slice(0,index));
}
export function resourceSummary(s) {
  const work=s.w.realized?'Dedicação após tarefas básicas: realizada uma única vez.':s.w.target?'Dedicação após tarefas básicas: reservada a um único destino.':s.c02==='B'?'Dedicação após tarefas básicas: será prioridade doméstica no retorno; não pode ser cedida de novo.':s.c01==='B'?'Dedicação após tarefas básicas: há promessa a Dóris, com confirmação doméstica condicionada ao retorno.':'Dedicação após tarefas básicas: ainda depende dos acordos no retorno.';
  return [s.h.status==='livre'?'Margem alimentar: preservada e ainda livre para uma única cessão.':s.h.status==='reservada'?'Margem alimentar: fisicamente na casa, comprometida com o destino autorizado.':'Margem alimentar: entregue; redução de consumo, sem segunda cessão.', 'Sementes: separadas e protegidas.', work, ...(s.visited.includes('C02')?[s.r.status==='livre'?'Reserva do doador: não cedida; ele decide seu uso.':s.r.status==='entregue'?'Reserva do doador: entregue; não disponível para outro destino.':s.r.status==='condicional'?'Reserva do doador: condicionada aos meios de uma saída ainda não autorizada.':'Reserva do doador: autorizada e comprometida, ainda sem entrega.']:[])];
}
