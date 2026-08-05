// 💰 Utilitário para gerar custos baseados em critérios de custo inteligentes
import type { CustoAuditavel, CriterioCusto, Turma, Aluno, Curso, ProdutoExtra } from '@/app/contexts/SMCorpContext';

interface LancamentoCusto {
  id: string;
  codigo: string;
  tipo: 'pagar';
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: 'pago' | 'pendente';
  dataPagamento?: string;
  custoAuditavelId: string;
  fornecedorId?: string;
  turmaId: string;
  alunoId?: string; // 🆕 Vincular custo ao aluno específico
  criterioId?: string;
  observacoes?: string;
}

export function gerarCustosInteligentes(
  turmas: Turma[],
  custosAuditaveis: CustoAuditavel[],
  criteriosCusto: CriterioCusto[],
  contadorInicial: number,
  alunos?: Aluno[], // 🆕 Receber lista de alunos
  cursos?: Curso[], // 🆕 Receber lista de cursos
  produtosExtras?: ProdutoExtra[] // 🆕 Receber lista de produtos
): { lancamentos: LancamentoCusto[], proximoContador: number } {
  const lancamentosGerados: LancamentoCusto[] = [];
  let contadorCodigo = contadorInicial;

  console.log('💰 [CUSTOS] Iniciando geração de custos baseados em critérios...');

  turmas.forEach((turma) => {
    // 🆕 Buscar alunos da turma
    const alunosDaTurma = alunos?.filter(a => a.turmaId === turma.id) || [];
    const qtdAlunos = alunosDaTurma.length;
    
    if (qtdAlunos === 0) {
      console.log(`⚠️ [CUSTOS] Turma ${turma.codigo} sem alunos. Pulando...`);
      return;
    }

    console.log(`\n📚 [CUSTOS] Processando turma ${turma.codigo} (${qtdAlunos} alunos)...`);
    
    // 🆕 Buscar informações do curso
    const curso = cursos?.find(c => c.id === turma.cursoId);
    console.log(`   📖 Curso: ${curso?.nome || 'N/A'} (${curso?.codigo || 'N/A'})`);

    // 🆕 NOVA LÓGICA: Processar custos baseados nos produtos dos alunos
    alunosDaTurma.forEach((aluno) => {
      console.log(`\n   👤 Processando aluno: ${aluno.codigoSistema} - ${aluno.nome}`);
      
      // 🔍 Identificar produtos do aluno (usando Set para evitar duplicatas)
      const produtosDoAlunoSet = new Set<string>();
      
      // Produtos vinculados ao curso
      if (curso?.produtosVinculados && curso.produtosVinculados.length > 0) {
        curso.produtosVinculados.forEach(id => produtosDoAlunoSet.add(id));
      }
      
      // Produtos extras do aluno
      if (aluno.produtosExtras && aluno.produtosExtras.length > 0) {
        aluno.produtosExtras.forEach(id => produtosDoAlunoSet.add(id));
      }
      
      // Se não houver produtos vinculados, tentar identificar pelo valor
      if (produtosDoAlunoSet.size === 0 && produtosExtras) {
        const produtoEncontrado = produtosExtras.find(p => p.valor === aluno.valorTotal);
        if (produtoEncontrado) {
          produtosDoAlunoSet.add(produtoEncontrado.id);
        }
      }
      
      const produtosDoAluno = Array.from(produtosDoAlunoSet);
      
      if (produtosDoAluno.length === 0) {
        console.log(`      ⚠️ Nenhum produto encontrado para o aluno ${aluno.codigoSistema}`);
        return;
      }

      console.log(`      🔍 Total de produtos do aluno: ${produtosDoAluno.length}`);
      console.log(`      🔍 IDs dos produtos: ${produtosDoAluno.join(', ')}`);
      
      // 📦 Para cada produto do aluno
      produtosDoAluno.forEach((produtoId, indexProduto) => {
        const produto = produtosExtras?.find(p => p.id === produtoId);
        if (!produto) {
          console.log(`      ⚠️ Produto ${produtoId} não encontrado`);
          return;
        }

        console.log(`      📦 PRODUTO ${indexProduto + 1}/${produtosDoAluno.length}: ${produto.codigo} - ${produto.nome} (ID: ${produto.id})`);
        console.log(`         Custos associados: ${produto.custosAssociados?.length || 0}`);
        console.log(`         IDs dos custos: ${produto.custosAssociados?.join(', ') || 'nenhum'}`);

        // 💰 Para cada custo associado ao produto (remover duplicatas)
        if (produto.custosAssociados && produto.custosAssociados.length > 0) {
          const custosUnicos = Array.from(new Set(produto.custosAssociados));
          console.log(`         🔍 Custos antes de remover duplicatas: ${produto.custosAssociados.length}`);
          console.log(`         🔍 Custos após remover duplicatas: ${custosUnicos.length}`);
          
          custosUnicos.forEach((custoId, indexCusto) => {
            const custo = custosAuditaveis.find(c => c.id === custoId);
            if (!custo) {
              console.log(`         ⚠️ Custo ${custoId} não encontrado`);
              return;
            }
            
            console.log(`         💰 CUSTO ${indexCusto + 1}/${custosUnicos.length}: ${custo.codigo} - ${custo.nome} (ID: ${custo.id})`);

            // Buscar critério de custo
            const criterio = custo.criterioCustoId 
              ? criteriosCusto.find(c => c.id === custo.criterioCustoId)
              : null;

            if (!criterio || !criterio.ativo) {
              console.log(`         ⚠️ Critério não encontrado ou inativo para "${custo.nome}"`);
              return;
            }

            console.log(`         💵 Custo: ${custo.codigo} - ${custo.nome} (R$ ${custo.valor})`);
            console.log(`            Critério: ${criterio.nome}`);
            console.log(`            Frequência: ${criterio.frequenciaLancamento}`);
            console.log(`            Vencimento: ${criterio.criterioVencimento}`);

            // 🔄 PROCESSAR CONFORME FREQUÊNCIA DE LANÇAMENTO
            if (criterio.frequenciaLancamento === 'Única vez') {
              // Gerar único lançamento para este custo
              let dataVencimento = '';

              if (criterio.criterioVencimento === 'Data Término do Curso') {
                dataVencimento = turma.dataFim || '2026-03-31';
              } else if (criterio.criterioVencimento === '30 dias após término') {
                const dataFim = new Date(turma.dataFim || Date.now());
                dataFim.setDate(dataFim.getDate() + 30);
                dataVencimento = dataFim.toISOString().split('T')[0];
              } else if (criterio.criterioVencimento === 'Fechamento Mensal') {
                const dataBase = new Date(turma.dataInicio || Date.now());
                const diaFechamento = criterio.diaFechamentoMensal || 5;
                const diasPagamento = criterio.diasPagamentoAposFechamento || 0;
                dataBase.setDate(diaFechamento);
                dataBase.setDate(dataBase.getDate() + diasPagamento);
                dataVencimento = dataBase.toISOString().split('T')[0];
              } else {
                dataVencimento = turma.dataInicio || '2026-02-01';
              }

              lancamentosGerados.push({
                id: `L${contadorCodigo}`,
                codigo: `D${String(contadorCodigo).padStart(4, '0')}`, // 🔧 Código único e sequencial por lançamento
                tipo: 'pagar',
                descricao: `${custo.nome} - ${aluno.nome} (${aluno.codigoSistema})`,
                valor: custo.valor,
                dataVencimento,
                status: 'pendente',
                custoAuditavelId: custo.id,
                fornecedorId: custo.fornecedorId,
                turmaId: turma.id,
                alunoId: aluno.id,
                criterioId: custo.criterioCustoId,
                observacoes: `📊 Turma: ${turma.codigo} | Aluno: ${aluno.codigoSistema} - ${aluno.nome} | Produto: ${produto.codigo} - ${produto.nome} | Critério: ${criterio.nome}`
              });
              contadorCodigo++;

              console.log(`            ✅ Lançamento único criado: R$ ${custo.valor.toFixed(2)} - Venc: ${dataVencimento}`);
            } else if (criterio.frequenciaLancamento === 'Diariamente') {
              // Gerar lançamentos diários baseados na duração do curso
              // 🔧 CORREÇÃO CRÍTICA: Usar apenas as datas do curso, não do aluno!
              const dataInicioStr = turma.dataInicio || new Date().toISOString().split('T')[0];
              const dataFimStr = turma.dataFim || new Date().toISOString().split('T')[0];
              
              // Criar datas sem conversão de timezone
              const dataInicio = new Date(dataInicioStr + 'T12:00:00');
              const dataFim = new Date(dataFimStr + 'T12:00:00');
              
              // Calcular diferença em dias (sem +1 para evitar dia extra)
              const diferencaMs = dataFim.getTime() - dataInicio.getTime();
              const diasCurso = Math.round(diferencaMs / (1000 * 60 * 60 * 24)) + 1;

              console.log(`            📅 CUSTO ${custo.codigo} (${custo.nome}): Gerando ${diasCurso} lançamentos diários`);
              console.log(`            📅 Data início TURMA: ${dataInicioStr} (${dataInicio.toISOString()})`);
              console.log(`            📅 Data fim TURMA: ${dataFimStr} (${dataFim.toISOString()})`);
              console.log(`            📅 Diferença em MS: ${diferencaMs}ms = ${diferencaMs / (1000 * 60 * 60 * 24)} dias`);
              console.log(`            📅 Data início: ${dataInicio.toISOString().split('T')[0]}`);
              console.log(`            📅 Data fim: ${dataFim.toISOString().split('T')[0]}`);

              // 🆕 ID do grupo para agrupar lançamentos diários no front-end
              const grupoId = `GRUPO-${custo.id}-${aluno.id}-${turma.id}`;

              let diasGerados = 0;
              let diasPulados = 0;

              for (let i = 0; i < diasCurso; i++) {
                const dataBase = new Date(dataInicio);
                dataBase.setDate(dataBase.getDate() + i);
                
                // 🔍 Formatar data para YYYY-MM-DD (mesmo formato do presencasPorDia)
                const dataString = dataBase.toISOString().split('T')[0];

                // ✅ VERIFICAR PRESENÇA DO ALUNO NESTE DIA
                const estaPresente = aluno.presencasPorDia && aluno.presencasPorDia[dataString] === true;
                
                if (!estaPresente) {
                  console.log(`            ⏭️  Dia ${i + 1}/${diasCurso} (${dataString}): Aluno AUSENTE - Lançamento NÃO gerado`);
                  diasPulados++;
                  continue; // Pula para o próximo dia sem gerar lançamento
                }

                let dataVencimento = '';
                
                if (criterio.criterioVencimento === 'Fechamento Mensal') {
                  // Todos os lançamentos diários vencem no fechamento mensal
                  const dataFechamento = new Date(dataInicio);
                  dataFechamento.setMonth(dataFechamento.getMonth() + 1);
                  const diaFechamento = criterio.diaFechamentoMensal || 5;
                  const diasPagamento = criterio.diasPagamentoAposFechamento || 0;
                  dataFechamento.setDate(diaFechamento);
                  dataFechamento.setDate(dataFechamento.getDate() + diasPagamento);
                  dataVencimento = dataFechamento.toISOString().split('T')[0];
                } else {
                  dataVencimento = dataBase.toISOString().split('T')[0];
                }

                const descricaoDia = dataBase.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                lancamentosGerados.push({
                  id: `L${contadorCodigo}`,
                  codigo: `D${String(contadorCodigo).padStart(4, '0')}`, // 🔧 Código único e sequencial por lançamento
                  tipo: 'pagar',
                  descricao: `${custo.nome} - ${aluno.nome} (${aluno.codigoSistema}) - Dia ${descricaoDia}`,
                  valor: custo.valor,
                  dataVencimento,
                  status: 'pendente',
                  custoAuditavelId: custo.id,
                  fornecedorId: custo.fornecedorId,
                  turmaId: turma.id,
                  alunoId: aluno.id,
                  criterioId: custo.criterioCustoId,
                  observacoes: `📊 Turma: ${turma.codigo} | Aluno: ${aluno.codigoSistema} - ${aluno.nome} | Produto: ${produto.codigo} - ${produto.nome} | Dia ${i + 1}/${diasCurso} - ${descricaoDia} | Critério: ${criterio.nome} | GRUPO_ID: ${grupoId} | ✅ PRESENTE`
                });
                contadorCodigo++;
                diasGerados++;
                console.log(`            ✅ Dia ${i + 1}/${diasCurso} (${dataString}): Aluno PRESENTE - Lançamento gerado (R$ ${custo.valor.toFixed(2)})`);
              }

              console.log(`            ✅ Lançamentos diários: ${diasGerados} gerados | ${diasPulados} pulados (ausência) | Total de dias: ${diasCurso}`);
            } else if (criterio.frequenciaLancamento === 'Mensalmente') {
              // Gerar lançamentos mensais (exemplo: 3 meses)
              const mesesParaGerar = 3;
              
              console.log(`            📅 Gerando ${mesesParaGerar} lançamentos mensais...`);

              for (let i = 0; i < mesesParaGerar; i++) {
                const dataBase = new Date(turma.dataInicio || Date.now());
                dataBase.setMonth(dataBase.getMonth() + i);

                let dataVencimento = '';
                const descricaoMes = dataBase.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

                if (criterio.criterioVencimento === 'Fechamento Mensal') {
                  const diaFechamento = criterio.diaFechamentoMensal || 5;
                  const diasPagamento = criterio.diasPagamentoAposFechamento || 0;
                  dataBase.setDate(diaFechamento);
                  dataBase.setDate(dataBase.getDate() + diasPagamento);
                  dataVencimento = dataBase.toISOString().split('T')[0];
                } else if (criterio.criterioVencimento === 'Data Término do Curso') {
                  dataVencimento = turma.dataFim || '2026-03-31';
                } else {
                  dataVencimento = dataBase.toISOString().split('T')[0];
                }

                lancamentosGerados.push({
                  id: `L${contadorCodigo}`,
                  codigo: `D${String(contadorCodigo).padStart(4, '0')}`, // 🔧 Código único e sequencial por lançamento
                  tipo: 'pagar',
                  descricao: `${custo.nome} - ${aluno.nome} (${aluno.codigoSistema}) - ${descricaoMes}`,
                  valor: custo.valor,
                  dataVencimento,
                  status: i === 0 ? 'pago' : 'pendente',
                  dataPagamento: i === 0 ? turma.dataInicio : undefined,
                  custoAuditavelId: custo.id,
                  fornecedorId: custo.fornecedorId,
                  turmaId: turma.id,
                  alunoId: aluno.id,
                  criterioId: custo.criterioCustoId,
                  observacoes: `📊 Turma: ${turma.codigo} | Aluno: ${aluno.codigoSistema} - ${aluno.nome} | Produto: ${produto.codigo} - ${produto.nome} | Mês ${i + 1}/${mesesParaGerar} | Critério: ${criterio.nome}`
                });
                contadorCodigo++;
              }

              console.log(`            ✅ ${mesesParaGerar} lançamentos mensais criados`);
            }
          });
        } else {
          console.log(`         ⚠️ Produto sem custos associados`);
        }
      });
    });
  });

  console.log(`\n💰 [CUSTOS] Total de custos gerados: ${lancamentosGerados.length}`);

  return {
    lancamentos: lancamentosGerados,
    proximoContador: contadorCodigo
  };
}