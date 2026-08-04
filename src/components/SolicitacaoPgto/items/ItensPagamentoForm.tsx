/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AccountBalanceOutlined,
  AddOutlined,
  ClearAll,
  DeleteOutline,
  LinkOutlined,
  SearchOutlined,
  StorefrontOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
} from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useContratoContext } from "../../Contratos/hooks/useContratoContext";
import {
  ITItmmov,
  //ITItmmovData
} from "../@types/SolicitacaoPagamentoType";
import fluigConfig from "../../../config";
import useSolicitacaoPagamentoContext from "../useSolicitacaoPagamentoContext";
import InvoiceItemsModalSelect from "./InvoiceItemModalSelect";
import ItensModalSelect from "./ItemModalSelect";
import useItensPagamento from "./useItensPagamento";
import { IFornecedorSelecionado } from "../../Fornecedores/FornecedoresContext";
import { useFornecedorContext } from "../../Fornecedores/useFornecedorContext";
import useFornecedores from "../../Fornecedores/useFornecedores";
import FornecedorModalSelect from "../../Fornecedores/FornecedorModalSelect";
import sanitizeCnpjCpf from "../../../utils/formatCnpjCpf";
import { ICentroCustoSelecionado } from "../../CentroCusto/CentroCustoContext";
import { useCentroCustoContext } from "../../CentroCusto/useCentroCustoContext";
import useCentroCusto from "../../CentroCusto/useCentroCusto";
import { CentroCustoModalSelect } from "../../CentroCusto/CentroCustoModalSelect";

type IEmissorItem = {
  CODCFO: string;
  DESCRICAO_CODCFO: string;
  CGCCFO: string;
  CODCOLCFO: string;
};

const EMISSOR_ITEM_VAZIO: IEmissorItem = {
  CODCFO: "",
  DESCRICAO_CODCFO: "",
  CGCCFO: "",
  CODCOLCFO: "",
};

type ICentroCustoItem = {
  CODCCUSTO: string;
  DESCRICAO_CODCCUSTO: string;
};

const CENTRO_CUSTO_ITEM_VAZIO: ICentroCustoItem = {
  CODCCUSTO: "",
  DESCRICAO_CODCCUSTO: "",
};

export default function ItensPagamentoForm({ readOnly = false }: { readOnly?: boolean }) {
  const { contrato, setContrato, listRateio } = useContratoContext();
  const {
    isLoading,
    handleSearchItemClick,
    handleClearItemClick,
    handleSearchInvoiceItemClick,
  } = useItensPagamento();
  const {
    listItems,
    itemSelecionado,
    setItemSelecionado,
    setListItems,
    solicitacaoPagamento,
    setSolicitacaoPagamento,
  } = useSolicitacaoPagamentoContext();
  const { setOnSelectFornecedor } = useFornecedorContext();
  const { isLoading: isLoadingEmissor, buscarFornecedores } = useFornecedores();
  const { setOnSelectCentroCusto } = useCentroCustoContext();
  const { isLoading: isLoadingCentroCusto, buscarCentroCustos } = useCentroCusto();
  const [data, setData] = useState<ITItmmov[]>([]);
  const [valorAux, setValorAux] = useState<string>("");
  const [emissorNovoItem, setEmissorNovoItem] = useState<IEmissorItem>(
    EMISSOR_ITEM_VAZIO,
  );
  const [centroCustoNovoItem, setCentroCustoNovoItem] = useState<ICentroCustoItem>(
    CENTRO_CUSTO_ITEM_VAZIO,
  );

  function handleSearchEmissorNovoItemClick() {
    setOnSelectFornecedor((row: IFornecedorSelecionado) => {
      setEmissorNovoItem({
        CODCFO: row.CODCFO ?? "",
        DESCRICAO_CODCFO: row.NOMEFANTASIA ?? "",
        CGCCFO: row.CGCCFO ?? "",
        // O dataset de fornecedores (DW.CNT.0004) não retorna a coligada do CFO;
        // assume-se a mesma coligada do contrato/emissor.
        CODCOLCFO: row.CODCOLIGADA ?? contrato.TMOV_T_CODCOLIGADA ?? "",
      });
    });
    void buscarFornecedores({
      codCfo: emissorNovoItem.CODCFO,
      nomeFantasia: emissorNovoItem.DESCRICAO_CODCFO,
      cnpj: emissorNovoItem.CGCCFO,
    });
  }

  function handleClearEmissorNovoItemClick() {
    setEmissorNovoItem(EMISSOR_ITEM_VAZIO);
  }

  function handleAlterarEmissorItemClick(seqf: string) {
    setOnSelectFornecedor((row: IFornecedorSelecionado) => {
      setListItems(
        listItems.map((it) =>
          it.TITMMOV_T_SEQF === seqf
            ? {
                ...it,
                TITMMOV_T_CODCFO: row.CODCFO ?? it.TITMMOV_T_CODCFO,
                TITMMOV_T_DESCRICAO_CODCFO: row.NOMEFANTASIA ?? it.TITMMOV_T_DESCRICAO_CODCFO,
                TITMMOV_T_CGCCFO: row.CGCCFO ?? it.TITMMOV_T_CGCCFO,
                TITMMOV_T_CODCOLCFO:
                  row.CODCOLIGADA ?? contrato.TMOV_T_CODCOLIGADA ?? it.TITMMOV_T_CODCOLCFO,
              }
            : it,
        ),
      );
    });
    void buscarFornecedores({});
  }

  function aplicarCentroCustoNoContrato(row: ICentroCustoSelecionado) {
    setContrato({
      ...contrato,
      TMOV_T_CODCCUSTO: row.CODCCUSTO ?? contrato.TMOV_T_CODCCUSTO,
      DESCRICAO_CODCCUSTO: row.NOME ?? contrato.DESCRICAO_CODCCUSTO,
    });
  }

  function handleSearchCentroCustoNovoItemClick() {
    setOnSelectCentroCusto((row: ICentroCustoSelecionado) => {
      setCentroCustoNovoItem({
        CODCCUSTO: row.CODCCUSTO ?? "",
        DESCRICAO_CODCCUSTO: row.NOME ?? "",
      });
      aplicarCentroCustoNoContrato(row);
    });
    void buscarCentroCustos({
      codCcusto: centroCustoNovoItem.CODCCUSTO,
      nome: centroCustoNovoItem.DESCRICAO_CODCCUSTO,
    });
  }

  function handleClearCentroCustoNovoItemClick() {
    setCentroCustoNovoItem(CENTRO_CUSTO_ITEM_VAZIO);
  }

  function handleAlterarCentroCustoItemClick(seqf: string) {
    setOnSelectCentroCusto((row: ICentroCustoSelecionado) => {
      setListItems(
        listItems.map((it) =>
          it.TITMMOV_T_SEQF === seqf
            ? {
                ...it,
                TITMMOV_T_CODCCUSTO: row.CODCCUSTO ?? it.TITMMOV_T_CODCCUSTO,
                TITMMOV_T_DESCRICAO_CODCCUSTO: row.NOME ?? it.TITMMOV_T_DESCRICAO_CODCCUSTO,
              }
            : it,
        ),
      );
      aplicarCentroCustoNoContrato(row);
    });
    void buscarCentroCustos({});
  }

  useEffect(() => {
    try {
      // Example: get itensString from window.location.search or another source
      const searchParams = new URLSearchParams(window.location.search);
      const itensString = searchParams.get("itens") || "[]";
      const itensRecebidos = JSON.parse(decodeURIComponent(itensString));

      // Sem itens na URL não há nada a importar; não mexe na lista já existente.
      if (!Array.isArray(itensRecebidos) || itensRecebidos.length === 0) return;

      const itensAdaptados: ITItmmov[] = itensRecebidos.map(
        (item: any, idx: number) => ({
          TITMMOV_T_SEQF: (idx + 1).toString(),
          TITMMOV_T_CODIGOPRD: item.codigo,
          TITMMOV_T_NOMEFANTASIA: item.nome,
          TITMMOV_T_CODUND: item.codUni || "",
          TITMMOV_T_IDPRD: item.idPrd,
          TITMMOV_T_CODTBORCAMENTO: contrato.TMOV_T_CODTBORCAMENTO,
          TITMMOV_T_DESCTBORCAMENTO: item.natureza,
          TITMMOV_T_PRECOUNITARIO: item.valor,
          TITMMOV_T_QUANTIDADE: item.quantidade || "1",
          TITMMOV_T_VALORTOTALITEM: item.valor,
        }),
      );
      setListItems(itensAdaptados);
    } catch (e) {
      console.log("❌ Erro ao processar itens recebidos via URL:", e);
    }
    // Roda só na montagem: os itens vêm da URL de entrada, não devem reagir a mudanças no contrato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setData(
      listItems.map((item, idx) => {
        return { ...item, id: idx };
      }),
    );
    return () => {
      setData([]);
    };
  }, [listItems]);

  const findLastPayment = useCallback(async () => {
    if (!contrato.IDFLUIG) {
      console.warn("[findLastPayment] IDFLUIG não encontrado no contrato.");
      return;
    }

    try {
      console.log(`[findLastPayment] Buscando histórico ou dados originais para IDFLUIG: ${contrato.IDFLUIG}`);

      // 1. Busca histórico de pagamentos (ML001090 e ML001091)
      // Fornecedor fica no cabeçalho (ML001090), igual ao padrão de ML001134/ML001144.
      const responsePagamento = await axios.post(fluigConfig.datasetUrl, {
        name: "ds_dw_sql",
        fields: [
          `SELECT TOP 1
            ml91.*,
            ml90.TMOV_T_CODCFO AS TITMMOV_T_CODCFO,
            ml90.DESCRICAO_CODCFO AS TITMMOV_T_DESCRICAO_CODCFO,
            ml90.TMOV_T_CGCCFO AS TITMMOV_T_CGCCFO,
            ml90.TMOV_T_CODCOLCFO AS TITMMOV_T_CODCOLCFO
         FROM ML001090 ml90
         JOIN ML001091 ml91 ON ml90.documentid = ml91.documentid
         WHERE ml90.TCNT_T_IDCONTRATO = '${contrato.IDFLUIG}'
         ORDER BY ml90.documentid DESC`,
          `java:/jdbc/AppDS`,
        ],
      });

      const erroPagamento = responsePagamento.data.content.values?.[0]?.ERRO;
      if (erroPagamento) {
        console.error("[findLastPayment] Erro na consulta de histórico de pagamento:", erroPagamento);
      }

      const valoresPagamento = erroPagamento || !responsePagamento.data.content.values
        ? []
        : Array.isArray(responsePagamento.data.content.values)
          ? responsePagamento.data.content.values
          : [responsePagamento.data.content.values];

      // 2. Se NÃO houver pagamento anterior, busca os itens ORIGINAIS do contrato
      if (valoresPagamento.length === 0) {
        console.info("[findLastPayment] Sem pagamentos anteriores. Buscando dados nas tabelas ML001134/ML001144/ML001143.");

        // Cada item vira um processo/documentid próprio (1 solicitação por linha de item).
        // Para reunir todos os itens do MESMO contrato lógico, agrupamos por TF_T_CODCONTRATO
        // (o código digitado no contrato, que é igual em todas as solicitações-irmãs) em vez
        // de filtrar só pelo processNumber da solicitação que foi aberta.
        const codContrato = contrato.TF_T_CODCONTRATO;
        const whereClause = codContrato
          ? `ml34.TF_T_CODCONTRATO = '${codContrato}'`
          : `ml34.processNumber = '${contrato.IDFLUIG}'`;

        const responseContrato = await axios.post(fluigConfig.datasetUrl, {
          name: "ds_dw_sql",
          fields: [
            `SELECT
              ml44.TITMMOV_T_IDPRD,
              ml44.TITMMOV_T_CODIGOPRD,
              ml44.TITMMOV_T_NOMEFANTASIA,
              ml44.TITMMOV_T_CODUND,
              ml44.TITMMOV_T_QUANTIDADE,
              ml44.TITMMOV_T_PRECOUNITARIO,
              ml44.TITMMOV_T_VALORTOTALITEM,
              ml34.TMOV_T_CODCCUSTO,
              ml34.DESCRICAO_CODCCUSTO,
              ml34.TMOV_T_CODCFO,
              ml34.DESCRICAO_CODCFO,
              ml34.TMOV_T_CGCCFO,
              ml34.TMOV_T_CODCOLCFO,
              ml43.TMOV_T_CODTBORCAMENTO,
              ml43.TMOV_T_TBORCAMENTO
           FROM ML001134 ml34
           INNER JOIN ML001144 ml44 ON ml34.documentid = ml44.documentid
           LEFT JOIN ML001143 ml43 ON ml34.documentid = ml43.documentid
           WHERE ${whereClause}`,
            `java:/jdbc/AppDS`,
          ],
        });

        const erroContrato = responseContrato.data.content.values?.[0]?.ERRO;
        if (erroContrato) {
          console.error("[findLastPayment] Erro na consulta de itens originais:", erroContrato);
          return;
        }

        const itensOriginais = Array.isArray(responseContrato.data.content.values)
          ? responseContrato.data.content.values
          : responseContrato.data.content.values ? [responseContrato.data.content.values] : [];

        if (itensOriginais.length > 0) {
          const mappedItens = itensOriginais.map((item: any, idx: number) => ({
            TITMMOV_T_SEQF: String(idx + 1),
            TITMMOV_T_CODIGOPRD: item.TITMMOV_T_CODIGOPRD,
            TITMMOV_T_NOMEFANTASIA: item.TITMMOV_T_NOMEFANTASIA,
            TITMMOV_T_CODUND: item.TITMMOV_T_CODUND,
            TITMMOV_T_IDPRD: item.TITMMOV_T_IDPRD || "",
            TITMMOV_T_CODTBORCAMENTO: item.TMOV_T_CODTBORCAMENTO || contrato.TMOV_T_CODTBORCAMENTO,
            TITMMOV_T_DESCTBORCAMENTO: item.TMOV_T_TBORCAMENTO || contrato.TMOV_T_TBORCAMENTO,
            TITMMOV_T_QUANTIDADE: item.TITMMOV_T_QUANTIDADE,
            TITMMOV_T_PRECOUNITARIO: item.TITMMOV_T_PRECOUNITARIO,
            TITMMOV_T_VALORTOTALITEM: item.TITMMOV_T_VALORTOTALITEM,
            TITMMOV_T_CODCCUSTO: item.TMOV_T_CODCCUSTO || "",
            TITMMOV_T_DESCRICAO_CODCCUSTO: item.DESCRICAO_CODCCUSTO || "",
            TITMMOV_T_CODCFO: item.TMOV_T_CODCFO || "",
            TITMMOV_T_DESCRICAO_CODCFO: item.DESCRICAO_CODCFO || "",
            TITMMOV_T_CGCCFO: item.TMOV_T_CGCCFO || "",
            TITMMOV_T_CODCOLCFO: item.TMOV_T_CODCOLCFO || "",
          }));

          console.log("[findLastPayment] Itens originais carregados com sucesso:", mappedItens);
          setListItems(mappedItens);
          return;
        }
        return;
      }

      // 3. Se houver histórico de pagamento, usa o último como base
      const ultimo = valoresPagamento[0];
      const precoUnitario = parseFloat(ultimo.TITMMOV_T_PRECOUNITARIO) || 0;
      const quantidade = parseFloat(ultimo.TITMMOV_T_QUANTIDADE) || 0;
      const itemInserir: ITItmmov = {
        TITMMOV_T_SEQF: (listItems.length + 1).toString(),
        TITMMOV_T_CODIGOPRD: ultimo.TITMMOV_T_CODIGOPRD,
        TITMMOV_T_NOMEFANTASIA: ultimo.TITMMOV_T_NOMEFANTASIA,
        TITMMOV_T_CODUND: ultimo.TITMMOV_T_CODUND,
        TITMMOV_T_IDPRD: ultimo.TITMMOV_T_IDPRD,
        TITMMOV_T_CODTBORCAMENTO: ultimo.TITMMOV_T_CODTBORCAMENTO || contrato.TMOV_T_CODTBORCAMENTO,
        TITMMOV_T_DESCTBORCAMENTO: ultimo.TITMMOV_T_DESCTBORCAMENTO || contrato.TMOV_T_TBORCAMENTO,
        TITMMOV_T_PRECOUNITARIO: ultimo.TITMMOV_T_PRECOUNITARIO,
        TITMMOV_T_QUANTIDADE: ultimo.TITMMOV_T_QUANTIDADE,
        TITMMOV_T_CODCFO: ultimo.TITMMOV_T_CODCFO || contrato.TMOV_T_CODCFO || "",
        TITMMOV_T_DESCRICAO_CODCFO: ultimo.TITMMOV_T_DESCRICAO_CODCFO || contrato.DESCRICAO_CODCFO || "",
        TITMMOV_T_CGCCFO: ultimo.TITMMOV_T_CGCCFO || contrato.TMOV_T_CGCCFO || "",
        TITMMOV_T_CODCOLCFO: ultimo.TITMMOV_T_CODCOLCFO || contrato.TMOV_T_CODCOLIGADA || "",
        TITMMOV_T_CODCCUSTO: ultimo.TITMMOV_T_CODCCUSTO || contrato.TMOV_T_CODCCUSTO || "",
        TITMMOV_T_DESCRICAO_CODCCUSTO: ultimo.TITMMOV_T_DESCRICAO_CODCCUSTO || contrato.DESCRICAO_CODCCUSTO || "",
        TITMMOV_T_VALORTOTALITEM: (precoUnitario * quantidade).toFixed(2),
      };

      console.log("[findLastPayment] Inserindo item baseado no último pagamento.");
      setListItems([...listItems, itemInserir]);

    } catch (e) {
      console.error("[findLastPayment] Erro crítico: ", e);
    }
  }, [
    contrato.IDFLUIG,
    contrato.TF_T_CODCONTRATO,
    contrato.TMOV_T_CODTBORCAMENTO,
    contrato.TMOV_T_TBORCAMENTO,
    contrato.TF_T_VALORCONTRATO,
    listItems,
    setListItems,
  ]);

  useEffect(() => {
    if (contrato.IDFLUIG && listItems.length === 0) {
      void findLastPayment();
    }
  }, [contrato.IDFLUIG, listItems.length, findLastPayment]);

  const columnsItens: GridColDef[] = [
    { field: "TITMMOV_T_SEQF", headerName: "#", width: 50 },
    { field: "TITMMOV_T_CODIGOPRD", headerName: "Cód. Item", width: 100 },
    { field: "TITMMOV_T_NOMEFANTASIA", headerName: "Item", width: 200 },
    { field: "TITMMOV_T_CODUND", headerName: "Cód. Und.", width: 100 },
    {
      field: "TITMMOV_T_DESCTBORCAMENTO",
      headerName: "Nat. Orçamentária",
      width: 150,
    },
    { field: "TITMMOV_T_QUANTIDADE", headerName: "Qtde.", width: 100 },
    { field: "TITMMOV_T_PRECOUNITARIO", headerName: "R$ Unit.", width: 100 },
    { field: "TITMMOV_T_VALORTOTALITEM", headerName: "R$ Total", width: 100 },
    {
      field: "TITMMOV_T_DESCRICAO_CODCFO",
      headerName: "Fornecedor",
      width: 180,
    },
    { field: "TITMMOV_T_CGCCFO", headerName: "Cnpj/Cpf Fornecedor", width: 150 },
    {
      field: "TITMMOV_T_DESCRICAO_CODCCUSTO",
      headerName: "Centro de Custo",
      width: 180,
    },
    {
      field: "",
      headerName: "...",
      type: "actions",
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<StorefrontOutlined />}
          label="Alterar emissor"
          onClick={() =>
            handleAlterarEmissorItemClick(params.row.TITMMOV_T_SEQF)
          }
        />,
        <GridActionsCellItem
          icon={<AccountBalanceOutlined />}
          label="Alterar centro de custo"
          onClick={() =>
            handleAlterarCentroCustoItemClick(params.row.TITMMOV_T_SEQF)
          }
        />,
        <GridActionsCellItem
          icon={<DeleteOutline color="error" />}
          label="Excluir Item"
          onClick={() => {
            setListItems(
              listItems.filter(
                (e) => e.TITMMOV_T_SEQF !== params.row.TITMMOV_T_SEQF,
              ),
            );
          }}
        />,
      ],
    },
  ];
  function handleAddItemSolicitacao() {
    const codNatProduto = itemSelecionado.CODTBORCAMENTO;
    const natDoRateio = listRateio.find(
      (r) => r.CODTBORCAMENTO === codNatProduto,
    );

    const itemInserir: ITItmmov = {
      TITMMOV_T_SEQF: (listItems.length + 1).toString(),
      TITMMOV_T_CODIGOPRD: itemSelecionado.CODIGOPRD,
      TITMMOV_T_NOMEFANTASIA: itemSelecionado.NOMEFANTASIA,
      TITMMOV_T_CODUND: itemSelecionado.CODUND,
      TITMMOV_T_IDPRD: itemSelecionado.IDPRD?.toString(),
      TITMMOV_T_CODTBORCAMENTO:
        codNatProduto ||
        natDoRateio?.CODTBORCAMENTO ||
        contrato.TMOV_T_CODTBORCAMENTO,
      TITMMOV_T_DESCTBORCAMENTO:
        codNatProduto || natDoRateio?.DESCRICAO_NAT || contrato.TMOV_T_TBORCAMENTO,
      TITMMOV_T_PRECOUNITARIO: itemSelecionado.PRECOUNITARIO?.toFixed(2),
      TITMMOV_T_QUANTIDADE: itemSelecionado.QUANTIDADE ?? "",
      TITMMOV_T_VALORTOTALITEM: (
        itemSelecionado.PRECOUNITARIO * parseFloat(itemSelecionado.QUANTIDADE)
      ).toFixed(2),
      TITMMOV_T_CODCOLIGADA: contrato.TMOV_T_CODCOLIGADA,
      TITMMOV_T_CODFILIAL: contrato.TMOV_T_CODFILIAL,
      TITMMOV_T_CGCFIL: contrato.TMOV_T_CGCFIL,
      TITMMOV_T_DESCRICAO_CODFILIAL: contrato.DESCRICAO_CODFILIAL,
      TITMMOV_T_CODCFO: emissorNovoItem.CODCFO || contrato.TMOV_T_CODCFO,
      TITMMOV_T_DESCRICAO_CODCFO:
        emissorNovoItem.DESCRICAO_CODCFO || contrato.DESCRICAO_CODCFO,
      TITMMOV_T_CGCCFO: emissorNovoItem.CGCCFO || contrato.TMOV_T_CGCCFO,
      TITMMOV_T_CODCOLCFO:
        emissorNovoItem.CODCOLCFO ||
        contrato.TMOV_T_CODCOLCFO ||
        contrato.TMOV_T_CODCOLIGADA,
      TITMMOV_T_CODCCUSTO:
        centroCustoNovoItem.CODCCUSTO || contrato.TMOV_T_CODCCUSTO,
      TITMMOV_T_DESCRICAO_CODCCUSTO:
        centroCustoNovoItem.DESCRICAO_CODCCUSTO || contrato.DESCRICAO_CODCCUSTO,
    };
    if (
      itemInserir.TITMMOV_T_CODIGOPRD == "undefined" ||
      itemInserir.TITMMOV_T_QUANTIDADE == "" ||
      itemInserir.TITMMOV_T_PRECOUNITARIO == "undefined" ||
      itemInserir.TITMMOV_T_NOMEFANTASIA == "undefined"
    ) {
      return;
    }

    setListItems([...listItems, itemInserir]);
    setEmissorNovoItem(EMISSOR_ITEM_VAZIO);
    setCentroCustoNovoItem(CENTRO_CUSTO_ITEM_VAZIO);
    //setItemSelecionado({} as ITItmmovData)
  }

  return (
    <>
      {!readOnly && (
        <>
          {/* 1ª linha: Dados do emissor */}
          <Grid container spacing={1} marginTop={1}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                id="emissorCodCfo"
                label="Cód. Cfo."
                type="number"
                focused
                value={emissorNovoItem.CODCFO}
                onChange={(e) =>
                  setEmissorNovoItem({
                    ...emissorNovoItem,
                    CODCFO: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={12} md={5}>
              <TextField
                fullWidth
                size="small"
                id="emissorFornecedor"
                label="Fornecedor"
                focused
                value={emissorNovoItem.DESCRICAO_CODCFO}
                onChange={(e) =>
                  setEmissorNovoItem({
                    ...emissorNovoItem,
                    DESCRICAO_CODCFO: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={12} md={3}>
              <TextField
                fullWidth
                size="small"
                id="emissorCnpjCpf"
                label="Cnpj/Cpf"
                focused
                inputProps={{ maxLength: 14 }}
                value={emissorNovoItem.CGCCFO}
                onChange={(e) =>
                  setEmissorNovoItem({
                    ...emissorNovoItem,
                    CGCCFO: sanitizeCnpjCpf(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                aria-label="Buscar emissor do item"
                onClick={handleSearchEmissorNovoItemClick}
                disabled={isLoadingEmissor}
              >
                {isLoadingEmissor ? (
                  <CircularProgress size={20} />
                ) : (
                  <SearchOutlined />
                )}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                color="error"
                aria-label="limpar emissor do item"
                onClick={handleClearEmissorNovoItemClick}
              >
                <DeleteOutline />
              </Button>
            </Grid>
          </Grid>

          {/* 2ª linha: Dados do centro de custo */}
          <Grid container spacing={1} marginTop={1}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                id="centroCustoCodigo"
                label="Cód. Centro de Custo"
                focused
                value={centroCustoNovoItem.CODCCUSTO}
                onChange={(e) =>
                  setCentroCustoNovoItem({
                    ...centroCustoNovoItem,
                    CODCCUSTO: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                size="small"
                id="centroCustoNome"
                label="Centro de Custo"
                focused
                value={centroCustoNovoItem.DESCRICAO_CODCCUSTO}
                onChange={(e) =>
                  setCentroCustoNovoItem({
                    ...centroCustoNovoItem,
                    DESCRICAO_CODCCUSTO: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                aria-label="Buscar centro de custo do item"
                onClick={handleSearchCentroCustoNovoItemClick}
                disabled={isLoadingCentroCusto}
              >
                {isLoadingCentroCusto ? (
                  <CircularProgress size={20} />
                ) : (
                  <SearchOutlined />
                )}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                color="error"
                aria-label="limpar centro de custo do item"
                onClick={handleClearCentroCustoNovoItemClick}
              >
                <DeleteOutline />
              </Button>
            </Grid>
          </Grid>

          {/* 3ª linha: Dados do produto */}
          <Grid container spacing={1} marginTop={1}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo"
                focused
                value={solicitacaoPagamento.TMOVCOMPL_T_CODTIPO ?? ""}
                onChange={(e) =>
                  setSolicitacaoPagamento({
                    ...solicitacaoPagamento,
                    TMOVCOMPL_T_CODTIPO: e.target.value,
                  })
                }
              >
                <MenuItem value="S">Serviço</MenuItem>
                <MenuItem value="P">Produto</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                id="TITMMMOV_T_CODIGOPRD"
                label="Cód. Produto"
                focused
                value={itemSelecionado.CODIGOPRD ?? ""}
                onChange={(e) =>
                  setItemSelecionado({
                    ...itemSelecionado,
                    CODIGOPRD: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                size="small"
                id="TITMMMOV_T_NOMEFANTASIA"
                label="Item"
                focused
                value={itemSelecionado.NOMEFANTASIA ?? ""}
                onChange={(e) =>
                  setItemSelecionado({
                    ...itemSelecionado,
                    NOMEFANTASIA: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                aria-label="Buscar produto do RM"
                onClick={handleSearchItemClick}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : <SearchOutlined />}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                aria-label="Vincular com itens da nota"
                onClick={handleSearchInvoiceItemClick}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : <LinkOutlined />}
              </Button>
            </Grid>
          </Grid>

          {/* 4ª linha: Quantidade e valor */}
          <Grid container spacing={1} marginTop={1}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                id="TITMMOV_T_QUANTIDADE"
                label="Qtde."
                focused
                type="number"
                value={itemSelecionado.QUANTIDADE ?? ""}
                onChange={(e) =>
                  setItemSelecionado({
                    ...itemSelecionado,
                    QUANTIDADE: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                id="TITMMMOV_T_PRECOUNITARIO"
                label="R$ Unit."
                focused
                type="number"
                value={valorAux ?? ""}
                onChange={(e) => {
                  setValorAux(e.target.value);
                }}
                onBlur={() => {
                  setItemSelecionado({
                    ...itemSelecionado,
                    PRECOUNITARIO: parseFloat(valorAux),
                  });
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                color="success"
                aria-label="incluir item na solicitação"
                onClick={handleAddItemSolicitacao}
              >
                <AddOutlined />
              </Button>
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                color="error"
                aria-label="limpar busca"
                onClick={handleClearItemClick}
              >
                <DeleteOutline />
              </Button>
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                color="error"
                aria-label="Remover tudo"
                onClick={() => {
                  setListItems([]);
                  handleClearItemClick();
                }}
              >
                <ClearAll />
              </Button>
            </Grid>
          </Grid>
        </>
      )}

      <Box sx={{ width: "100%", height: 200, mt: 2 }}>
        <DataGrid columns={columnsItens} rows={data} density="compact" />
      </Box>
      <ItensModalSelect />
      <InvoiceItemsModalSelect />
      <FornecedorModalSelect />
      <CentroCustoModalSelect />
    </>
  );
}
