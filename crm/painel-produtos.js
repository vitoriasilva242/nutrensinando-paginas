/* ---------- PRODUTO (cadastro e campos do site) ---------- */
function formProduto(pid){
var p=(pid&&D.pMap[pid])||{};var novo=!pid;
var marcado=function(v){return /^s/i.test(v||'')?' checked':''};
var preco=(p.preco!==''&&p.preco!=null)?String(p.preco).replace('.',','):'';
abrirModal('<h2>'+(novo?'Novo produto':'Editar produto')+'<button class="fechar" onclick="fecharModal()">×</button></h2><div class="grade">'+
campo('Nome','<input id="pr_nome" value="'+esc(p.nome)+'">','inteiro',true)+
campo('Tipo','<select id="pr_tipo">'+opcoes(D.listas.tipos,p.tipo||'Curso')+'</select>')+campo('Formato','<select id="pr_formato">'+opcoes(D.listas.formatos,p.formato,'—')+'</select>')+
campo('Status','<select id="pr_status">'+opcoes(D.listas.statusProduto,p.status||'Planejado')+'</select>')+campo('Data (início/realização)','<input type="date" id="pr_data" value="'+esc(p.data)+'">')+
campo('Horário','<input id="pr_hora" value="'+esc(p.horario)+'" placeholder="Ex.: 9h às 18h">')+campo('Local','<input id="pr_local" value="'+esc(p.local)+'" placeholder="Online ou endereço">')+
campo('Preço (R$)','<input id="pr_preco" inputmode="decimal" value="'+esc(preco)+'" placeholder="197,00">')+campo('Vagas','<input id="pr_vagas" inputmode="numeric" value="'+esc(p.capacidade)+'" placeholder="Vazio = sem limite">')+
campo('Carga horária (h)','<input id="pr_carga" inputmode="decimal" value="'+esc(p.cargaHoraria)+'">')+campo('Plataforma de venda','<select id="pr_plat">'+opcoes(D.listas.plataformas,p.plataforma,'—')+'</select>')+
campo('Link de inscrição / compra','<input id="pr_link" value="'+esc(p.linkInscricao)+'" placeholder="Link do evento no Sympla ou do curso na Hotmart">','inteiro')+
campo('Código na plataforma (opcional)','<input id="pr_cod" value="'+esc(p.codigoPlataforma)+'"><div class="sub" style="margin-top:4px">Sympla: o número no fim do link do evento (o CRM já pega sozinho do link). Hotmart: o ID do produto, se o nome lá for diferente do nome aqui. É o que faz as compras caírem sozinhas neste produto.</div>','inteiro')+
'<div class="inteiro" style="padding:12px;background:var(--roxoC);border-radius:10px"><label style="text-transform:none;font-size:13px;display:flex;gap:8px;align-items:center;color:#2b2233"><input type="checkbox" id="pr_site" style="width:auto"'+marcado(p.site)+'> 🌐 Mostrar no site e no robô</label><div class="grade" style="margin-top:10px">'+
campo('Descrição curta','<textarea id="pr_desc" rows="2" placeholder="Uma frase que explica o curso ou evento">'+esc(p.descricao)+'</textarea>','inteiro')+
campo('Professora','<select id="pr_prof">'+opcoes(['Luana','Taiane','as duas'],p.professora,'—')+'</select>')+campo('Certificado','<select id="pr_cert">'+opcoes(D.listas.simnao,p.certificado||'Sim')+'</select>')+
campo('Para quem é','<input id="pr_para" value="'+esc(p.paraQuem)+'" placeholder="Ex.: estudantes a partir do 5º período">','inteiro')+
campo('O que vai aprender (um por linha)','<textarea id="pr_top" rows="3">'+esc(p.topicos)+'</textarea>','inteiro')+
campo('Foto de capa (link, opcional)','<input id="pr_img" value="'+esc(p.imagem)+'">')+'<div><label>&nbsp;</label><label style="text-transform:none;font-size:13px;display:flex;gap:8px;align-items:center;color:#2b2233"><input type="checkbox" id="pr_dest" style="width:auto"'+marcado(p.destaque)+'> ★ Destaque no site</label></div>'+
'</div><div class="sub" style="margin-top:8px">No site: <b>Planejado</b> aparece como “em breve”; <b>Inscrições abertas</b> mostra o botão de inscrição; com as vagas cheias aparece “esgotado”; <b>Encerrado</b> sai do site. Eventos somem sozinhos depois da data. O site atualiza em até 5 minutos.</div></div>'+
'</div><div class="rodape"><button class="btn" onclick="fecharModal()">Cancelar</button><button class="btn verde" id="b_salvar" onclick="salvarProduto(\''+(pid||'')+'\')">Salvar produto</button></div>',true);
setTimeout(function(){if(novo)$('pr_nome').focus()},50);
}
function salvarProduto(pid){
var f={id:pid,nome:val('pr_nome'),tipo:val('pr_tipo'),formato:val('pr_formato'),status:val('pr_status'),data:val('pr_data'),horario:val('pr_hora'),local:val('pr_local'),preco:val('pr_preco'),capacidade:val('pr_vagas'),cargaHoraria:val('pr_carga'),plataforma:val('pr_plat'),linkInscricao:val('pr_link'),codigoPlataforma:val('pr_cod'),site:val('pr_site'),descricao:val('pr_desc'),professora:val('pr_prof'),certificado:val('pr_cert'),paraQuem:val('pr_para'),topicos:val('pr_top'),imagem:val('pr_img'),destaque:val('pr_dest')};
if(!f.nome)return toast('Preencha o nome');
if(f.site&&f.status==='Inscrições abertas'&&!f.linkInscricao)return toast('Para abrir inscrições no site, cole o link de inscrição/compra');
enviar('painelSalvarProduto',f,pid?'Produto atualizado!':'Produto criado!');
}
/* ---------- INTEGRAÇÕES (⚙️ Configurações) ---------- */
function carregarIntegracoes(){google.script.run.withSuccessHandler(function(s){var el=$('cfg-integ');if(!el)return;
var ok=function(t){return '<span class="pill" style="background:var(--verdeC);color:var(--verdeE)">'+t+'</span>'};
el.innerHTML='<h3 style="margin:18px 0 0;color:var(--roxo);font-size:14px">🔗 Site e plataformas de venda</h3>'+
(s.colunasSite?'':cfgInteg('🌐 Preparar produtos para o site','Cria os campos do site nos produtos e a aba Integrações. Rode uma vez.','site'))+
'<div style="padding:12px 0;border-bottom:1px solid #eee"><b>🎟️ Sympla</b> '+(s.symplaLigado?ok('ligado'):'<span class="pill">desligado</span>')+'<div class="sub">As inscrições do Sympla entram sozinhas no CRM (ele confere de hora em hora).'+(s.symplaUltima?' Última conferência: '+esc(s.symplaUltima)+'.':'')+'</div>'+
'<div style="display:flex;gap:6px;margin-top:8px"><input id="cfg-token" type="password" autocomplete="off" placeholder="'+(s.temTokenSympla?'Token salvo ✔ (cole outro para trocar)':'Cole aqui o token da API do Sympla')+'"><button class="btn" onclick="rodarIntegracao(\'tokenSympla\',$(\'cfg-token\').value)">Salvar token</button></div>'+
'<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">'+(s.symplaLigado?'<button class="btn" onclick="rodarIntegracao(\'symplaOff\')">Desligar</button>':'<button class="btn verde" onclick="rodarIntegracao(\'symplaOn\')">Ligar</button>')+'<button class="btn" onclick="rodarIntegracao(\'symplaAgora\')">Conferir agora</button></div></div>'+
'<div style="padding:12px 0"><b>🔥 Hotmart</b> '+(s.hotmartLigado?ok('pronta para receber'):'<span class="pill">falta configurar</span>')+'<div class="sub">As compras da Hotmart chegam pelo site assim que a Hotmart avisa. Tudo o que entra fica anotado na aba “Integrações” da planilha.</div></div>';
}).withFailureHandler(function(e){var el=$('cfg-integ');if(el)el.innerHTML='<div class="sub">Não deu para ler as integrações: '+esc(e&&e.message||e)+'</div>'}).painelIntegracao('status')}
function cfgInteg(t,d,a){return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #eee"><div><b>'+t+'</b><div class="sub">'+d+'</div></div><button class="btn verde" onclick="rodarIntegracao(\''+a+'\')">Executar</button></div>'}
function rodarIntegracao(a,v){toast('Um momento…');google.script.run.withSuccessHandler(function(msg){if(a==='symplaAgora'||a==='site'){fecharModal();carregar(msg)}else{toast(msg);carregarIntegracoes()}}).withFailureHandler(erro).painelIntegracao(a,v||'')}
