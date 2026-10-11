// Presentation only: no commands or changes to game state.
export function panels(locale='pt') {
  const en=locale==='en',prefix=en?'../':'';
  const rows=en?[
    ['The land your family farms', ['Níkanor — you, a young farmer.','The rain has not come. Your family farms this land. You’ll travel with a group to Delphi to seek Apollo’s guidance.','Níkanor, thinking: “We need this harvest.”'], 'Níkanor stands beside the fields his family farms, with scattered vegetation and mountains beyond.'],
    ['Those who stay at home', ['Tália — your younger sister: “Who’ll fetch water while you’re away?”','Myrrine — your mother: “We’ll work that out. You won’t have to do the adults’ work.”','Fílon — your father: “Bring the seeds closer, son.”'], 'At home, Níkanor brings a container closer to his seated father, Fílon. His mother, Myrrine, talks with his younger sister, Tália.'],
    ['A familiar neighbor', ['Myrrine: “Dóris, how are you?”','Dóris — your neighbor: “I helped here when there was work. Now I need food before I can work.”','Níkanor: “I remember.”'], 'Dóris talks with Níkanor and Myrrine at the doorway. Her repaired basket rests on the ground; no food is being handed over.'],
    ['Help has a cost at home', ['Dóris: “Could you spare some food?”','Myrrine: “If we give food, we’ll eat less. We can’t spare another portion later.”','Fílon: “The seeds are for planting.”','What can you offer—and what must you keep?'], 'Níkanor, Myrrine, and Dóris face one another outside the house. Tália stands to the left, and Fílon sits to the right with seeds. A basket rests on the ground. No food is being handed over.']
  ]:[
    ['A terra que sustenta a casa', ['Níkanor — você, um jovem agricultor.','A chuva ainda não veio. Sua família cultiva esta terra. Você viajará com uma delegação a Delfos para buscar a orientação de Apolo.','Níkanor, pensamento: “Precisamos desta colheita.”'], 'Níkanor está junto aos campos que sua família cultiva, com vegetação dispersa e montanhas ao fundo.'],
    ['Quem fica em casa', ['Tália — sua irmã mais nova: “Quem vai buscar água enquanto você estiver fora?”','Myrrine — sua mãe: “Vamos combinar isso. Você não vai ter de fazer o trabalho dos adultos.”','Fílon — seu pai: “Aproxime as sementes, filho.”'], 'Em casa, Níkanor aproxima um recipiente de seu pai, Fílon, que está sentado. Sua mãe, Myrrine, conversa com sua irmã mais nova, Tália.'],
    ['Uma vizinha conhecida', ['Myrrine: “Dóris, como você está?”','Dóris — sua vizinha: “Ajudei aqui quando havia trabalho. Agora preciso de alimento antes de poder trabalhar.”','Níkanor: “Eu me lembro.”'], 'Dóris conversa com Níkanor e Myrrine no limiar. Seu cesto reparado está no chão; nenhum alimento está sendo entregue.'],
    ['A ajuda também tem um custo em casa', ['Dóris: “Vocês poderiam ceder um pouco de alimento?”','Myrrine: “Se dermos alimento, vamos comer menos. Não teremos outra porção disponível para dar depois.”','Fílon: “As sementes são para plantar.”','O que você pode oferecer — e o que precisa guardar?'], 'Níkanor, Myrrine e Dóris conversam diante da casa. Tália está à esquerda, e Fílon, sentado à direita, manuseia sementes. Um cesto permanece no chão. Nenhum alimento está sendo entregue.']
  ];
  const files=['introducao/introducao-01-terra-v0.1.png','introducao/introducao-02-familia-v0.4.png','introducao/introducao-03-doris-v0.4.png','cenas/cena-01-terra-v0.1.png'];
  return rows.map(([title,text,alt],i)=>({title,text,alt,src:prefix+'assets/images/'+files[i],width:i===3?1673:1672,height:i===3?940:941}));
}
export function introducedPage(state,page,locale='pt') {
  const en=locale==='en',info=[...(page.info||[])];
  let paragraphs=page.paragraphs;
  if(state.node==='AB'&&!en) return {...page,paragraphs:['A chuva ainda não veio. O alimento está diminuindo.','Você é Níkanor, um jovem agricultor. Viajará a Delfos para buscar a orientação de Apolo. Enquanto isso, sua família e seus vizinhos precisam de ajuda.','O que você pode oferecer — e o que precisa guardar?']};
  if(state.node==='C01') {
    info.push([en?'Family and neighbor':'Família e vizinha',en?'Myrrine is your mother, Fílon your father, and Tália your younger sister. Dóris has helped the family when there was work.':'Myrrine é sua mãe, Fílon seu pai, e Tália sua irmã mais nova. Dóris ajudou a família quando havia trabalho.']);
    if(!en)info.push(['Quem cuidará das tarefas da casa?',page.paragraphs.slice(5,7).join(' ')],['Nuvens, acolhimento e Zeus',page.paragraphs.slice(7,9).join(' ')]);
    paragraphs=en?[
      'Dóris, your neighbor, needs food before she can work. Your parents must agree before you give away the family’s food. The seeds are kept for planting.',
      'Myrrine — your mother: “Zeus, watch over our home and what we need to keep.”',
      'Dóris: “Tell the city’s representative I need food. Don’t say I agree to every plan made in my name.”'
    ]:[
      'Dóris, sua vizinha, precisa de alimento antes de poder trabalhar. Seus pais precisam concordar antes de você doar o alimento da família. As sementes ficam guardadas para o plantio.',
      'Myrrine — sua mãe: “Zeus, guarda esta casa e o que precisamos conservar.”',
      'Dóris: “Conte ao representante da cidade que preciso de alimento. Só não diga que concordo com toda proposta feita em meu nome.”'
    ];
  }
  if(state.node==='C02')paragraphs=[en?'Timôn leads the gathering for Zeus. He needs food and help to prepare it.':'Timôn conduz o encontro a Zeus. Ele precisa de alimento e ajuda no preparo.',...paragraphs.map((p,i)=>i===1?(en?'Timôn: “We honor Zeus and ask for rain. I can’t promise rain. What food and work can you give?”':'Timôn: “Honramos Zeus e pedimos chuva. Não posso prometer chuva. Com que alimento e trabalho podemos contar?”'):p)];
  if(state.node==='C02.meal')paragraphs=paragraphs.flatMap(p=>p.startsWith('Lísias:')?[en?'Lísias represents the city and leads the group going to Delphi.':'Lísias representa a cidade e conduz a delegação que vai a Delfos.',en?'Lísias: “We’ll tell them what our families are facing.”':'Lísias: “Vamos contar a eles o que nossas famílias estão enfrentando.”']:p);
  if(state.node==='C03')paragraphs=[en?'You’re helping Lísias. He represents the city. You can tell him what your family and neighbors need.':'Você está ajudando Lísias. Ele representa a cidade. Você pode contar a ele do que sua família e seus vizinhos precisam.',en?'Lísias conducts the consultation. You cannot make commitments for the city.':'Lísias conduz a consulta. Você não pode assumir compromissos pela cidade.',...paragraphs];
  return {...page,paragraphs,...(info.length?{info}:{})};
}
